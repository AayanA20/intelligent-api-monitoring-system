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

    // Track requests per USER
    private Map<String, Integer> requestCounter = new ConcurrentHashMap<>();

    // Track heavy API usage per USER
    private Map<String, Integer> heavyApiCounter = new ConcurrentHashMap<>();

    public MonitoringService(RuleEngine ruleEngine,
                             ApiRequestLogRepository apiRequestLogRepository) {
        this.ruleEngine = ruleEngine;
        this.apiRequestLogRepository = apiRequestLogRepository;
    }

    // Track behavior based on USER
    public String trackAndEvaluateRequest(String user, String endpoint) {

        int requestCount = requestCounter.getOrDefault(user, 0) + 1;
        requestCounter.put(user, requestCount);

        int heavyCalls = heavyApiCounter.getOrDefault(user, 0);

        if(endpoint.equals("/api/heavy")){
            heavyCalls++;
            heavyApiCounter.put(user, heavyCalls);
        }

        boolean botPattern = false;

        return ruleEngine.analyzeRequest(endpoint, requestCount, heavyCalls, botPattern);
    }

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