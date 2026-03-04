package com.intelligentapi.monitoring.controller;

import com.intelligentapi.monitoring.model.ApiRequestLog;
import org.springframework.web.bind.annotation.*;

@RestController // tells this class is responsible for handleing HTTP request
@RequestMapping("/api") // all endpoint start with /api
public class ApiLogController {

    @PostMapping("/log-request") //
    public String logRequest(@RequestBody ApiRequestLog log) { // convert JSON request into java object 

        System.out.println("Endpoint: " + log.getEndpoint());
        System.out.println("Response Time: " + log.getResponseTime());
        System.out.println("Status Code: " + log.getStatusCode());
        System.out.println("IP Address: " + log.getIpAddress());
        System.out.println("Timestamp: " + log.getTimestamp());

        return "Request logged successfully";
    }
}