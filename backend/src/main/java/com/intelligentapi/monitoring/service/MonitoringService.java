package com.intelligentapi.monitoring.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.intelligentapi.monitoring.detection.RuleEngine;
import com.intelligentapi.monitoring.model.ApiRequestLog;
import com.intelligentapi.monitoring.repository.ApiRequestLogRepository;

@Service
public class MonitoringService {

    private final RuleEngine ruleEngine;
    private final ApiRequestLogRepository apiRequestLogRepository;

    // Track number of requests per IP
    private Map<String, Integer> requestCounter = new ConcurrentHashMap<>();

    // Track heavy API usage per IP
    private Map<String, Integer> heavyApiCounter = new ConcurrentHashMap<>();

    public MonitoringService(RuleEngine ruleEngine, ApiRequestLogRepository apiRequestLogRepository) {
        this.ruleEngine = ruleEngine;
        this.apiRequestLogRepository = apiRequestLogRepository;
    }

    // tracks request behavior and sends to RuleEngine
    public String trackAndEvaluateRequest(String ip, String endpoint) {

        // Increase total request count
        int requestCount = requestCounter.getOrDefault(ip, 0) + 1;
        requestCounter.put(ip, requestCount);

        // Get heavy API count
        int heavyCalls = heavyApiCounter.getOrDefault(ip, 0);

        // If the endpoint is heavy API
        if (endpoint.equals("/api/heavy")) {
            heavyCalls++;
            heavyApiCounter.put(ip, heavyCalls);
        }

        boolean botPattern = false;

        // Send values to RuleEngine
        return ruleEngine.analyzeRequest(endpoint, requestCount, heavyCalls, botPattern);
    }

    // Analytics methods

    public List<ApiRequestLog> getSlowApis() {
        return apiRequestLogRepository.findByResponseTimeGreaterThan(2000L);
    }

    public List<ApiRequestLog> getFailedApis() {
        return apiRequestLogRepository.findByStatusCodeGreaterThanEqual(500);
    }

    public List<Object[]> getTopEndpoints(){
        return apiRequestLogRepository.getTopEndpoints();
    }
}