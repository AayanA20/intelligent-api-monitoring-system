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

import java.time.LocalDateTime;

/**
 * Intercepts /api/** requests:
 *  1. Captures start time + user + endpoint.
 *  2. Calls RuleEngine via MonitoringService → decision (ALLOW/WARN/SLOW/BLOCK).
 *  3. Persists an ApiRequestLog for every request.
 *  4. Persists an AbuseEvent when decision != ALLOW.
 *  5. Applies the decision action (block / slow down / warn).
 */
@Component
public class ApiLoggingInterceptor implements HandlerInterceptor {

    private final MonitoringService monitoringService;
    private final ApiRequestLogRepository logRepository;
    private final AbuseEventRepository abuseRepository;

    public ApiLoggingInterceptor(MonitoringService monitoringService,
                                 ApiRequestLogRepository logRepository,
                                 AbuseEventRepository abuseRepository) {
        this.monitoringService = monitoringService;
        this.logRepository = logRepository;
        this.abuseRepository = abuseRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        request.setAttribute("startTime", System.currentTimeMillis());

        String endpoint = request.getRequestURI();
        String method = request.getMethod();
        String user = resolveUser();
        String ip = request.getRemoteAddr();

        request.setAttribute("endpoint", endpoint);
        request.setAttribute("method", method);
        request.setAttribute("user", user);
        request.setAttribute("ip", ip);

        String decision = monitoringService.trackAndEvaluateRequest(user, endpoint);
        request.setAttribute("decision", decision);

        System.out.println("[" + method + "] " + endpoint + " | user=" + user + " | decision=" + decision);

        // Persist abuse event whenever decision is not ALLOW
        if (!"ALLOW".equals(decision)) {
            saveAbuseEvent(user, endpoint, ip, decision, reasonFor(decision, endpoint));
        }

        if ("BLOCK".equals(decision)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\":\"BLOCKED\",\"message\":\"Request blocked due to suspicious behavior.\"}"
            );
            // afterCompletion won't fire because we return false, so save log inline
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
            String method = (String) request.getAttribute("method");
            String user = (String) request.getAttribute("user");
            String ip = (String) request.getAttribute("ip");
            String decision = (String) request.getAttribute("decision");

            if (decision == null) decision = "ALLOW";

            saveLog(endpoint, method, user, decision, responseTime, response.getStatus(), ip);
        } catch (Exception e) {
            System.err.println("Failed to save API log: " + e.getMessage());
        }
    }

    // ---------- helpers ----------

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

    private String reasonFor(String decision, String endpoint) {
        return switch (decision) {
            case "BLOCK" -> "Bot-like behavior or request flood detected";
            case "SLOW"  -> "Expensive API abuse on " + endpoint;
            case "WARN"  -> "Possible endpoint looping on " + endpoint;
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

    private void saveAbuseEvent(String user, String endpoint, String ip, String decision, String reason) {
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