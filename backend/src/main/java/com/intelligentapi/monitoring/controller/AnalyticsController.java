package com.intelligentapi.monitoring.controller;

import com.intelligentapi.monitoring.model.AbuseEvent;
import com.intelligentapi.monitoring.model.ApiRequestLog;
import com.intelligentapi.monitoring.service.MonitoringService;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final MonitoringService monitoringService;

    public AnalyticsController(MonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    // ---------- Existing endpoints (preserved) ----------

    @GetMapping("/slow-apis")
    public List<ApiRequestLog> getSlowApis() {
        return monitoringService.getSlowApis();
    }

    @GetMapping("/failed-apis")
    public List<ApiRequestLog> getFailedApis() {
        return monitoringService.getFailedApis();
    }

    @GetMapping("/top-endpoints")
    public List<Map<String, Object>> getTopEndpoints(
            @RequestParam(defaultValue = "10") int limit) {
        return monitoringService.getTopEndpointsFormatted(limit);
    }

    // ---------- New endpoints for dashboard ----------

    /** Summary stat cards: total, last hour, flagged, blocked, active users. */
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return monitoringService.getStats();
    }

    /** Live feed: most recent N request logs (default 50). */
    @GetMapping("/recent-logs")
    public List<ApiRequestLog> getRecentLogs(
            @RequestParam(defaultValue = "50") int limit) {
        return monitoringService.getRecentLogs(limit);
    }

    /** Abuse timeline: most recent N abuse events (default 50). */
    @GetMapping("/abuse-events")
    public List<AbuseEvent> getAbuseEvents(
            @RequestParam(defaultValue = "50") int limit) {
        return monitoringService.getRecentAbuseEvents(limit);
    }

    /** Time-series for line chart: requests per minute for last N minutes (default 30). */
    @GetMapping("/requests-per-minute")
    public List<Map<String, Object>> getRequestsPerMinute(
            @RequestParam(defaultValue = "30") int minutes) {
        return monitoringService.getRequestsPerMinute(minutes);
    }

    /** Pie/donut chart: status code distribution. */
    @GetMapping("/status-distribution")
    public List<Map<String, Object>> getStatusDistribution() {
        return monitoringService.getStatusDistribution();
    }

    /** Pie/donut chart: decision distribution (ALLOW/WARN/SLOW/BLOCK). */
    @GetMapping("/decision-distribution")
    public List<Map<String, Object>> getDecisionDistribution() {
        return monitoringService.getDecisionDistribution();
    }

    /** Leaderboard: top users by request count. */
    @GetMapping("/top-users")
    public List<Map<String, Object>> getTopUsers(
            @RequestParam(defaultValue = "10") int limit) {
        return monitoringService.getTopUsers(limit);
    }

    /** Demo helper: clears in-memory rule counters (use before starting a new simulation). */
    @PostMapping("/reset-counters")
    public Map<String, String> resetCounters() {
        monitoringService.resetCounters();
        return Map.of("status", "counters cleared");
    }
}