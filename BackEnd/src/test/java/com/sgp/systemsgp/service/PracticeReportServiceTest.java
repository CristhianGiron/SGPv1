package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.dto.practicereport.CreatePracticeReportRequest;
import com.sgp.systemsgp.dto.practicereport.PracticeReportResponse;
import com.sgp.systemsgp.dto.practicereport.ReviewPracticeReportRequest;
import com.sgp.systemsgp.dto.practicereport.UpdatePracticeReportRequest;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.PracticeReportStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.PracticeReport;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import com.sgp.systemsgp.repository.PracticeReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;
import java.util.Set;

class PracticeReportServiceTest {

    @Mock
    private PracticeReportRepository practiceReportRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private CourseRepository courseRepository;

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

    private PracticeReportService practiceReportService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        practiceReportService = new PracticeReportService(
                practiceReportRepository,
                enrollmentRepository,
                courseRepository,
                accountRepository,
                institutionRepository,
                notificationService,
                feedbackCommentService,
                pdfExportService);
    }

    @Test
    void createBuildsDraftFromApprovedEnrollment() {

        Account student = student();
        Enrollment enrollment = enrollment(student, EnrollmentStatus.APPROVED);
        Institution institution = school();

        CreatePracticeReportRequest request = new CreatePracticeReportRequest();
        request.setEnrollmentId(1L);
        request.setEducationalInstitutionId(1L);
        request.setPresentation("Presentación del informe");

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        when(institutionRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(institution));

        when(practiceReportRepository.existsByEnrollment_IdAndDeletedFalse(1L))
                .thenReturn(false);

        PracticeReportResponse response = practiceReportService.create(
                "student01",
                request);

        assertThat(response.getStatus())
                .isEqualTo(PracticeReportStatus.DRAFT.name());

        assertThat(response.getStudentFullName())
                .isEqualTo("Ana Loja");

        verify(practiceReportRepository)
                .save(any(PracticeReport.class));
    }

    @Test
    void createRejectsPendingEnrollment() {

        Account student = student();
        Enrollment enrollment = enrollment(student, EnrollmentStatus.PENDING);

        CreatePracticeReportRequest request = new CreatePracticeReportRequest();
        request.setEnrollmentId(1L);

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        assertThatThrownBy(() -> practiceReportService.create("student01", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo se puede crear el informe de una inscripción aprobada");

        verify(practiceReportRepository, never())
                .save(any(PracticeReport.class));
    }

    @Test
    void reviewSendsReportBackForCorrection() {

        Account tutor = tutor();
        Account student = student();
        PracticeReport report = submittedReport(student, tutor);

        ReviewPracticeReportRequest request = new ReviewPracticeReportRequest();
        request.setApproved(false);
        request.setObjectivesFeedback("Ajustar objetivos específicos");

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(tutor));

        when(practiceReportRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(report));

        PracticeReportResponse response = practiceReportService.review(
                1L,
                "tutor.practicas",
                request);

        assertThat(response.getStatus())
                .isEqualTo(PracticeReportStatus.NEEDS_CORRECTION.name());

        assertThat(response.getObjectivesFeedback())
                .isEqualTo("Ajustar objetivos específicos");

        verify(practiceReportRepository)
                .save(report);
    }

    @Test
    void submitAllowsIncompleteDraft() {

        Account tutor = tutor();
        Account student = student();
        PracticeReport report = submittedReport(student, tutor);
        report.setStatus(PracticeReportStatus.DRAFT);

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(practiceReportRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(report));

        PracticeReportResponse response = practiceReportService.submit(
                1L,
                "student01");

        assertThat(response.getStatus())
                .isEqualTo(PracticeReportStatus.SUBMITTED.name());

        assertThat(report.getSubmittedAt())
                .isNotNull();

        verify(practiceReportRepository)
                .save(report);

        verify(notificationService)
                .notifyPracticeReportSubmitted(report);
    }

    @Test
    void correctionFlowClearsCurrentFeedbackAndApprovesAfterBothReviews() {

        Account tutor = tutor();
        Account director = director();
        Account student = student();
        PracticeReport report = submittedReport(student, tutor);
        report.setReviewCycle(1);

        when(practiceReportRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(report));

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(tutor));

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(accountRepository.findByUsernameAndDeletedFalse("director.practicas"))
                .thenReturn(Optional.of(director));

        ReviewPracticeReportRequest observe = new ReviewPracticeReportRequest();
        observe.setApproved(false);
        observe.setObjectivesFeedback("Ajustar objetivos específicos");

        PracticeReportResponse observed = practiceReportService.review(
                1L,
                "tutor.practicas",
                observe);

        assertThat(observed.getStatus())
                .isEqualTo(PracticeReportStatus.NEEDS_CORRECTION.name());

        assertThat(observed.getObjectivesFeedback())
                .isEqualTo("Ajustar objetivos específicos");

        assertThat(observed.getReviewCycle())
                .isEqualTo(1);

        verify(feedbackCommentService)
                .upsertDocumentFeedback(
                        FeedbackDocumentType.PRACTICE_REPORT,
                        1L,
                        "objectivesFeedback",
                        "Ajustar objetivos específicos",
                        tutor,
                        1);

        UpdatePracticeReportRequest correction = new UpdatePracticeReportRequest();
        correction.setPresentation("Presentacion corregida");

        PracticeReportResponse corrected = practiceReportService.update(
                1L,
                "student01",
                correction);

        assertThat(corrected.getPresentation())
                .isEqualTo("Presentacion corregida");

        PracticeReportResponse resubmitted = practiceReportService.submit(
                1L,
                "student01");

        assertThat(resubmitted.getStatus())
                .isEqualTo(PracticeReportStatus.SUBMITTED.name());

        assertThat(resubmitted.getReviewCycle())
                .isEqualTo(2);

        assertThat(resubmitted.getObjectivesFeedback())
                .isNull();

        verify(feedbackCommentService)
                .clearDocumentFeedback(
                        FeedbackDocumentType.PRACTICE_REPORT,
                        1L);

        ReviewPracticeReportRequest approve = new ReviewPracticeReportRequest();
        approve.setApproved(true);

        PracticeReportResponse tutorApproval = practiceReportService.review(
                1L,
                "tutor.practicas",
                approve);

        assertThat(tutorApproval.getStatus())
                .isEqualTo(PracticeReportStatus.SUBMITTED.name());

        assertThat(tutorApproval.isPracticeTutorApproved())
                .isTrue();

        PracticeReportResponse directorApproval = practiceReportService.review(
                1L,
                "director.practicas",
                approve);

        assertThat(directorApproval.getStatus())
                .isEqualTo(PracticeReportStatus.APPROVED.name());

        assertThat(directorApproval.isDirectorApproved())
                .isTrue();

        assertThat(report.getApprovedAt())
                .isNotNull();

        verify(notificationService)
                .notifyPracticeReportSubmitted(report);

        verify(notificationService, times(3))
                .notifyPracticeReportReviewed(report);
    }

    private PracticeReport submittedReport(
            Account student,
            Account tutor) {

        Institution institution = school();
        Course course = course(tutor);
        Enrollment enrollment = enrollment(student, EnrollmentStatus.APPROVED);
        enrollment.setCourse(course);

        return PracticeReport.builder()
                .id(1L)
                .enrollment(enrollment)
                .student(student)
                .course(course)
                .educationalInstitution(institution)
                .studentFullName("Ana Loja")
                .educationalInstitutionName("Colegio Test")
                .status(PracticeReportStatus.SUBMITTED)
                .build();
    }

    private Enrollment enrollment(
            Account student,
            EnrollmentStatus status) {

        return Enrollment.builder()
                .id(1L)
                .account(student)
                .course(course(null))
                .status(status)
                .build();
    }

    private Course course(Account practiceTutor) {

        return Course.builder()
                .id(1L)
                .name("Curso de Prácticas")
                .practiceTutor(practiceTutor)
                .generalObjective("Objetivo general")
                .specificObjective1("Objetivo especifico 1")
                .specificObjective2("Objetivo especifico 2")
                .specificObjective3("Objetivo especifico 3")
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

    private Account tutor() {

        return Account.builder()
                .id(20L)
                .username("tutor.practicas")
                .roles(Set.of(role(RoleName.ROLE_TUTOR_PRACTICAS)))
                .build();
    }

    private Account director() {

        return Account.builder()
                .id(30L)
                .username("director.practicas")
                .roles(Set.of(role(RoleName.ROLE_DIRECTOR_PRACTICAS)))
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
