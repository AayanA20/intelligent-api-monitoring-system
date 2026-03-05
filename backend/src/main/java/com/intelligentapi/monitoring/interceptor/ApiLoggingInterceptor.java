package com.intelligentapi.monitoring.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.intelligentapi.monitoring.service.MonitoringService;

@Component
public class ApiLoggingInterceptor implements HandlerInterceptor {

    private final MonitoringService monitoringService;

    public ApiLoggingInterceptor(MonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        System.out.println("INTERCEPTOR EXECUTED");

        String endpoint = request.getRequestURI();
        String method = request.getMethod();

        // Get authenticated user from JWT
        String user = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        System.out.println("Incoming API Request:");
        System.out.println("Endpoint: " + endpoint);
        System.out.println("Method: " + method);
        System.out.println("User: " + user);

        // Send user instead of IP to MonitoringService
        String decision = monitoringService.trackAndEvaluateRequest(user, endpoint);

        request.setAttribute("decision", decision);

        System.out.println("Security Decision: " + decision);

        if(decision.equals("BLOCK")){
            response.setStatus(403);
            response.getWriter().write("Request blocked due to suspicious behavior.");
            return false;
        }

        if(decision.equals("SLOW")){
            Thread.sleep(3000);
        }

        if(decision.equals("WARN")){
            System.out.println("Warning: Suspicious API usage detected.");
        }

        return true;
    }
}