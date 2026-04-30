package com.intelligentapi.monitoring.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "app_user")
public class User {

    @Id
    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;       // ⚠️ plain-text for now (matches existing code).
                                   // For production: hash with BCrypt.

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String role;           // "admin" or "user"

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public User() {}

    public User(String username, String password, String name, String email, String role) {
        this.username = username;
        this.password = password;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}