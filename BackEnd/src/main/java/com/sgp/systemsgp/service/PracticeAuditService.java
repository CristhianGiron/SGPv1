package com.sgp.systemsgp.service;

import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.PracticeAuditLog;
import com.sgp.systemsgp.repository.PracticeAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PracticeAuditService {

    private final PracticeAuditLogRepository practiceAuditLogRepository;

    public void logEnrollmentAction(
            Enrollment enrollment,
            Account actor,
            String action,
            String previousStatus,
            String newStatus,
            Boolean previousArchived,
            Boolean newArchived,
            String details) {

        practiceAuditLogRepository.save(PracticeAuditLog.builder()
                .enrollment(enrollment)
                .actor(actor)
                .action(action)
                .previousStatus(previousStatus)
                .newStatus(newStatus)
                .previousArchived(previousArchived)
                .newArchived(newArchived)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build());
    }
}
