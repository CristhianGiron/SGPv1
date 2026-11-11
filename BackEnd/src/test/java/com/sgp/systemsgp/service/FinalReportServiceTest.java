/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FinalReportServiceTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el informe del tutor institucional (L.3) mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.service.documentversion.PracticeDocumentVersionService;
import com.sgp.systemsgp.service.pdf.PdfExportService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.dto.finalreport.CreateFinalReportRequest;
import com.sgp.systemsgp.dto.finalreport.FinalReportResponse;
import com.sgp.systemsgp.dto.finalreport.ReviewFinalReportRequest;
import com.sgp.systemsgp.dto.finalreport.UpdateFinalReportRequest;
import com.sgp.systemsgp.dto.finalreport.UpdateFinalReportInstitutionalSectionRequest;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.enums.FinalReportStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.FinalReport;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.model.Subject;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.FinalReportRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

class FinalReportServiceTest {

    @Mock
    private FinalReportRepository finalReportRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private FeedbackCommentService feedbackCommentService;

    @Mock
    private PdfExportService pdfExportService;

    @Mock
    private com.sgp.systemsgp.repository.CompletedActivityRecordRepository completedActivityRecordRepository;

    private FinalReportService finalReportService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        finalReportService = new FinalReportService(
                org.mockito.Mockito.mock(PracticeDocumentVersionService.class),
                finalReportRepository,
                enrollmentRepository,
                accountRepository,
                institutionRepository,
                notificationService,
                feedbackCommentService,
                pdfExportService,
                completedActivityRecordRepository);
    }

    @Test
    void createBuildsDraftFromApprovedEnrollment() {

        Institution institution = school();
        Account student = student();
        Account institutionalTutor = institutionalTutor(institution);
        Account practiceTutor = practiceTutor();
        Enrollment enrollment = enrollment(
                student,
                EnrollmentStatus.APPROVED,
                institutionalTutor,
                practiceTutor);

        CreateFinalReportRequest request = new CreateFinalReportRequest();
        request.setEnrollmentId(1L);
        request.setEducationalInstitutionId(1L);
        request.setAntecedents("Antecedentes del informe final");

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        when(institutionRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(institution));

        when(finalReportRepository.existsByEnrollment_IdAndDeletedFalse(1L))
                .thenReturn(false);

        FinalReportResponse response = finalReportService.create(
                "student01",
                request);

        assertThat(response.getStatus())
                .isEqualTo(FinalReportStatus.DRAFT.name());

        assertThat(response.getStudentFullName())
                .isEqualTo("Ana Loja");

        assertThat(response.getEducationalInstitutionName())
                .isEqualTo("Colegio Test");

        verify(finalReportRepository)
                .save(any(FinalReport.class));
    }

    @Test
    void createRejectsPendingEnrollment() {

        Account student = student();
        Enrollment enrollment = Enrollment.builder()
                .id(1L)
                .account(student)
                .status(EnrollmentStatus.PENDING)
                .build();

        CreateFinalReportRequest request = new CreateFinalReportRequest();
        request.setEnrollmentId(1L);

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        assertThatThrownBy(() -> finalReportService.create("student01", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo se puede crear el informe final de una inscripcion aprobada");

        verify(finalReportRepository, never())
                .save(any(FinalReport.class));
    }

    @Test
    void institutionalTutorCompletesConclusionsAndRecommendations() {

        Institution institution = school();
        Account student = student();
        Account institutionalTutor = institutionalTutor(institution);
        Account practiceTutor = practiceTutor();
        FinalReport report = submittedReport(
                student,
                institutionalTutor,
                practiceTutor);

        UpdateFinalReportInstitutionalSectionRequest request =
                new UpdateFinalReportInstitutionalSectionRequest();
        request.setConclusion1("Conclusion relacionada al objetivo 1");
        request.setRecommendation1("Recomendacion relacionada a la conclusion 1");

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.institucional"))
                .thenReturn(Optional.of(institutionalTutor));

        when(finalReportRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(report));

        FinalReportResponse response = finalReportService.updateInstitutionalSection(
                1L,
                "tutor.institucional",
                request);

        assertThat(response.getConclusion1())
                .isEqualTo("Conclusion relacionada al objetivo 1");

        assertThat(response.getRecommendation1())
                .isEqualTo("Recomendacion relacionada a la conclusion 1");

        verify(finalReportRepository)
                .save(report);
    }

    @Test
    void approvingFinalReportRequiresAllReviewers() {

        Institution institution = school();
        Account student = student();
        Account institutionalTutor = institutionalTutor(institution);
        Account practiceTutor = practiceTutor();
        Account director = practiceDirector();
        FinalReport report = submittedReport(
                student,
                institutionalTutor,
                practiceTutor);
        completeInstitutionalSection(report);

        ReviewFinalReportRequest approve = new ReviewFinalReportRequest();
        approve.setApproved(true);

        when(finalReportRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(report));

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(practiceTutor));

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.institucional"))
                .thenReturn(Optional.of(institutionalTutor));

        when(accountRepository.findByUsernameAndDeletedFalse("director.practicas"))
                .thenReturn(Optional.of(director));

        FinalReportResponse practiceResponse =
                finalReportService.reviewByPracticeTutor(
                        1L,
                        "tutor.practicas",
                        approve);

        assertThat(practiceResponse.getStatus())
                .isEqualTo(FinalReportStatus.SUBMITTED.name());

        assertThat(practiceResponse.isPracticeTutorApproved())
                .isTrue();

        FinalReportResponse institutionalResponse =
                finalReportService.reviewByInstitutionalTutor(
                        1L,
                        "tutor.institucional",
                        approve);

        assertThat(institutionalResponse.getStatus())
                .isEqualTo(FinalReportStatus.SUBMITTED.name());

        assertThat(institutionalResponse.isInstitutionalTutorApproved())
                .isTrue();

        FinalReportResponse directorResponse =
                finalReportService.reviewByDirector(
                        1L,
                        "director.practicas",
                        approve);

        assertThat(directorResponse.getStatus())
                .isEqualTo(FinalReportStatus.APPROVED.name());

        assertThat(directorResponse.isDirectorApproved())
                .isTrue();

        verify(finalReportRepository, times(3))
                .save(report);
    }

    @Test
    void submitAllowsIncompleteStudentSection() {

        Institution institution = school();
        Account student = student();
        Account institutionalTutor = institutionalTutor(institution);
        Account practiceTutor = practiceTutor();
        FinalReport report = submittedReport(
                student,
                institutionalTutor,
                practiceTutor);
        report.setStatus(FinalReportStatus.DRAFT);
        report.setAntecedents(null);
        report.setObjective(null);

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(finalReportRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(report));

        FinalReportResponse response = finalReportService.submit(
                1L,
                "student01");

        assertThat(response.getStatus())
                .isEqualTo(FinalReportStatus.SUBMITTED.name());

        assertThat(report.getSubmittedAt())
                .isNotNull();

        verify(finalReportRepository)
                .save(report);

        verify(notificationService)
                .notifyFinalReportSubmitted(report);
    }

    @Test
    void studentUpdateSubmittedFinalReportInvalidatesPartialReviews() {

        Institution institution = school();
        Account student = student();
        Account institutionalTutor = institutionalTutor(institution);
        Account practiceTutor = practiceTutor();
        FinalReport report = submittedReport(
                student,
                institutionalTutor,
                practiceTutor);
        report.setPracticeTutorApproved(true);
        report.setPracticeReviewedBy(practiceTutor);
        report.setPracticeReviewedAt(LocalDateTime.now());
        report.setPracticeObjectiveFeedback("Ajustar objetivo");

        when(finalReportRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(report));

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        UpdateFinalReportRequest request = new UpdateFinalReportRequest();
        request.setObjective("Objetivo actualizado");

        FinalReportResponse response = finalReportService.update(
                1L,
                "student01",
                request);

        assertThat(response.getStatus())
                .isEqualTo(FinalReportStatus.DRAFT.name());

        assertThat(response.getObjective())
                .isEqualTo("Objetivo actualizado");

        assertThat(response.isPracticeTutorApproved())
                .isFalse();

        assertThat(response.getPracticeObjectiveFeedback())
                .isNull();

        assertThat(response.getPracticeReviewedBy())
                .isNull();

        assertThat(response.getPracticeReviewedAt())
                .isNull();

        verify(feedbackCommentService)
                .clearDocumentFeedback(
                        FeedbackDocumentType.FINAL_REPORT,
                        1L);

        verify(finalReportRepository)
                .save(report);
    }

    @Test
    void correctionFlowClearsCurrentFeedbackAndApprovesAfterAllReviews() {

        Institution institution = school();
        Account student = student();
        Account institutionalTutor = institutionalTutor(institution);
        Account practiceTutor = practiceTutor();
        Account director = practiceDirector();
        FinalReport report = submittedReport(
                student,
                institutionalTutor,
                practiceTutor);
        report.setReviewCycle(1);

        when(finalReportRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(report));

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(practiceTutor));

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.institucional"))
                .thenReturn(Optional.of(institutionalTutor));

        when(accountRepository.findByUsernameAndDeletedFalse("director.practicas"))
                .thenReturn(Optional.of(director));

        ReviewFinalReportRequest observe = new ReviewFinalReportRequest();
        observe.setApproved(false);
        observe.setObjectiveFeedback("Ajustar el objetivo del informe final");

        FinalReportResponse observed =
                finalReportService.reviewByPracticeTutor(
                        1L,
                        "tutor.practicas",
                        observe);

        assertThat(observed.getStatus())
                .isEqualTo(FinalReportStatus.NEEDS_CORRECTION.name());

        assertThat(observed.getPracticeObjectiveFeedback())
                .isEqualTo("Ajustar el objetivo del informe final");

        assertThat(observed.getReviewCycle())
                .isEqualTo(1);

        verify(feedbackCommentService)
                .upsertDocumentFeedback(
                        FeedbackDocumentType.FINAL_REPORT,
                        1L,
                        "practiceObjectiveFeedback",
                        "Ajustar el objetivo del informe final",
                        practiceTutor,
                        1);

        UpdateFinalReportRequest correction = new UpdateFinalReportRequest();
        correction.setObjective("Objetivo corregido por el estudiante");

        FinalReportResponse corrected = finalReportService.update(
                1L,
                "student01",
                correction);

        assertThat(corrected.getObjective())
                .isEqualTo("Objetivo corregido por el estudiante");

        FinalReportResponse resubmitted = finalReportService.submit(
                1L,
                "student01");

        assertThat(resubmitted.getStatus())
                .isEqualTo(FinalReportStatus.SUBMITTED.name());

        assertThat(resubmitted.getReviewCycle())
                .isEqualTo(2);

        assertThat(resubmitted.getPracticeObjectiveFeedback())
                .isNull();

        assertThat(resubmitted.isPracticeTutorApproved())
                .isFalse();

        assertThat(resubmitted.isInstitutionalTutorApproved())
                .isFalse();

        assertThat(resubmitted.isDirectorApproved())
                .isFalse();

        verify(feedbackCommentService)
                .clearDocumentFeedback(
                        FeedbackDocumentType.FINAL_REPORT,
                        1L);

        completeInstitutionalSection(report);

        ReviewFinalReportRequest approve = new ReviewFinalReportRequest();
        approve.setApproved(true);

        FinalReportResponse practiceApproval =
                finalReportService.reviewByPracticeTutor(
                        1L,
                        "tutor.practicas",
                        approve);

        assertThat(practiceApproval.getStatus())
                .isEqualTo(FinalReportStatus.SUBMITTED.name());

        assertThat(practiceApproval.isPracticeTutorApproved())
                .isTrue();

        FinalReportResponse institutionalApproval =
                finalReportService.reviewByInstitutionalTutor(
                        1L,
                        "tutor.institucional",
                        approve);

        assertThat(institutionalApproval.getStatus())
                .isEqualTo(FinalReportStatus.SUBMITTED.name());

        assertThat(institutionalApproval.isInstitutionalTutorApproved())
                .isTrue();

        FinalReportResponse directorApproval =
                finalReportService.reviewByDirector(
                        1L,
                        "director.practicas",
                        approve);

        assertThat(directorApproval.getStatus())
                .isEqualTo(FinalReportStatus.APPROVED.name());

        assertThat(directorApproval.isDirectorApproved())
                .isTrue();

        assertThat(report.getApprovedAt())
                .isNotNull();

        verify(notificationService)
                .notifyFinalReportSubmitted(report);

        verify(notificationService, times(2))
                .notifyFinalReportReviewedByPracticeTutor(report);

        verify(notificationService)
                .notifyFinalReportReviewedByInstitutionalTutor(report);

        verify(notificationService)
                .notifyFinalReportReviewedByDirector(report);
    }

    @Test
    void institutionalFormSavesItsLetterheadHoursAndDateTogether() throws Exception {
        Account tutor = institutionalTutor(school());
        FinalReport report = submittedReport(student(), tutor, practiceTutor());
        when(accountRepository.findByUsernameAndDeletedFalse("tutor.institucional")).thenReturn(Optional.of(tutor));
        when(finalReportRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(report));
        var request = new UpdateFinalReportInstitutionalSectionRequest();
        request.setCompletedHours(46);
        request.setCompletedMinutes(55);
        request.setReportDate(java.time.LocalDate.of(2026, 11, 4));
        request.setConclusion1("Conclusión institucional");
        byte[] image;
        try (var resource = getClass().getResourceAsStream("/branding/unl-logo.png")) { image = resource.readAllBytes(); }
        var file = new org.springframework.mock.web.MockMultipartFile("image", "membrete.png", "image/png", image);
        var response = finalReportService.updateInstitutionalSection(1L, "tutor.institucional", request, file);
        assertThat(report.getLetterheadImage().getData()).containsExactly(image);
        assertThat(report.getCompletedPracticeMinutes()).isEqualTo(2815);
        assertThat(response.getLetterheadImageUrl()).isEqualTo("/api/final-reports/1/letterhead");
        assertThat(response.getCompletedHours()).isEqualTo(46);
        assertThat(response.getCompletedMinutes()).isEqualTo(55);
        assertThat(response.getReportDate()).isEqualTo(request.getReportDate());
        assertThat(response.getConclusion1()).isEqualTo("Conclusión institucional");
    }

    @Test
    void invalidLetterheadDoesNotSaveInstitutionalComments() {
        var file = new org.springframework.mock.web.MockMultipartFile("image", "membrete.png", "image/png", new byte[]{1, 2, 3});
        assertThatThrownBy(() -> finalReportService.updateInstitutionalSection(1L, "tutor.institucional",
                new UpdateFinalReportInstitutionalSectionRequest(), file)).isInstanceOf(BadRequestException.class);
        verify(finalReportRepository, never()).save(any(FinalReport.class));
    }

    @Test
    void legacyApprovedReportCanReceiveItsMissingLetterheadOnlyOnce() throws Exception {
        Account tutor = institutionalTutor(school());
        FinalReport report = submittedReport(student(), tutor, practiceTutor());
        report.setStatus(FinalReportStatus.APPROVED);
        report.setInstitutionalTutorApproved(true);
        report.setApprovedAt(LocalDateTime.of(2026, 11, 4, 12, 0));
        when(accountRepository.findByUsernameAndDeletedFalse("tutor.institucional")).thenReturn(Optional.of(tutor));
        when(finalReportRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(report));
        byte[] image;
        try (var resource = getClass().getResourceAsStream("/branding/unl-logo.png")) { image = resource.readAllBytes(); }
        var file = new org.springframework.mock.web.MockMultipartFile("image", "membrete.png", "image/png", image);
        var response = finalReportService.attachLegacyLetterhead(1L, "tutor.institucional", file);
        assertThat(response.getStatus()).isEqualTo("APPROVED");
        assertThat(report.isInstitutionalTutorApproved()).isTrue();
        assertThat(report.getApprovedAt()).isEqualTo(LocalDateTime.of(2026, 11, 4, 12, 0));
        assertThatThrownBy(() -> finalReportService.attachLegacyLetterhead(1L, "tutor.institucional", file))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void institutionalHoursCanComeFromTheSameEnrollmentsL6() {
        Account student = student();
        FinalReport report = submittedReport(student, institutionalTutor(school()), practiceTutor());
        when(accountRepository.findByUsernameAndDeletedFalse("student01")).thenReturn(Optional.of(student));
        when(finalReportRepository.findByIdAndDeletedFalse(1L)).thenReturn(Optional.of(report));
        when(completedActivityRecordRepository.findByEnrollment_IdAndDeletedFalse(report.getEnrollment().getId()))
                .thenReturn(Optional.of(com.sgp.systemsgp.model.CompletedActivityRecord.builder().totalMinutes(2815).build()));
        var response = finalReportService.getById(1L, "student01");
        assertThat(response.getCompletedHours()).isEqualTo(46);
        assertThat(response.getCompletedMinutes()).isEqualTo(55);
    }

    private FinalReport submittedReport(
            Account student,
            Account institutionalTutor,
            Account practiceTutor) {

        Institution institution = school();
        Course course = course(institutionalTutor, practiceTutor);
        Enrollment enrollment = enrollment(
                student,
                EnrollmentStatus.APPROVED,
                institutionalTutor,
                practiceTutor);
        enrollment.setCourse(course);

        return FinalReport.builder()
                .id(1L)
                .enrollment(enrollment)
                .student(student)
                .course(course)
                .educationalInstitution(institution)
                .educationalInstitutionName("Colegio Test")
                .studentFullName("Ana Loja")
                .antecedents("Antecedentes")
                .objective("Objetivo")
                .status(FinalReportStatus.SUBMITTED)
                .build();
    }

    private void completeInstitutionalSection(FinalReport report) {
        report.setCompletedPracticeMinutes(2815);
        report.setLetterheadImage(com.sgp.systemsgp.model.EntityImage.builder()
                .contentType("image/png").data(new byte[]{1}).build());

        report.setConclusion1("Conclusion 1");
        report.setConclusion2("Conclusion 2");
        report.setConclusion3("Conclusion 3");
        report.setRecommendation1("Recomendacion 1");
        report.setRecommendation2("Recomendacion 2");
        report.setRecommendation3("Recomendacion 3");
    }

    private Enrollment enrollment(
            Account student,
            EnrollmentStatus status,
            Account institutionalTutor,
            Account practiceTutor) {

        return Enrollment.builder()
                .id(1L)
                .account(student)
                .course(course(institutionalTutor, practiceTutor))
                .status(status)
                .build();
    }

    private Course course(
            Account institutionalTutor,
            Account practiceTutor) {

        return Course.builder()
                .id(1L)
                .name("Curso de Practicas")
                .institutionalTutor(institutionalTutor)
                .practiceTutor(practiceTutor)
                .subject(subject())
                .build();
    }

    private Account student() {

        Person person = Person.builder()
                .names("Ana")
                .lastNames("Loja")
                .cedula("1100000001")
                .institutionalEmail("ana@test.local")
                .phone("0990000001")
                .build();

        return Account.builder()
                .id(10L)
                .username("student01")
                .person(person)
                .roles(Set.of(role(RoleName.ROLE_ESTUDIANTE)))
                .build();
    }

    private Account institutionalTutor(Institution institution) {

        return Account.builder()
                .id(20L)
                .username("tutor.institucional")
                .institution(institution)
                .roles(Set.of(role(RoleName.ROLE_TUTOR_INSTITUCIONAL)))
                .build();
    }

    private Account practiceTutor() {

        return Account.builder()
                .id(30L)
                .username("tutor.practicas")
                .roles(Set.of(role(RoleName.ROLE_TUTOR_PRACTICAS)))
                .build();
    }

    private Account practiceDirector() {

        return Account.builder()
                .id(40L)
                .username("director.practicas")
                .roles(Set.of(role(RoleName.ROLE_DIRECTOR_PRACTICAS)))
                .career(career())
                .build();
    }

    private Subject subject() {

        return Subject.builder()
                .id(1L)
                .academicCycle(AcademicCycle.builder()
                        .id(1L)
                        .career(career())
                        .build())
                .build();
    }

    private Career career() {

        return Career.builder()
                .id(1L)
                .name("Ingenieria Test")
                .build();
    }

    private Role role(RoleName roleName) {

        return Role.builder()
                .name(roleName.name())
                .build();
    }

    private Institution school() {

        return Institution.builder()
                .id(1L)
                .name("Colegio Test")
                .code("11H00001")
                .type(InstitutionType.COLEGIO)
                .active(true)
                .deleted(false)
                .build();
    }
}
