//Rule Detcion Engine to analyze API request patterns and determine if they are malicious or not
package com.intelligentapi.monitoring.detection;

import org.springframework.stereotype.Component;

@Component
public class RuleEngine {

    public String analyzeRequest(String endpoint, int requestCount, int heavyCalls, boolean botPattern) {

        // 1️⃣ Expensive API Abuse
        if(endpoint.equals("/api/heavy") && heavyCalls > 5){
            return "SLOW";
        }

        // 2️⃣ Endpoint Looping
        if(requestCount > 20){
            return "WARN";
        }

        // 3️⃣ Bot Behaviour
        if(botPattern){
            return "BLOCK";
        }

        return "ALLOW";
    }
}
