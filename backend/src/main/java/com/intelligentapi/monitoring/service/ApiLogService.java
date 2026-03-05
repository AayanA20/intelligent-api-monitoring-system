// The service layer contains the business logic of the application.
// It processes the data received from the controller and performs
// operations such as logging, validation, database interaction,
// and communication with other services.

package com.intelligentapi.monitoring.service;

import com.intelligentapi.monitoring.model.ApiRequestLog;
import com.intelligentapi.monitoring.repository.ApiRequestLogRepository;
import org.springframework.stereotype.Service;

@Service
public class ApiLogService {

    private final ApiRequestLogRepository repository;

    public ApiLogService(ApiRequestLogRepository repository) {
        this.repository = repository;
    }

    public ApiRequestLog logApiRequest(ApiRequestLog log) {

        System.out.println("Endpoint: " + log.getEndpoint());
        System.out.println("Response Time: " + log.getResponseTime());
        System.out.println("Status Code: " + log.getStatusCode());
        System.out.println("IP Address: " + log.getIpAddress());
        System.out.println("Timestamp: " + log.getTimestamp());

        // 🔹 THIS LINE SAVES DATA TO POSTGRESQL
        System.out.println("Saving log to database...");
        return repository.save(log);
    }

}