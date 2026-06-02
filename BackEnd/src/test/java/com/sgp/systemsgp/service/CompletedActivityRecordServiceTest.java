package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.dto.completedactivity.CompletedActivityRecordEntryFeedbackRequest;
import com.sgp.systemsgp.dto.completedactivity.CompletedActivityRecordEntryRequest;
import com.sgp.systemsgp.dto.completedactivity.CompletedActivityRecordResponse;
import com.sgp.systemsgp.dto.completedactivity.CreateCompletedActivityRecordRequest;
import com.sgp.systemsgp.dto.completedactivity.ReviewCompletedActivityRecordRequest;
import com.sgp.systemsgp.dto.completedactivity.UpdateCompletedActivityRecordRequest;
import com.sgp.systemsgp.enums.ActivityDevelopmentMode;
import com.sgp.systemsgp.enums.ActivityEvaluationPracticeType;
import com.sgp.systemsgp.enums.CompletedActivityRecordStatus;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.CompletedActivityRecord;
import com.sgp.systemsgp.model.CompletedActivityRecordEntry;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.model.Subject;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CompletedActivityRecordRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import com.sgp.systemsgp.repository.PracticePhotoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.Set;

class CompletedActivityRecordServiceTest {

    @Mock
    private CompletedActivityRecordRepository completedActivityRecordRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    @Mock
    private PracticePhotoRepository practicePhotoRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private FeedbackCommentService feedbackCommentService;

    @Mock
    private PdfExportService pdfExportService;

