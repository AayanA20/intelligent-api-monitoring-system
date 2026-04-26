package com.intelligentapi.monitoring.controller;

import com.intelligentapi.monitoring.security.JwtUtil;
import com.intelligentapi.monitoring.service.MonitoringService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * Auth endpoints:
 *  POST /auth/login      -> { token, username, role, name }
 *  POST /auth/register   -> { token, username, role, name }   (always role=user)
 *  GET  /auth/me         -> { username, role, name }
 *
 * Uniqueness:
 *  - username: must be unique
 *  - email:    must be unique (one account per email)
 *  - "admin":  reserved username, cannot be registered
 *
 * On successful login OR register, the user's in-memory rule-engine counters
 * are wiped, so a brand-new user never inherits another user's blocked state
 * and a returning user starts a fresh session.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    // simple but reliable: something@something.something
    private static final Pattern EMAIL_RE =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final JwtUtil jwtUtil;
    private final MonitoringService monitoringService;

    // username -> UserRecord
    private final Map<String, UserRecord> users = new ConcurrentHashMap<>();
    // emailLower -> username (fast uniqueness check)
    private final Map<String, String> emailIndex = new ConcurrentHashMap<>();

    public AuthController(JwtUtil jwtUtil, MonitoringService monitoringService) {
        this.jwtUtil = jwtUtil;
        this.monitoringService = monitoringService;

        // Pre-seed the admin
        UserRecord adminRec = new UserRecord("password", "Administrator", "admin@apg.local", "admin");
        users.put("admin", adminRec);
        emailIndex.put(adminRec.email.toLowerCase(), "admin");
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String username = trim(body.get("username"));
        String password = body.get("password");

        if (username == null || username.isBlank() || password == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username and password required");
        }

        UserRecord stored = users.get(username);
        if (stored == null || !stored.password.equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        // Fresh session — clear any leftover counter state for this user
        monitoringService.resetCountersForUser(username);

        String token = jwtUtil.generateToken(username);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", username);
        response.put("role", stored.role);
        response.put("name", stored.name);
        return response;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> body) {
        String username = trim(body.get("username"));
        String password = body.get("password");
        String name     = trim(body.get("name"));
        String email    = trim(body.get("email"));

        // ---- validation ----
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }
        if (username.length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Username must be at least 3 characters");
        }
        if (password == null || password.length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be at least 4 characters");
        }
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name is required");
        }
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        if (!EMAIL_RE.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Please enter a valid email address");
        }

        // ---- uniqueness ----
        if ("admin".equalsIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Username 'admin' is reserved");
        }
        if (users.containsKey(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This username is already taken");
        }
        String emailLower = email.toLowerCase();
        if (emailIndex.containsKey(emailLower)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This email is already registered");
        }

        // ---- create user ----
        UserRecord rec = new UserRecord(password, name, email, "user");
        users.put(username, rec);
        emailIndex.put(emailLower, username);

        // Brand-new user gets brand-new state (no leftover counters)
        monitoringService.resetCountersForUser(username);

        String token = jwtUtil.generateToken(username);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", username);
        response.put("role", "user");
        response.put("name", name);
        return response;
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String username = auth.getName();
        UserRecord rec = users.get(username);
        Map<String, Object> response = new HashMap<>();
        response.put("username", username);
        response.put("role", rec == null ? "user" : rec.role);
        response.put("name", rec == null ? username : rec.name);
        return response;
    }

    // ---- helpers ----
    private static String trim(String s) {
        return s == null ? null : s.trim();
    }

    private static class UserRecord {
        final String password;
        final String name;
        final String email;
        final String role;
        UserRecord(String password, String name, String email, String role) {
            this.password = password;
            this.name = name;
            this.email = email;
            this.role = role;
        }
    }
}