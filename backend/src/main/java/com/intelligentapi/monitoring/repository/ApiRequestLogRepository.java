package com.intelligentapi.monitoring.repository;

import com.intelligentapi.monitoring.model.ApiRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApiRequestLogRepository extends JpaRepository<ApiRequestLog, Long> {
}