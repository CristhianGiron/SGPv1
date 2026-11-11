/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeCompletionService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Calcula las advertencias documentales y de horas para el cierre manual de una práctica.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.enums.CompletedActivityRecordStatus;
import com.sgp.systemsgp.enums.FinalReportStatus;
import com.sgp.systemsgp.enums.PracticeAttendanceStatus;
import com.sgp.systemsgp.enums.practiceincident.PracticeIncidentStatus;
import com.sgp.systemsgp.model.ActivityPlan;
import com.sgp.systemsgp.model.CompletedActivityRecord;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.FinalReport;
import com.sgp.systemsgp.model.PracticeAttendance;
import com.sgp.systemsgp.model.PracticeReport;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.ActivityEvaluationRepository;
import com.sgp.systemsgp.repository.ActivityPlanRepository;
import com.sgp.systemsgp.repository.CompletedActivityRecordRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.FinalReportRepository;
import com.sgp.systemsgp.repository.PracticeFollowUpReportRepository;
import com.sgp.systemsgp.repository.PracticeReportRepository;
import com.sgp.systemsgp.repository.PracticeScheduleRepository;
import com.sgp.systemsgp.repository.practiceincident.PracticeIncidentRepository;

import com.sgp.systemsgp.dto.enrollment.PracticeCompletionSummary;
import com.sgp.systemsgp.enums.*;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PracticeCompletionService {
    private final EnrollmentRepository enrollments;
    private final AccountRepository accounts;
    private final PracticeAccessService access;
    private final ActivityPlanRepository plans;
    private final PracticeReportRepository reports;
    private final FinalReportRepository finals;
    private final ActivityEvaluationRepository evaluations;
    private final PracticeFollowUpReportRepository followUps;
    private final CompletedActivityRecordRepository records;
    private final PracticeScheduleRepository schedules;
    private final PracticeIncidentRepository incidents;

    public PracticeCompletionSummary summary(String username, Long id) {
        var enrollment = enrollments.findById(id).orElseThrow(() -> new NotFoundException("Práctica no encontrada"));
        var actor = accounts.findByUsernameAndDeletedFalse(username).orElseThrow(() -> new NotFoundException("Cuenta no encontrada"));
        access.requirePracticeCompletionAccess(enrollment, actor);
        return summarize(enrollment);
    }

    PracticeCompletionSummary summarize(Enrollment enrollment) {
        Long id = enrollment.getId();
        var warnings = new ArrayList<String>();
        checkReviewed("L.1", reports.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(id).stream().map(PracticeReport::getStatus).toList(), warnings);
        checkReviewed("L.2", plans.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(id).stream().map(ActivityPlan::getStatus).toList(), warnings);
        var finalRows = finals.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(id);
        checkReviewed("L.3", finalRows.stream().map(FinalReport::getStatus).toList(), warnings);
        var recordRows = records.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(id);
        checkReviewed("L.6", recordRows.stream().map(CompletedActivityRecord::getStatus).toList(), warnings);
        if (!evaluations.existsByEnrollment_IdAndDeletedFalse(id)) warnings.add("L.4: evaluación sin registrar.");
        if (!followUps.existsByEnrollment_IdAndDeletedFalse(id)) warnings.add("L.5: seguimiento sin registrar.");
        if (enrollment.getGroup() == null) warnings.add("La práctica no tiene un grupo asignado.");
        if (InstitutionalAssignmentResolver.institutionalTutor(enrollment) == null) warnings.add("La práctica no tiene tutor institucional asignado.");

        Integer recordMinutes = recordRows.stream().filter(r -> r.getStatus() == CompletedActivityRecordStatus.APPROVED)
                .map(CompletedActivityRecord::getTotalMinutes).filter(Objects::nonNull).findFirst().orElse(null);
        Integer finalMinutes = finalRows.stream().filter(r -> r.getStatus() == FinalReportStatus.APPROVED)
                .map(FinalReport::getCompletedPracticeMinutes).filter(Objects::nonNull).findFirst().orElse(null);
        long attendanceMinutes = schedules.findByStudent_UsernameAndDeletedFalse(enrollment.getAccount().getUsername()).stream()
                .filter(s -> Objects.equals(s.getEnrollment().getId(), id))
                .flatMap(s -> s.getAttendances().stream())
                .filter(a -> a.getStatus() == PracticeAttendanceStatus.PRESENT || a.getStatus() == PracticeAttendanceStatus.LATE)
                .map(PracticeAttendance::getTotalMinutes).filter(Objects::nonNull).mapToLong(m -> Math.max(0, m)).sum();
        if (recordMinutes == null || recordMinutes <= 0) warnings.add("L.6 no acredita un total positivo de horas aprobado.");
        if (finalMinutes == null || finalMinutes <= 0) warnings.add("L.3 no acredita un total positivo de horas aprobado.");
        if (recordMinutes != null && finalMinutes != null && !recordMinutes.equals(finalMinutes)) warnings.add("Las horas aprobadas de L.3 y L.6 no coinciden.");
        if (recordMinutes != null && attendanceMinutes != recordMinutes.longValue()) warnings.add("El tiempo de asistencia y el total aprobado de L.6 no coinciden.");
        long openIncidents=incidents.countByEnrollment_IdAndStatusIn(id,List.of(PracticeIncidentStatus.OPEN,PracticeIncidentStatus.ASSIGNED,PracticeIncidentStatus.UNDER_REVIEW));
        if(openIncidents>0)warnings.add("Hay "+openIncidents+" incidencia(s) sin resolver. Al concluir, su seguimiento quedará de consulta.");
        var periodEnd = PracticePeriod.end(enrollment);
        boolean ended = periodEnd != null && !periodEnd.isAfter(LocalDateTime.now());
        if (periodEnd == null) warnings.add("La práctica no tiene fecha final definida.");
        else if (!ended) warnings.add("Todavía no ha terminado el período de desarrollo de la práctica.");
        return new PracticeCompletionSummary(id, periodEnd, ended, List.copyOf(warnings), recordMinutes, finalMinutes, attendanceMinutes);
    }

    private void checkReviewed(String name, List<? extends Enum<?>> statuses, List<String> warnings) {
        if (statuses.isEmpty()) warnings.add(name + ": documento sin registrar.");
        else if (statuses.stream().anyMatch(status -> status == null || !"APPROVED".equals(status.name())))
            warnings.add(name + ": hay un documento pendiente de aprobación.");
    }
}
