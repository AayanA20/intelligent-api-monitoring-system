package com.intelligentapi.monitoring.repository;

import com.intelligentapi.monitoring.model.ApiRequestLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ApiRequestLogRepository extends JpaRepository<ApiRequestLog, Long> {

    List<ApiRequestLog> findByResponseTimeGreaterThan(Long time);

    List<ApiRequestLog> findByStatusCodeGreaterThanEqual(int statusCode);
//Which APIs are used most
    @Query("SELECT a.endpoint, COUNT(a) FROM ApiRequestLog a GROUP BY a.endpoint ORDER BY COUNT(a) DESC")
List<Object[]> getTopEndpoints();

}