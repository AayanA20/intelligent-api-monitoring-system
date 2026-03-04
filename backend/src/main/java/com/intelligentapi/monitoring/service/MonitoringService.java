package com.intelligentapi.monitoring.service;

import org.springframework.stereotype.Service;
import com.intelligentapi.monitoring.detection.RuleEngine;

@Service
public class MonitoringService {

    private final RuleEngine ruleEngine;

    public MonitoringService(RuleEngine ruleEngine) {
        this.ruleEngine = ruleEngine;
    }

    public String evaluateRequest(String endpoint, int requestCount, int heavyCalls, boolean botPattern){

        String decision = ruleEngine.analyzeRequest(endpoint, requestCount, heavyCalls, botPattern);

        return decision;
    }
}