package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.PracticeAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PracticeAuditLogRepository extends JpaRepository<PracticeAuditLog, Long> {
}
