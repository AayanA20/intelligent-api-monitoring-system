package com.intelligentapi.monitoring.controller;

import com.intelligentapi.monitoring.security.JwtUtil;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtUtil jwtUtil;

    public AuthController(JwtUtil jwtUtil){
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public Map<String,String> login(@RequestParam String username,
                                    @RequestParam String password){

        if(username.equals("admin") && password.equals("password")){

            String token = jwtUtil.generateToken(username);

            Map<String,String> response = new HashMap<>();
            response.put("token", token);

            return response;
        }

        throw new RuntimeException("Invalid credentials");
    }
}