package com.intelligentapi.monitoring.detection;

import org.springframework.stereotype.Component;

@Component
public class RuleEngine {

    public String analyzeRequest(String endpoint, int requestCount, int heavyCalls, boolean botPattern) {

        // 1️⃣ Bot Behaviour (Most Severe)
        if(botPattern || requestCount > 50){
            return "BLOCK";
        }

        // 2️⃣ Expensive API Abuse
        if(endpoint.equals("/api/heavy") && heavyCalls > 5){
            return "SLOW";
        }

        // 3️⃣ Endpoint Looping
        if(requestCount > 20){
            return "WARN";
        }

        return "ALLOW";
    }
}