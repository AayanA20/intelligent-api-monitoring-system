// Entity representing an API request log record.
// Each row stores one API call's metadata for monitoring + analytics.

package com.intelligentapi.monitoring.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "api_request_log")
public class ApiRequestLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String endpoint;

    private String method;              // HTTP method: GET/POST/etc.

    private long responseTime;          // in milliseconds

    private int statusCode;

    private String ipAddress;

    private String timestamp;           // human-readable string (kept for compatibility)

    @Column(name = "user_name")
    private String userName;            // "anonymous" if unauthenticated

    private String decision;            // ALLOW / WARN / SLOW / BLOCK

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;          // auto-set by Hibernate; used for time-series queries

    public ApiRequestLog() {}

    // --- Getters and Setters ---

    public Long getId() { return id; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public long getResponseTime() { return responseTime; }
    public void setResponseTime(long responseTime) { this.responseTime = responseTime; }

    public int getStatusCode() { return statusCode; }
    public void setStatusCode(int statusCode) { this.statusCode = statusCode; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}