package com.intelligentapi.monitoring.service;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Map;

@Component
public class MLServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String ML_URL = "http://localhost:8000/predict";

    public String getDecision(String method, String url,
                               Map<String, String> headers,
                               String body, int statusCode,
                               String responseBody) {
        try {
            Map<String, Object> payload = Map.of(
                "method",        method,
                "url",           url,
                "headers",       headers,
                "body",          body == null ? "" : body,
                "status_code",   statusCode,
                "response_body", responseBody == null ? "" : responseBody
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
        return "ALLOW"; // safe fallback if ML service is down
    }
}