    private CompletedActivityRecordService completedActivityRecordService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        completedActivityRecordService = new CompletedActivityRecordService(
                completedActivityRecordRepository,
                enrollmentRepository,
                accountRepository,
                institutionRepository,
                practicePhotoRepository,
                notificationService,
                feedbackCommentService,
                pdfExportService);
    }

    @Test
    void createBuildsDraftAndCalculatesMinutes() {

        Institution institution = school();
        Account student = student();
        Account tutor = practiceTutor();
        Enrollment enrollment = enrollment(
                student,
                tutor,
                institutionalTutor(institution),
                EnrollmentStatus.APPROVED);

        CreateCompletedActivityRecordRequest request = completeRequest();

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        when(institutionRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(institution));

        when(completedActivityRecordRepository.existsByEnrollment_IdAndDeletedFalse(1L))
                .thenReturn(false);

        CompletedActivityRecordResponse response =
                completedActivityRecordService.create(
                        "student01",
                        request);

        assertThat(response.getStatus())
                .isEqualTo(CompletedActivityRecordStatus.DRAFT.name());

        assertThat(response.getStudentFullName())
                .isEqualTo("Ana Loja");

        assertThat(response.getTotalMinutes())
                .isEqualTo(270);

        verify(completedActivityRecordRepository)
                .save(any(CompletedActivityRecord.class));
    }

    @Test
    void createRejectsPendingEnrollment() {

        Account student = student();
        Enrollment enrollment = enrollment(
                student,
                practiceTutor(),
                institutionalTutor(school()),
                EnrollmentStatus.PENDING);

        CreateCompletedActivityRecordRequest request = completeRequest();

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        assertThatThrownBy(() -> completedActivityRecordService.create(
                "student01",
                request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo se puede crear el registro de una inscripcion aprobada");

        verify(completedActivityRecordRepository, never())
                .save(any(CompletedActivityRecord.class));
    }

    @Test
    void reviewSendsRecordBackWithEntryFeedback() {

        Account tutor = practiceTutor();
        Account student = student();
        CompletedActivityRecord record = submittedRecord(
                student,
                tutor,
                institutionalTutor(school()));

        ReviewCompletedActivityRecordRequest request =
                new ReviewCompletedActivityRecordRequest();
        request.setApproved(false);
        request.setActivitiesFeedback("Detallar actividades");

        CompletedActivityRecordEntryFeedbackRequest rowFeedback =
                new CompletedActivityRecordEntryFeedbackRequest();
        rowFeedback.setEntryId(100L);
        rowFeedback.setFeedback("Evidencia incompleta");
        rowFeedback.setSuggestions("Agregar enlace con permisos de lectura");
        request.setEntryFeedback(java.util.List.of(rowFeedback));

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(tutor));

        when(completedActivityRecordRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(record));

        CompletedActivityRecordResponse response =
                completedActivityRecordService.review(
                        1L,
                        "tutor.practicas",
                        request);

        assertThat(response.getStatus())
                .isEqualTo(CompletedActivityRecordStatus.NEEDS_CORRECTION.name());

        assertThat(response.getEntries().get(0).getFeedback())
                .isEqualTo("Evidencia incompleta");

        assertThat(response.getEntries().get(0).getSuggestions())
                .isEqualTo("Agregar enlace con permisos de lectura");

        verify(completedActivityRecordRepository)
                .save(record);
    }

    @Test
    void submitAllowsIncompleteDraft() {

        Account tutor = practiceTutor();
        Account student = student();
        CompletedActivityRecord record = submittedRecord(
                student,
                tutor,
                institutionalTutor(school()));
        record.setStatus(CompletedActivityRecordStatus.DRAFT);
        record.setAcademicPeriod(null);
        record.setDeliveryDate(null);
        record.getEntries().clear();

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(completedActivityRecordRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(record));

        CompletedActivityRecordResponse response =
                completedActivityRecordService.submit(
                        1L,
                        "student01");

        assertThat(response.getStatus())
                .isEqualTo(CompletedActivityRecordStatus.SUBMITTED.name());

        assertThat(response.getEntries())
                .isEmpty();

        assertThat(record.getSubmittedAt())
                .isNotNull();

        verify(completedActivityRecordRepository)
                .save(record);

        verify(notificationService)
                .notifyCompletedActivityRecordSubmitted(record);
    }

    @Test
    void correctionFlowClearsCurrentFeedbackAndApprovesAfterBothReviews() {

        Account tutor = practiceTutor();
        Account director = practiceDirector();
        Account student = student();
        CompletedActivityRecord record = submittedRecord(
                student,
                tutor,
                institutionalTutor(school()));
        record.setReviewCycle(1);

        when(completedActivityRecordRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(record));

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(tutor));

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(accountRepository.findByUsernameAndDeletedFalse("director.practicas"))
                .thenReturn(Optional.of(director));

        ReviewCompletedActivityRecordRequest observe =
                new ReviewCompletedActivityRecordRequest();
        observe.setApproved(false);
        observe.setActivitiesFeedback("Detallar actividades");

        CompletedActivityRecordEntryFeedbackRequest rowFeedback =
                new CompletedActivityRecordEntryFeedbackRequest();
        rowFeedback.setEntryId(100L);
        rowFeedback.setFeedback("Evidencia incompleta");
        observe.setEntryFeedback(java.util.List.of(rowFeedback));

        CompletedActivityRecordResponse observed =
                completedActivityRecordService.review(
                        1L,
                        "tutor.practicas",
                        observe);

        assertThat(observed.getStatus())
                .isEqualTo(CompletedActivityRecordStatus.NEEDS_CORRECTION.name());

        assertThat(observed.getActivitiesFeedback())
                .isEqualTo("Detallar actividades");

        assertThat(observed.getEntries().get(0).getFeedback())
                .isEqualTo("Evidencia incompleta");

        assertThat(observed.getReviewCycle())
                .isEqualTo(1);

        verify(feedbackCommentService)
                .upsertDocumentFeedback(
                        FeedbackDocumentType.COMPLETED_ACTIVITY_RECORD,
                        1L,
                        "activitiesFeedback",
                        "Detallar actividades",
                        tutor,
                        1);

        verify(feedbackCommentService)
                .upsertEntryFeedback(
                        FeedbackDocumentType.COMPLETED_ACTIVITY_RECORD,
                        1L,
                        "feedback",
                        100L,
                        "Evidencia incompleta",
                        tutor,
                        1);

        UpdateCompletedActivityRecordRequest correction =
                new UpdateCompletedActivityRecordRequest();
        correction.setDeliveryDate(LocalDate.of(2026, 5, 22));

        CompletedActivityRecordResponse corrected =
                completedActivityRecordService.update(
                        1L,
                        "student01",
                        correction);

        assertThat(corrected.getDeliveryDate())
                .isEqualTo(LocalDate.of(2026, 5, 22));

        CompletedActivityRecordResponse resubmitted =
                completedActivityRecordService.submit(
                        1L,
                        "student01");

        assertThat(resubmitted.getStatus())
                .isEqualTo(CompletedActivityRecordStatus.SUBMITTED.name());

        assertThat(resubmitted.getReviewCycle())
                .isEqualTo(2);

        assertThat(resubmitted.getActivitiesFeedback())
                .isNull();

        assertThat(resubmitted.getEntries().get(0).getFeedback())
                .isNull();

        assertThat(resubmitted.getEntries().get(0).getSuggestions())
                .isNull();

        verify(feedbackCommentService)
                .clearDocumentFeedback(
                        FeedbackDocumentType.COMPLETED_ACTIVITY_RECORD,
                        1L);

        ReviewCompletedActivityRecordRequest approve =
                new ReviewCompletedActivityRecordRequest();
        approve.setApproved(true);

        CompletedActivityRecordResponse tutorApproval =
                completedActivityRecordService.review(
                        1L,
                        "tutor.practicas",
                        approve);

        assertThat(tutorApproval.getStatus())
                .isEqualTo(CompletedActivityRecordStatus.SUBMITTED.name());

        assertThat(tutorApproval.isPracticeTutorApproved())
                .isTrue();

        CompletedActivityRecordResponse directorApproval =
                completedActivityRecordService.review(
                        1L,
                        "director.practicas",
                        approve);

        assertThat(directorApproval.getStatus())
                .isEqualTo(CompletedActivityRecordStatus.APPROVED.name());

        assertThat(directorApproval.isDirectorApproved())
                .isTrue();

        assertThat(record.getApprovedAt())
                .isNotNull();

        verify(notificationService)
                .notifyCompletedActivityRecordSubmitted(record);

        verify(notificationService, times(3))
                .notifyCompletedActivityRecordReviewed(record);
    }

    private CreateCompletedActivityRecordRequest completeRequest() {

        CreateCompletedActivityRecordRequest request =
                new CreateCompletedActivityRecordRequest();
        request.setEnrollmentId(1L);
        request.setEducationalInstitutionId(1L);
        request.setPracticeType(ActivityEvaluationPracticeType.DOCENTE);
        request.setAcademicPeriod("septiembre 2025-febrero 2026");
        request.setDevelopmentMode(ActivityDevelopmentMode.PRESENCIAL);
        request.setEntries(java.util.List.of(
                entry(
                        LocalDate.of(2026, 5, 13),
                        LocalTime.of(8, 0),
                        LocalTime.of(10, 30),
                        null),
                entry(
                        LocalDate.of(2026, 5, 20),
                        LocalTime.of(9, 0),
                        LocalTime.of(11, 0),
                        120)));
        request.setDeliveryDate(LocalDate.of(2026, 5, 21));

        return request;
    }

    private CompletedActivityRecordEntryRequest entry(
            LocalDate activityDate,
            LocalTime startTime,
            LocalTime endTime,
            Integer totalMinutes) {

        CompletedActivityRecordEntryRequest request =
                new CompletedActivityRecordEntryRequest();
        request.setActivityDate(activityDate);
        request.setStartTime(startTime);
        request.setEndTime(endTime);
        request.setTotalMinutes(totalMinutes);
        request.setDevelopedActivities("Actividades desarrolladas");
        request.setEvidenceLink("https://drive.google.com/evidencia");

        return request;
    }

    private CompletedActivityRecord submittedRecord(
            Account student,
            Account practiceTutor,
            Account institutionalTutor) {

        Institution institution = school();
        Course course = course(
                practiceTutor,
                institutionalTutor);
        Enrollment enrollment = enrollment(
                student,
                practiceTutor,
                institutionalTutor,
                EnrollmentStatus.APPROVED);
        enrollment.setCourse(course);

        CompletedActivityRecord record = CompletedActivityRecord.builder()
                .id(1L)
                .enrollment(enrollment)
                .student(student)
                .course(course)
                .educationalInstitution(institution)
                .educationalInstitutionName("Colegio Test")
                .practiceType(ActivityEvaluationPracticeType.DOCENTE)
                .studentFullName("Ana Loja")
                .studentIdentification("1100000001")
                .academicPeriod("septiembre 2025-febrero 2026")
                .developmentMode(ActivityDevelopmentMode.PRESENCIAL)
                .totalMinutes(150)
                .deliveryDate(LocalDate.of(2026, 5, 21))
                .status(CompletedActivityRecordStatus.SUBMITTED)
                .build();

        record.getEntries().add(CompletedActivityRecordEntry.builder()
                .id(100L)
                .record(record)
                .activityDate(LocalDate.of(2026, 5, 13))
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 30))
                .totalMinutes(150)
                .developedActivities("Actividades desarrolladas")
                .evidenceLink("https://drive.google.com/evidencia")
                .build());

        return record;
    }

    private Enrollment enrollment(
            Account student,
            Account practiceTutor,
            Account institutionalTutor,
            EnrollmentStatus status) {

        return Enrollment.builder()
                .id(1L)
                .account(student)
                .course(course(
                        practiceTutor,
                        institutionalTutor))
                .status(status)
                .build();
    }

    private Course course(
            Account practiceTutor,
            Account institutionalTutor) {

        return Course.builder()
                .id(1L)
                .name("Curso de Practicas")
                .practiceType("DOCENTE")
                .practiceTutor(practiceTutor)
                .institutionalTutor(institutionalTutor)
                .subject(subject())
                .build();
    }

    private Account student() {

        Person person = Person.builder()
                .names("Ana")
                .lastNames("Loja")
                .cedula("1100000001")
                .build();

        return Account.builder()
                .id(10L)
                .username("student01")
                .person(person)
                .roles(Set.of(role(RoleName.ROLE_ESTUDIANTE)))
                .build();
    }

    private Account practiceTutor() {

        return Account.builder()
                .id(20L)
                .username("tutor.practicas")
                .roles(Set.of(role(RoleName.ROLE_TUTOR_PRACTICAS)))
                .build();
    }

    private Account institutionalTutor(Institution institution) {

        return Account.builder()
                .id(30L)
                .username("tutor.institucional")
                .institution(institution)
                .roles(Set.of(role(RoleName.ROLE_TUTOR_INSTITUCIONAL)))
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
