package com.intelligentapi.monitoring.controller;

import com.intelligentapi.monitoring.security.JwtUtil;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Auth endpoints:
 *  POST /auth/login      -> { token, username }
 *  POST /auth/register   -> { token, username }   (stores user in memory for demo)
 *  GET  /auth/me         -> { username }          (requires valid JWT)
 *
 * For the minor project demo, users are stored in memory so you don't need a
 * users table. The default user "admin / password" is pre-seeded.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtUtil jwtUtil;

    // In-memory user store { username -> password }. Fine for a minor-project demo.
    private final Map<String, String> users = new ConcurrentHashMap<>();

    public AuthController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
        // seed a default admin user
        users.put("admin", "password");
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username and password required");
        }

        String stored = users.get(username);
        if (stored == null || !stored.equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtUtil.generateToken(username);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", username);
        return response;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username and password required");
        }
        if (users.containsKey(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "username already exists");
        }

        users.put(username, password);
        String token = jwtUtil.generateToken(username);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", username);
        return response;
    }

    @GetMapping("/me")
    public Map<String, String> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return Map.of("username", auth.getName());
    }
}