package com.devportal.repository;

import com.devportal.model.AuditLog;
import com.devportal.model.Project;
import com.devportal.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.user LEFT JOIN FETCH a.project p LEFT JOIN FETCH p.environment LEFT JOIN FETCH a.environment ORDER BY a.createdAt DESC")
    List<AuditLog> findAllWithDetails();

    List<AuditLog> findByUser(User user);

    List<AuditLog> findByProject(Project project);

    List<AuditLog> findByCreatedAtBetween(Instant from, Instant to);
}

