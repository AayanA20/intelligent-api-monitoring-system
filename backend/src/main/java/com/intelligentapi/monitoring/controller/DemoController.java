// Demo Controller for generating traffic to test monitoring and alerting system
package com.intelligentapi.monitoring.controller;

import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
public class DemoController {

    @GetMapping("/heavy")
    public String heavyApi(HttpServletRequest request) {

        String decision = (String) request.getAttribute("decision");

        return "Heavy API Response | Action: " + decision;
    }

    @GetMapping("/normal")
    public String normalApi(HttpServletRequest request) {

        String decision = (String) request.getAttribute("decision");

        return "Normal API Response | Action: " + decision;
    }
}