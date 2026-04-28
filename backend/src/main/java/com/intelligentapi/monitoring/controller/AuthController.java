package com.intelligentapi.monitoring.controller;

import com.intelligentapi.monitoring.model.User;
import com.intelligentapi.monitoring.repository.UserRepository;
import com.intelligentapi.monitoring.security.JwtUtil;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

/**
 * Auth endpoints:
 *   POST /auth/register  → creates user in PostgreSQL with BCrypt password
 *   POST /auth/login     → verifies against DB, returns JWT
 *   GET  /auth/me        → returns current user info from JWT
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtUtil              jwtUtil;
    private final UserRepository       userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthController(JwtUtil jwtUtil, UserRepository userRepository,
                          BCryptPasswordEncoder passwordEncoder) {
        this.jwtUtil         = jwtUtil;
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;

        // Seed default admin if not already in DB
        seedAdmin();
    }

    // ── Register ──────────────────────────────────────────────────────
    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> body) {
        String name     = body.getOrDefault("name", "").trim();
        String username = body.getOrDefault("username", "").trim();
        String email    = body.getOrDefault("email", "").trim();
        String password = body.getOrDefault("password", "");

        // Validation
        if (username.isBlank() || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username and password required");
        }
        if (username.length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username must be at least 3 characters");
        }
        if (password.length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password must be at least 4 characters");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "username already taken");
        }
        if (!email.isBlank() && userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already registered");
        }

        // Save user with BCrypt hashed password
        User user = new User(
            name.isBlank() ? username : name,
            username,
            email.isBlank() ? null : email,
            passwordEncoder.encode(password),   // ← BCrypt hash
            "user"
        );
        userRepository.save(user);

        String token = jwtUtil.generateToken(username);
        return buildResponse(user, token);
    }

    // ── Login ─────────────────────────────────────────────────────────
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "").trim();
        String password = body.getOrDefault("password", "");

        if (username.isBlank() || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username and password required");
        }

        User user = userRepository.findByUsername(username)
            .orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        // BCrypt comparison — never compare plain text
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        String token = jwtUtil.generateToken(username);
        return buildResponse(user, token);
    }

    // ── Me ────────────────────────────────────────────────────────────
    @GetMapping("/me")
    public Map<String, Object> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        User user = userRepository.findByUsername(auth.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return buildResponse(user, null);
    }

    // ── Helpers ───────────────────────────────────────────────────────
    private Map<String, Object> buildResponse(User user, String token) {
        Map<String, Object> res = new HashMap<>();
        if (token != null) res.put("token", token);
        res.put("username",  user.getUsername());
        res.put("name",      user.getName());
        res.put("email",     user.getEmail());
        res.put("role",      user.getRole());
        res.put("createdAt", user.getCreatedAt());
        return res;
    }

    /**
     * Seeds the default admin account on first startup.
     * Password is BCrypt hashed — safe to store in DB.
     */
    private void seedAdmin() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User(
                "Administrator",
                "admin",
                "admin@apiguardian.local",
                passwordEncoder.encode("password"),   // BCrypt hashed
                "admin"
            );
            userRepository.save(admin);
            System.out.println("✅ Default admin user created in database");
        }
    }
}