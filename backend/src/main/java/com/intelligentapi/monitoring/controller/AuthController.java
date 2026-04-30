package com.intelligentapi.monitoring.controller;

import com.intelligentapi.monitoring.interceptor.ApiLoggingInterceptor;
import com.intelligentapi.monitoring.model.User;
import com.intelligentapi.monitoring.repository.UserRepository;
import com.intelligentapi.monitoring.security.JwtUtil;
import com.intelligentapi.monitoring.service.MonitoringService;

import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Pattern EMAIL_RE =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final JwtUtil jwtUtil;
    private final MonitoringService monitoringService;
    private final UserRepository userRepository;

    public AuthController(JwtUtil jwtUtil,
                          MonitoringService monitoringService,
                          UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.monitoringService = monitoringService;
        this.userRepository = userRepository;
    }

    /**
     * Seed the admin user on startup if they don't already exist.
     * This runs ONCE per app start. The admin row stays in the DB after that.
     */
    @PostConstruct
    public void seedAdmin() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User("admin", "password", "Administrator",
                                  "admin@apg.local", "admin");
            userRepository.save(admin);
            System.out.println("[AuthController] Admin user seeded");
        }
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String username = trim(body.get("username"));
        String password = body.get("password");

        if (username == null || username.isBlank() || password == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username and password required");
        }

        Optional<User> stored = userRepository.findByUsername(username);
        if (stored.isEmpty() || !stored.get().getPassword().equals(password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        User u = stored.get();

        // Fresh session — clear counters AND remove from blocked list
        monitoringService.resetCountersForUser(username);
        ApiLoggingInterceptor.unblockUser(username);

        String token = jwtUtil.generateToken(username);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", u.getUsername());
        response.put("role", u.getRole());
        response.put("name", u.getName());
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
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This username is already taken");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This email is already registered");
        }

        // ---- create user ----
        User newUser = new User(username, password, name, email, "user");
        userRepository.save(newUser);

        // Brand-new user — completely clean slate
        monitoringService.resetCountersForUser(username);
        ApiLoggingInterceptor.unblockUser(username);

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
        Optional<User> rec = userRepository.findByUsername(username);

        Map<String, Object> response = new HashMap<>();
        response.put("username", username);
        response.put("role", rec.map(User::getRole).orElse("user"));
        response.put("name", rec.map(User::getName).orElse(username));
        return response;
    }

    private static String trim(String s) {
        return s == null ? null : s.trim();
    }
}