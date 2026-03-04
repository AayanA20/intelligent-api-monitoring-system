// 1️ Receives the request from client (Postman / frontend)
// 2️ send the request to service and service convert the json data to java object 
// 3️ Processes the request
// 4️ Sends response back to the client

package com.intelligentapi.monitoring.controller;

import com.intelligentapi.monitoring.model.ApiRequestLog;
import com.intelligentapi.monitoring.service.ApiLogService; 
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ApiLogController {

    @Autowired
    private ApiLogService apiLogService;

    @PostMapping("/log-request")
    public String logRequest(@RequestBody ApiRequestLog log) {

        apiLogService.logApiRequest(log);

        return "Request logged successfully";
    }
}