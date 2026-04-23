// Entity representing an abuse event: any request flagged as WARN, SLOW, or BLOCK
// by the RuleEngine. Separate from api_request_log so we can quickly query
// only the "interesting" events for the dashboard abuse timeline.

package com.intelligentapi.monitoring.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "abuse_event")
public class AbuseEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_name")
    private String userName;

    private String endpoint;

    private String ipAddress;

    private String decision;            // WARN / SLOW / BLOCK

    @Column(length = 500)
    private String reason;              // human-readable reason

    private String timestamp;           // human-readable

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public AbuseEvent() {}

    public Long getId() { return id; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}