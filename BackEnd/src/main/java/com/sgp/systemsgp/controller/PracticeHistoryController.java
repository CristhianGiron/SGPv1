/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeHistoryController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con el módulo Practice History Controller.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.PracticeAuditLogRepository;
import com.sgp.systemsgp.service.PracticeAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PracticeHistoryController {
    private final EnrollmentRepository enrollments;
    private final AccountRepository accounts;
    private final PracticeAuditLogRepository audits;
    private final PracticeAccessService access;

    @GetMapping("/api/enrollments/{id}/history")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','ADMIN','DIRECTOR_PRACTICAS','TUTOR_PRACTICAS','TUTOR_INSTITUCIONAL')")
    public List<Event> history(Authentication authentication, @PathVariable Long id) {
        var viewer = accounts.findByUsernameAndDeletedFalse(authentication.getName())
                .orElseThrow(() -> new NotFoundException("Cuenta no encontrada"));
        var enrollment = enrollments.findById(id)
                .orElseThrow(() -> new NotFoundException("Práctica no encontrada"));
        if (!access.canViewEnrollment(enrollment, viewer)) {
            throw new AccessDeniedException("Este historial no pertenece a tus prácticas");
        }
        return audits.findByEnrollment_IdOrderByCreatedAtDesc(id).stream().map(row -> {
            var person = row.getActor() != null ? row.getActor().getPerson() : null;
            String name = person != null
                    ? ((person.getNames() == null ? "" : person.getNames()) + " "
                    + (person.getLastNames() == null ? "" : person.getLastNames())).trim()
                    : null;
            return new Event(row.getId(), id, row.getAction(), row.getCreatedAt(), name, row.getDetails());
        }).toList();
    }

    public record Event(Long id, Long enrollmentId, String action, LocalDateTime createdAt,
                        String actorName, String details) {}
}
