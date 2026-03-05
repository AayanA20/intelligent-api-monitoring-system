package com.intelligentapi.monitoring.controller;

import com.intelligentapi.monitoring.service.MonitoringService;
import com.intelligentapi.monitoring.model.ApiRequestLog;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final MonitoringService monitoringService;

    public AnalyticsController(MonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    @GetMapping("/slow-apis")
    public List<ApiRequestLog> getSlowApis() {
        return monitoringService.getSlowApis();
    }

    @GetMapping("/failed-apis")
    public List<ApiRequestLog> getFailedApis() {
        return monitoringService.getFailedApis();
    }

    @GetMapping("/top-endpoints")
public List<Object[]> getTopEndpoints(){
    return monitoringService.getTopEndpoints();
}
}