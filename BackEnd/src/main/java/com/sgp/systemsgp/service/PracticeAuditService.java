/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeAuditService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa la lógica de aplicación de el módulo Practice Audit Service.
 */

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
                .details(details==null?null:details.substring(0,details.offsetByCodePoints(0,Math.min(details.codePointCount(0,details.length()),1000))))
                .createdAt(LocalDateTime.now())
                .build());
    }
}
