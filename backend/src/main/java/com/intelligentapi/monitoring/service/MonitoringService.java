package com.intelligentapi.monitoring.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import com.intelligentapi.monitoring.detection.RuleEngine;
import com.intelligentapi.monitoring.interceptor.ApiLoggingInterceptor;
import com.intelligentapi.monitoring.model.AbuseEvent;
import com.intelligentapi.monitoring.model.ApiRequestLog;
import com.intelligentapi.monitoring.repository.AbuseEventRepository;
import com.intelligentapi.monitoring.repository.ApiRequestLogRepository;

@Service
public class MonitoringService {

    private final RuleEngine ruleEngine;
    private final ApiRequestLogRepository apiRequestLogRepository;
    private final AbuseEventRepository abuseEventRepository;
    private final MLServiceClient mlServiceClient;

    private final Map<String, Integer> requestCounter  = new ConcurrentHashMap<>();
    private final Map<String, Integer> heavyApiCounter = new ConcurrentHashMap<>();

    public MonitoringService(RuleEngine ruleEngine,
                             ApiRequestLogRepository apiRequestLogRepository,
                             AbuseEventRepository abuseEventRepository,
                             MLServiceClient mlServiceClient) {
        this.ruleEngine              = ruleEngine;
        this.apiRequestLogRepository = apiRequestLogRepository;
        this.abuseEventRepository    = abuseEventRepository;
        this.mlServiceClient         = mlServiceClient;
    }

    // ---------- Decision pipeline ----------

    public String trackAndEvaluateRequest(String user, String endpoint) {
        int requestCount = requestCounter.getOrDefault(user, 0) + 1;
        requestCounter.put(user, requestCount);

        int heavyCalls = heavyApiCounter.getOrDefault(user, 0);
        if (endpoint.equals("/api/heavy")) {
            heavyCalls++;
            heavyApiCounter.put(user, heavyCalls);
        }

        boolean botPattern = false;
        return ruleEngine.analyzeRequest(endpoint, requestCount, heavyCalls, botPattern);
    }

    /**
     * Resets ALL counters, blocked users, and ML behavioral sessions.
     * Called by the Attack Simulator "Reset counters" button.
     */
    public void resetCounters() {
        requestCounter.clear();
        heavyApiCounter.clear();
        // Clear permanently blocked users so simulator starts fresh
        ApiLoggingInterceptor.blockedUsers.clear();
        // Clear ML behavioral session history for all users
        mlServiceClient.resetBehavioralSessions();
        System.out.println("[MonitoringService] Full reset: counters, blocks, ML sessions.");
    }

    /**
     * Resets counters for ONE user only.
     * Called on login/register so new sessions start clean.
     */
    public void resetCountersForUser(String user) {
        if (user == null || user.isBlank()) return;
        requestCounter.remove(user);
        heavyApiCounter.remove(user);
    }

    // ---------- Analytics ----------

    public List<ApiRequestLog> getSlowApis() {
        return apiRequestLogRepository.findByResponseTimeGreaterThan(2000L);
    }

    public List<ApiRequestLog> getFailedApis() {
        return apiRequestLogRepository.findByStatusCodeGreaterThanEqual(500);
    }

    public List<Object[]> getTopEndpoints() {
        return apiRequestLogRepository.getTopEndpoints();
    }

    public List<ApiRequestLog> getRecentLogs(int limit) {
        return apiRequestLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit));
    }

    public List<AbuseEvent> getRecentAbuseEvents(int limit) {
        return abuseEventRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit));
    }

    public Map<String, Object> getStats() {
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        Instant fiveMinAgo = Instant.now().minus(5, ChronoUnit.MINUTES);

        long total       = apiRequestLogRepository.count();
        long lastHour    = apiRequestLogRepository.countByCreatedAtAfter(oneHourAgo);
        long abuseTotal  = abuseEventRepository.count();
        long blocked     = abuseEventRepository.countByDecision("BLOCK");
        long warned      = abuseEventRepository.countByDecision("WARN");
        long slowed      = abuseEventRepository.countByDecision("SLOW");
        long activeUsers = apiRequestLogRepository.getActiveUsers(fiveMinAgo).size();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalRequests",    total);
        stats.put("requestsLastHour", lastHour);
        stats.put("totalAbuseEvents", abuseTotal);
        stats.put("blockedRequests",  blocked);
        stats.put("warnedRequests",   warned);
        stats.put("slowedRequests",   slowed);
        stats.put("activeUsers",      activeUsers);
        return stats;
    }

    public List<Map<String, Object>> getRequestsPerMinute(int minutes) {
        Instant cutoff = Instant.now().minus(minutes, ChronoUnit.MINUTES);
        List<ApiRequestLog> recent = apiRequestLogRepository.findRecentSince(cutoff);

        Map<LocalDateTime, Long> buckets = new TreeMap<>();
        for (ApiRequestLog log : recent) {
            if (log.getCreatedAt() == null) continue;
            LocalDateTime minute = LocalDateTime
                .ofInstant(log.getCreatedAt(), ZoneId.systemDefault())
                .truncatedTo(ChronoUnit.MINUTES);
            buckets.merge(minute, 1L, Long::sum);
        }

        LocalDateTime start = LocalDateTime
            .ofInstant(cutoff, ZoneId.systemDefault())
            .truncatedTo(ChronoUnit.MINUTES);
        LocalDateTime end = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);

        List<Map<String, Object>> result = new ArrayList<>();
        LocalDateTime cur = start;
        while (!cur.isAfter(end)) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("minute", String.format("%02d:%02d", cur.getHour(), cur.getMinute()));
            point.put("count",  buckets.getOrDefault(cur, 0L));
            result.add(point);
            cur = cur.plusMinutes(1);
        }
        return result;
    }

    public List<Map<String, Object>> getStatusDistribution() {
        return toLabelCount(apiRequestLogRepository.getStatusDistribution(), "statusCode");
    }

    public List<Map<String, Object>> getDecisionDistribution() {
        return toLabelCount(apiRequestLogRepository.getDecisionDistribution(), "decision");
    }

    public List<Map<String, Object>> getTopUsers(int limit) {
        List<Object[]> rows = apiRequestLogRepository.getTopUsers(PageRequest.of(0, limit));
        return toLabelCount(rows, "user");
    }

    public List<Map<String, Object>> getTopEndpointsFormatted(int limit) {
        return apiRequestLogRepository.getTopEndpoints().stream()
            .limit(limit)
            .map(r -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("endpoint", r[0]);
                m.put("count",    r[1]);
                return m;
            })
            .collect(Collectors.toList());
    }

    private List<Map<String, Object>> toLabelCount(List<Object[]> rows, String labelKey) {
        return rows.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put(labelKey, r[0]);
            m.put("count",  r[1]);
            return m;
        }).collect(Collectors.toList());
    }
}