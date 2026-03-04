// Demo Controller for generating traffic to test monitoring and alerting system
package com.intelligentapi.monitoring.controller;

import org.springframework.web.bind.annotation.*;
import com.intelligentapi.monitoring.service.MonitoringService;

@RestController
@RequestMapping("/api")
public class DemoController {

    private final MonitoringService monitoringService;

    public DemoController(MonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    @GetMapping("/heavy")
    public String heavyApi() throws InterruptedException {

        String action = monitoringService.evaluateRequest("/api/heavy",6,0,false);

        if(action.equals("SLOW")){
            Thread.sleep(3000);
        }

        return "Heavy API Response | Action: " + action;
    }
}