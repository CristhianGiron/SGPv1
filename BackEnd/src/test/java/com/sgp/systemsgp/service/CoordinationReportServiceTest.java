/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CoordinationReportServiceTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Coordination Report Service Test mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.ActivityPlan;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.model.Subject;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.ActivityPlanRepository;
import com.sgp.systemsgp.repository.CompletedActivityRecordRepository;
import com.sgp.systemsgp.repository.FinalReportRepository;
import com.sgp.systemsgp.repository.PracticeReportRepository;

import com.sgp.systemsgp.dto.report.CoordinationReportResponse;
import com.sgp.systemsgp.enums.ActivityPlanStatus;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CoordinationReportServiceTest {
    @Mock ActivityPlanRepository plans;
    @Mock PracticeReportRepository reports;
    @Mock FinalReportRepository finals;
    @Mock CompletedActivityRecordRepository records;
    @Mock AccountRepository accounts;
    CoordinationReportService service;
    final Career career = Career.builder().id(1L).build();

    @BeforeEach void setup() {
        service = new CoordinationReportService(plans, reports, finals, records, accounts, new PracticeAccessService());
    }

    @Test void directorOnlySeesDocumentsFromTheirCareerIncludingSubjectFallback() {
        Account director = viewer("ROLE_DIRECTOR_PRACTICAS", career);
        Course own = course(1L, career);
        own.setSubject(Subject.builder().academicCycle(own.getAcademicCycle()).build());
        own.setAcademicCycle(null);
        when(plans.findByDeletedFalse()).thenReturn(List.of(
                plan(own, "student1", ActivityPlanStatus.SUBMITTED),
                plan(course(2L, Career.builder().id(2L).build()), "student2", ActivityPlanStatus.NEEDS_CORRECTION)));
        CoordinationReportResponse result = service.coordinationReport(director.getUsername());
        assertThat(metric(result, "pending")).isEqualTo("1");
        assertThat(metric(result, "needsCorrection")).isEqualTo("0");
        assertThat(result.getApprovalsByCourse()).extracting(r -> r.getCourseId()).containsExactly(1L);
    }

    @Test void administratorSeesAllCareersWithoutMergingCoursesWithTheSameName() {
        Account admin = viewer("ROLE_ADMIN", null);
        when(plans.findByDeletedFalse()).thenReturn(List.of(
                plan(course(1L, career), "student1", ActivityPlanStatus.SUBMITTED),
                plan(course(2L, career), "student2", ActivityPlanStatus.APPROVED)));
        CoordinationReportResponse result = service.coordinationReport(admin.getUsername());
        assertThat(result.getApprovalsByCourse()).hasSize(2);
        assertThat(metric(result, "pending")).isEqualTo("1");
        assertThat(metric(result, "approved")).isEqualTo("1");
        assertThat(result.getDocumentsByType().get(0).getTotal()).isEqualTo(2);
    }

    @Test void averagesUseOnlyApprovedDocumentsWithValidTimesAndPreserveZeroHours() {
        Account admin = viewer("ROLE_ADMIN", null);
        LocalDateTime sent = LocalDateTime.of(2026, 11, 1, 8, 0);
        ActivityPlan first = timed(ActivityPlanStatus.APPROVED, sent, sent.plusMinutes(90));
        ActivityPlan second = timed(ActivityPlanStatus.APPROVED, sent, sent.plusMinutes(150));
        ActivityPlan stale = timed(ActivityPlanStatus.NEEDS_CORRECTION, sent, sent.plusDays(10));
        ActivityPlan invalid = timed(ActivityPlanStatus.APPROVED, sent, sent.minusMinutes(1));
        when(plans.findByDeletedFalse()).thenReturn(List.of(first, second, stale, invalid));
        CoordinationReportResponse result = service.coordinationReport(admin.getUsername());
        assertThat(metric(result, "averageReviewHours")).isEqualTo("2.0");
        assertThat(result.getReviewTimes().get(0).getReviewedDocuments()).isEqualTo(2);
        when(plans.findByDeletedFalse()).thenReturn(List.of(timed(ActivityPlanStatus.APPROVED, sent, sent)));
        assertThat(metric(service.coordinationReport(admin.getUsername()), "averageReviewHours")).isEqualTo("0.0");
    }

    @Test void noCompletedReviewsIsNotReportedAsAnInstantApproval() {
        Account admin = viewer("ROLE_ADMIN", null);
        assertThat(metric(service.coordinationReport(admin.getUsername()), "averageReviewHours")).isEqualTo("—");
    }

    @Test void correctionsCountUniqueStudentsAndTotalsIncludeEveryStatus() {
        Account admin = viewer("ROLE_ADMIN", null);
        Course course = course(1L, career);
        when(plans.findByDeletedFalse()).thenReturn(List.of(
                plan(course, "student1", ActivityPlanStatus.NEEDS_CORRECTION),
                plan(course, "student1", ActivityPlanStatus.NEEDS_CORRECTION),
                plan(course, "student2", ActivityPlanStatus.NEEDS_CORRECTION),
                plan(course, "student3", ActivityPlanStatus.DRAFT),
                plan(course, "student4", ActivityPlanStatus.SUBMITTED),
                plan(course, "student5", ActivityPlanStatus.APPROVED)));
        CoordinationReportResponse result = service.coordinationReport(admin.getUsername());
        assertThat(metric(result, "studentsWithCorrections")).isEqualTo("2");
        var row = result.getDocumentsByType().get(0);
        assertThat(row.getTotal()).isEqualTo(row.getDraft()+row.getSubmitted()+row.getNeedsCorrection()+row.getApproved());
    }

    @Test void rejectsAnUnauthorizedRoleAndDirectorWithoutCareerHasNoCrossCareerData() {
        Account student = viewer("ROLE_ESTUDIANTE", career);
        assertThatThrownBy(() -> service.coordinationReport(student.getUsername())).isInstanceOf(AccessDeniedException.class);
        Account director = viewer("ROLE_DIRECTOR_PRACTICAS", null);
        when(plans.findByDeletedFalse()).thenReturn(List.of(plan(course(1L, career), "student1", ActivityPlanStatus.SUBMITTED)));
        assertThat(service.coordinationReport(director.getUsername()).getDocumentsByType()).isEmpty();
    }

    private Account viewer(String role, Career career) {
        Account account = Account.builder().id(99L).username(role).career(career)
                .roles(Set.of(Role.builder().name(role).build())).build();
        when(accounts.findByUsernameAndDeletedFalse(role)).thenReturn(Optional.of(account));
        return account;
    }
    private Course course(Long id, Career career) {
        return Course.builder().id(id).name("Paralelo A")
                .academicCycle(AcademicCycle.builder().career(career).build()).build();
    }
    private ActivityPlan plan(Course course, String student, ActivityPlanStatus status) {
        return ActivityPlan.builder().course(course).student(Account.builder().username(student).build()).status(status).build();
    }
    private ActivityPlan timed(ActivityPlanStatus status, LocalDateTime sent, LocalDateTime approved) {
        ActivityPlan plan = plan(course(1L, career), "student1", status);
        plan.setSubmittedAt(sent); plan.setApprovedAt(approved); return plan;
    }
    private String metric(CoordinationReportResponse report, String key) {
        return report.getSummary().stream().filter(m -> key.equals(m.getKey())).findFirst().orElseThrow().getValue();
    }
}
