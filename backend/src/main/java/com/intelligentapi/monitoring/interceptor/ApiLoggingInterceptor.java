package com.intelligentapi.monitoring.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.intelligentapi.monitoring.model.AbuseEvent;
import com.intelligentapi.monitoring.model.ApiRequestLog;
import com.intelligentapi.monitoring.repository.AbuseEventRepository;
import com.intelligentapi.monitoring.repository.ApiRequestLogRepository;
import com.intelligentapi.monitoring.service.MonitoringService;
import com.intelligentapi.monitoring.service.MLServiceClient;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ApiLoggingInterceptor implements HandlerInterceptor {

    // Permanently blocked users (by username)
    public static final Set<String> blockedUsers =
        ConcurrentHashMap.newKeySet();

    // Permanently blocked IPs — belt-and-suspenders in case user resolves differently
    public static final Set<String> blockedIps =
        ConcurrentHashMap.newKeySet();

    private final MonitoringService monitoringService;
    private final MLServiceClient mlServiceClient;
    private final ApiRequestLogRepository logRepository;
    private final AbuseEventRepository abuseRepository;

    public ApiLoggingInterceptor(MonitoringService monitoringService,
                                 MLServiceClient mlServiceClient,
                                 ApiRequestLogRepository logRepository,
                                 AbuseEventRepository abuseRepository) {
        this.monitoringService = monitoringService;
        this.mlServiceClient   = mlServiceClient;
        this.logRepository     = logRepository;
        this.abuseRepository   = abuseRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        request.setAttribute("startTime", System.currentTimeMillis());

        String endpoint = request.getRequestURI();
        String method   = request.getMethod();
        String user     = resolveUser();
        String ip       = request.getRemoteAddr();

        // Build full decoded URL including query params
        String queryString = request.getQueryString();
        String decodedQuery = "";
        if (queryString != null) {
            try {
                decodedQuery = "?" + java.net.URLDecoder.decode(queryString, "UTF-8");
            } catch (Exception e) {
                decodedQuery = "?" + queryString;
            }
        }
        String fullUrl = request.getRequestURL().toString() + decodedQuery;

        request.setAttribute("endpoint", endpoint);
        request.setAttribute("method",   method);
        request.setAttribute("user",     user);
        request.setAttribute("ip",       ip);

        // ── Check permanent block by USERNAME or IP ──
        boolean isPermanentlyBlocked = blockedUsers.contains(user) || blockedIps.contains(ip);
        if (isPermanentlyBlocked) {
            System.out.println("[BLOCKED] Permanent block hit: user=" + user + " ip=" + ip);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\":\"BLOCKED\",\"message\":\"Permanently blocked due to prior abuse.\"}"
            );
            saveLog(endpoint, method, user, "BLOCK", 0, 403, ip);
            return false;
        }

        // ── Rule engine decision ──
        String ruleDecision = monitoringService.trackAndEvaluateRequest(user, endpoint);

        // ── ML model decision ──
        String mlDecision = mlServiceClient.getDecision(
            method, fullUrl, Collections.emptyMap(), null, 200, null
        );

        // ── Merge: take the more severe of the two ──
        String decision = mergeDecisions(ruleDecision, mlDecision);
        request.setAttribute("decision", decision);

        System.out.println("[" + method + "] " + endpoint
            + " | user=" + user
            + " | ip=" + ip
            + " | rule=" + ruleDecision
            + " | ml=" + mlDecision
            + " | final=" + decision);

        // ── Permanently block if BLOCK decision ──
        if ("BLOCK".equals(decision)) {
            blockedUsers.add(user);
            blockedIps.add(ip);
            System.out.println("[BLOCKED] Added to permanent block: user=" + user + " ip=" + ip);
        }

        // Persist abuse event for non-ALLOW decisions
        if (!"ALLOW".equals(decision)) {
            saveAbuseEvent(user, endpoint, ip, decision,
                reasonFor(decision, endpoint, ruleDecision, mlDecision));
        }

        if ("BLOCK".equals(decision)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\":\"BLOCKED\",\"message\":\"Request blocked due to suspicious behavior.\"}"
            );
            saveLog(endpoint, method, user, decision, 0, 403, ip);
            return false;
        }

        if ("SLOW".equals(decision)) {
            Thread.sleep(3000);
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {
        try {
            Long startTime = (Long) request.getAttribute("startTime");
            if (startTime == null) return;

            long responseTime = System.currentTimeMillis() - startTime;

            String endpoint = (String) request.getAttribute("endpoint");
            String method   = (String) request.getAttribute("method");
            String user     = (String) request.getAttribute("user");
            String ip       = (String) request.getAttribute("ip");
            String decision = (String) request.getAttribute("decision");

            if (decision == null) decision = "ALLOW";

            saveLog(endpoint, method, user, decision, responseTime, response.getStatus(), ip);
        } catch (Exception e) {
            System.err.println("Failed to save API log: " + e.getMessage());
        }
    }

    // ---------- helpers ----------

    private String mergeDecisions(String rule, String ml) {
        List<String> order = List.of("ALLOW", "WARN", "SLOW", "BLOCK");
        int ruleIdx = order.indexOf(rule);
        int mlIdx   = order.indexOf(ml);
        if (mlIdx == -1) return rule;
        return order.get(Math.max(ruleIdx, mlIdx));
    }

    private String resolveUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) return "anonymous";
            String name = auth.getName();
            if (name == null || name.isBlank() || "anonymousUser".equals(name)) return "anonymous";
            return name;
        } catch (Exception e) {
            return "anonymous";
        }
    }

    private String reasonFor(String decision, String endpoint,
                              String ruleDecision, String mlDecision) {
        String source = mlDecision.equals(decision) ? "ML Model" : "Rule Engine";
        return switch (decision) {
            case "BLOCK" -> "Attack payload or bot flood detected [" + source + "]";
            case "SLOW"  -> "Expensive API abuse on " + endpoint + " [" + source + "]";
            case "WARN"  -> "Suspicious pattern on " + endpoint + " [" + source + "]";
            default      -> "Unknown";
        };
    }

    private void saveLog(String endpoint, String method, String user, String decision,
                         long responseTime, int statusCode, String ip) {
        try {
            ApiRequestLog log = new ApiRequestLog();
            log.setEndpoint(endpoint);
            log.setMethod(method);
            log.setResponseTime(responseTime);
            log.setStatusCode(statusCode);
            log.setIpAddress(ip);
            log.setTimestamp(LocalDateTime.now().toString());
            log.setUserName(user);
            log.setDecision(decision);
            logRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to persist ApiRequestLog: " + e.getMessage());
        }
    }

    private void saveAbuseEvent(String user, String endpoint,
                                 String ip, String decision, String reason) {
        try {
            AbuseEvent event = new AbuseEvent();
            event.setUserName(user);
            event.setEndpoint(endpoint);
            event.setIpAddress(ip);
            event.setDecision(decision);
            event.setReason(reason);
            event.setTimestamp(LocalDateTime.now().toString());
            abuseRepository.save(event);
        } catch (Exception e) {
            System.err.println("Failed to persist AbuseEvent: " + e.getMessage());
        }
    }
}