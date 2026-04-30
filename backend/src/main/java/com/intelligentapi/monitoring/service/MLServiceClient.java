package com.intelligentapi.monitoring.service;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Map;

@Component
public class MLServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String ML_URL      = "http://your-ml-api.onrender.com/predict";
    private static final String ML_RESET_URL = "https://your-ml-service.onrender.com/reset";

    /**
     * Ask the ML service whether this request is abusive.
     * The 'user' field is critical — behavior_extractor.py maintains
     * a separate session per user so scores don't bleed across users.
     */
    public String getDecision(String method, String url,
                               Map<String, String> headers,
                               String body, int statusCode,
                               String responseBody, String user) {
        try {
            Map<String, Object> payload = Map.of(
                "method",        method,
                "url",           url,
                "headers",       headers != null ? headers : Map.of(),
                "body",          body == null ? "" : body,
                "status_code",   statusCode,
                "response_body", responseBody == null ? "" : responseBody,
                "user",          user == null ? "anonymous" : user
            );

            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, httpHeaders);

            ResponseEntity<Map> response =
                restTemplate.postForEntity(ML_URL, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return (String) response.getBody().get("label");
            }
        } catch (Exception e) {
            System.err.println("[MLServiceClient] ML service unreachable: " + e.getMessage());
        }
        return "ALLOW";
    }

    /**
     * Tell the ML service to clear all behavioral sessions.
     * Called when the attack simulator resets counters.
     */
    public void resetBehavioralSessions() {
        try {
            restTemplate.postForEntity(ML_RESET_URL, null, Map.class);
            System.out.println("[MLServiceClient] ML behavioral sessions reset.");
        } catch (Exception e) {
            System.err.println("[MLServiceClient] Reset failed: " + e.getMessage());
        }
    }
}