package com.intelligentapi.monitoring.repository;

import com.intelligentapi.monitoring.model.AbuseEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AbuseEventRepository extends JpaRepository<AbuseEvent, Long> {

    List<AbuseEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByDecision(String decision);

    long countByCreatedAtAfter(Instant cutoff);

    @Query("SELECT e.decision, COUNT(e) FROM AbuseEvent e GROUP BY e.decision")
    List<Object[]> countByDecisionGroup();

    @Query("SELECT e.userName, COUNT(e) FROM AbuseEvent e GROUP BY e.userName ORDER BY COUNT(e) DESC")
    List<Object[]> topAbusiveUsers(Pageable pageable);
}