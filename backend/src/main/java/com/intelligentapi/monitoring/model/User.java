package com.intelligentapi.monitoring.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "username"),
           @UniqueConstraint(columnNames = "email")
       })
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String password;          // BCrypt hashed — never plain text

    @Column(nullable = false)
    private String role = "user";     // "admin" or "user"

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Constructors ──────────────────────────────────────────────────
    public User() {}

    public User(String name, String username, String email, String password, String role) {
        this.name      = name;
        this.username  = username;
        this.email     = email;
        this.password  = password;
        this.role      = role;
        this.createdAt = LocalDateTime.now();
    }

    // ── Getters & Setters ─────────────────────────────────────────────
    public Long getId()                        { return id; }
    public String getName()                    { return name; }
    public void setName(String name)           { this.name = name; }
    public String getUsername()                { return username; }
    public void setUsername(String username)   { this.username = username; }
    public String getEmail()                   { return email; }
    public void setEmail(String email)         { this.email = email; }
    public String getPassword()                { return password; }
    public void setPassword(String password)   { this.password = password; }
    public String getRole()                    { return role; }
    public void setRole(String role)           { this.role = role; }
    public LocalDateTime getCreatedAt()        { return createdAt; }
}