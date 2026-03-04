package com.intelligentapi.monitoring.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class ApiLoggingInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {

        String endpoint = request.getRequestURI();
        String method = request.getMethod();
        String ip = request.getRemoteAddr();

        System.out.println("Incoming API Request:");
        System.out.println("Endpoint: " + endpoint);
        System.out.println("Method: " + method);
        System.out.println("IP Address: " + ip);

        return true;
    }
}