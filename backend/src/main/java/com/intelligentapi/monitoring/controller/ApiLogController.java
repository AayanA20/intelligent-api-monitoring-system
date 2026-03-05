// 1️ Receives the request from client (Postman / frontend)
// 2️ send the request to service and service convert the json data to java object 
// 3️ Processes the request
// 4️ Sends response back to the client

package com.intelligentapi.monitoring.controller;

import com.intelligentapi.monitoring.model.ApiRequestLog;
import com.intelligentapi.monitoring.service.ApiLogService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ApiLogController {

    private final ApiLogService apiLogService;

    public ApiLogController(ApiLogService apiLogService) {
        this.apiLogService = apiLogService;
    }

    @PostMapping("/log-request")
    public ApiRequestLog logRequest(@RequestBody ApiRequestLog log) {
        return apiLogService.logApiRequest(log);
    }
}