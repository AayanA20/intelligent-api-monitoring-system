// This flie is created beacuse in Spring BOot all the HTTP request are handel by the controller 

package com.intelligentapi.monitoring.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController // tell spring boot that this class handel REST API request 
public class HelloController {

    @GetMapping("/hello")// this tell when someone sends a GET request to /hello , run this 
    public String hello() {
        return "Backend is running successfully!";
    }
}