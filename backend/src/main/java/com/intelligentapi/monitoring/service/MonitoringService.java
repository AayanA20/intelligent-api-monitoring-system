package com.intelligentapi.monitoring.service;

import org.springframework.stereotype.Service;
import java.util.List;

import com.intelligentapi.monitoring.detection.RuleEngine;
import com.intelligentapi.monitoring.model.ApiRequestLog;
import com.intelligentapi.monitoring.repository.ApiRequestLogRepository;

@Service
public class MonitoringService {

    private final RuleEngine ruleEngine;
    private final ApiRequestLogRepository apiRequestLogRepository;

    public MonitoringService(RuleEngine ruleEngine, ApiRequestLogRepository apiRequestLogRepository) {
        this.ruleEngine = ruleEngine;
        this.apiRequestLogRepository = apiRequestLogRepository;
    }

    public String evaluateRequest(String endpoint, int requestCount, int heavyCalls, boolean botPattern){

        String decision = ruleEngine.analyzeRequest(endpoint, requestCount, heavyCalls, botPattern);

        return decision;
    }

    public List<ApiRequestLog> getSlowApis() {
        return apiRequestLogRepository.findByResponseTimeGreaterThan(2000L);
    }

    public List<ApiRequestLog> getFailedApis() {
        return apiRequestLogRepository.findByStatusCodeGreaterThanEqual(500);
    }
//Which APIs are used most
    public List<Object[]> getTopEndpoints(){
    return apiRequestLogRepository.getTopEndpoints();
}
}