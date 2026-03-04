// We create a Java object so that Spring Boot can send and receive JSON data.
// This model class represents the data structure of an API request.
// It defines what information we store for each API request.

package com.intelligentapi.monitoring.model;

// This class represents a single API request log
public class ApiRequestLog {

    private String endpoint;
    private long responseTime;
    private int statusCode;
    private String ipAddress;
    private String timestamp;

    // Default constructor required for JSON conversion
    public ApiRequestLog() {}

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public long getResponseTime() {
        return responseTime;
    }

    public void setResponseTime(long responseTime) {
        this.responseTime = responseTime;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}