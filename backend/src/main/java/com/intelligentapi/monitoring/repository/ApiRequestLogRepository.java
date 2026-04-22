package com.intelligentapi.monitoring.repository;

import com.intelligentapi.monitoring.model.ApiRequestLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ApiRequestLogRepository extends JpaRepository<ApiRequestLog, Long> {

    // Existing queries (preserved)
    List<ApiRequestLog> findByResponseTimeGreaterThan(Long time);

    List<ApiRequestLog> findByStatusCodeGreaterThanEqual(int statusCode);

    @Query("SELECT a.endpoint, COUNT(a) FROM ApiRequestLog a GROUP BY a.endpoint ORDER BY COUNT(a) DESC")
    List<Object[]> getTopEndpoints();

    // --- New queries for dashboard ---

    List<ApiRequestLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByCreatedAtAfter(Instant cutoff);

    @Query("SELECT a.statusCode, COUNT(a) FROM ApiRequestLog a GROUP BY a.statusCode")
    List<Object[]> getStatusDistribution();

    @Query("SELECT a.decision, COUNT(a) FROM ApiRequestLog a GROUP BY a.decision")
    List<Object[]> getDecisionDistribution();

    @Query("SELECT a.userName, COUNT(a) FROM ApiRequestLog a GROUP BY a.userName ORDER BY COUNT(a) DESC")
    List<Object[]> getTopUsers(Pageable pageable);

    @Query("SELECT DISTINCT a.userName FROM ApiRequestLog a WHERE a.createdAt > :cutoff")
    List<String> getActiveUsers(@Param("cutoff") Instant cutoff);

    @Query("SELECT a FROM ApiRequestLog a WHERE a.createdAt > :cutoff ORDER BY a.createdAt ASC")
    List<ApiRequestLog> findRecentSince(@Param("cutoff") Instant cutoff);
}