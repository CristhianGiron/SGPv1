package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.dto.activityplan.ActivityPlanResponse;
import com.sgp.systemsgp.dto.activityplan.CreateActivityPlanRequest;
import com.sgp.systemsgp.dto.activityplan.ReviewActivityPlanRequest;
import com.sgp.systemsgp.dto.activityplan.UpdateActivityPlanRequest;
import com.sgp.systemsgp.enums.ActivityPlanStatus;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.ActivityPlan;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.ActivityPlanRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;
import java.util.Set;

class ActivityPlanServiceTest {

    @Mock
    private ActivityPlanRepository activityPlanRepository;

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

    private ActivityPlanService activityPlanService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        activityPlanService = new ActivityPlanService(
                activityPlanRepository,
                enrollmentRepository,
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

        CreateActivityPlanRequest request = new CreateActivityPlanRequest();
        request.setEnrollmentId(1L);
        request.setEducationalInstitutionId(1L);
        request.setCurricularOrganizationUnit("Unidad profesional");
        request.setPracticeType("Preprofesional");

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        when(institutionRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(institution));

        when(activityPlanRepository.existsByEnrollment_IdAndDeletedFalse(1L))
                .thenReturn(false);

        ActivityPlanResponse response = activityPlanService.create(
                "student01",
                request);

        assertThat(response.getStatus())
                .isEqualTo(ActivityPlanStatus.DRAFT.name());

        assertThat(response.getStudentFullName())
                .isEqualTo("Ana Loja");

        assertThat(response.getPracticeType())
                .isEqualTo("DOCENTE");

        verify(activityPlanRepository)
                .save(any(ActivityPlan.class));
    }

    @Test
    void createRejectsPendingEnrollment() {

        Account student = student();
        Enrollment enrollment = enrollment(student, EnrollmentStatus.PENDING);

        CreateActivityPlanRequest request = new CreateActivityPlanRequest();
        request.setEnrollmentId(1L);

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        assertThatThrownBy(() -> activityPlanService.create("student01", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo se puede crear el plan de una inscripción aprobada");

        verify(activityPlanRepository, never())
                .save(any(ActivityPlan.class));
    }

    @Test
    void reviewSendsPlanBackForCorrection() {

        Account tutor = tutor();
        Account student = student();
        ActivityPlan plan = submittedPlan(student, tutor);

        ReviewActivityPlanRequest request = new ReviewActivityPlanRequest();
        request.setApproved(false);
        request.setActivitiesFeedback("Detallar actividades por semana");

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(tutor));

        when(activityPlanRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(plan));

        ActivityPlanResponse response = activityPlanService.review(
                1L,
                "tutor.practicas",
                request);

        assertThat(response.getStatus())
                .isEqualTo(ActivityPlanStatus.NEEDS_CORRECTION.name());

        assertThat(response.getActivitiesFeedback())
                .isEqualTo("Detallar actividades por semana");

        verify(activityPlanRepository)
                .save(plan);
    }

    @Test
    void approvalRequiresPracticeTutorAndDirector() {

        Account tutor = tutor();
        Account director = director();
        Account student = student();
        ActivityPlan plan = submittedPlan(student, tutor);

        ReviewActivityPlanRequest request = new ReviewActivityPlanRequest();
        request.setApproved(true);

        when(activityPlanRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(plan));

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(tutor));

        when(accountRepository.findByUsernameAndDeletedFalse("director.practicas"))
                .thenReturn(Optional.of(director));

        ActivityPlanResponse tutorResponse = activityPlanService.review(
                1L,
                "tutor.practicas",
                request);

        assertThat(tutorResponse.getStatus())
                .isEqualTo(ActivityPlanStatus.SUBMITTED.name());

        assertThat(tutorResponse.isPracticeTutorApproved())
                .isTrue();

        assertThat(tutorResponse.isDirectorApproved())
                .isFalse();

        ActivityPlanResponse directorResponse = activityPlanService.review(
                1L,
                "director.practicas",
                request);

        assertThat(directorResponse.getStatus())
                .isEqualTo(ActivityPlanStatus.APPROVED.name());

        assertThat(directorResponse.isDirectorApproved())
                .isTrue();

        verify(activityPlanRepository, times(2))
                .save(plan);
    }

    @Test
    void updateSubmittedPlanReturnsItToPrivateDraft() {

        Account tutor = tutor();
        Account student = student();
        ActivityPlan plan = submittedPlan(student, tutor);

        UpdateActivityPlanRequest request = new UpdateActivityPlanRequest();
        request.setPresentation("Presentacion ajustada");

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(activityPlanRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(plan));

        ActivityPlanResponse response = activityPlanService.update(
                1L,
                "student01",
                request);

        assertThat(response.getStatus())
                .isEqualTo(ActivityPlanStatus.DRAFT.name());

        assertThat(response.getPresentation())
                .isEqualTo("Presentacion ajustada");

        verify(activityPlanRepository)
                .save(plan);
    }

    @Test
    void submitAllowsIncompleteDraft() {

        Account tutor = tutor();
        Account student = student();
        ActivityPlan plan = submittedPlan(student, tutor);
        plan.setStatus(ActivityPlanStatus.DRAFT);

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(activityPlanRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(plan));

        ActivityPlanResponse response = activityPlanService.submit(
                1L,
                "student01");

        assertThat(response.getStatus())
                .isEqualTo(ActivityPlanStatus.SUBMITTED.name());

        assertThat(plan.getSubmittedAt())
                .isNotNull();

        verify(activityPlanRepository)
                .save(plan);

        verify(notificationService)
                .notifyActivityPlanSubmitted(plan);
    }

    @Test
    void correctionFlowClearsCurrentFeedbackAndApprovesAfterBothReviews() {

        Account tutor = tutor();
        Account director = director();
        Account student = student();
        ActivityPlan plan = submittedPlan(student, tutor);
        plan.setReviewCycle(1);

        when(activityPlanRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(plan));

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(tutor));

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(accountRepository.findByUsernameAndDeletedFalse("director.practicas"))
                .thenReturn(Optional.of(director));

        ReviewActivityPlanRequest observe = new ReviewActivityPlanRequest();
        observe.setApproved(false);
        observe.setActivitiesFeedback("Detallar actividades por semana");

        ActivityPlanResponse observed = activityPlanService.review(
                1L,
                "tutor.practicas",
                observe);

        assertThat(observed.getStatus())
                .isEqualTo(ActivityPlanStatus.NEEDS_CORRECTION.name());

        assertThat(observed.getActivitiesFeedback())
                .isEqualTo("Detallar actividades por semana");

        assertThat(observed.getReviewCycle())
                .isEqualTo(1);

        verify(feedbackCommentService)
                .upsertDocumentFeedback(
                        FeedbackDocumentType.ACTIVITY_PLAN,
                        1L,
                        "activitiesFeedback",
                        "Detallar actividades por semana",
                        tutor,
                        1);

        UpdateActivityPlanRequest correction = new UpdateActivityPlanRequest();
        correction.setPresentation("Presentacion ajustada por el estudiante");

        ActivityPlanResponse corrected = activityPlanService.update(
                1L,
                "student01",
                correction);

        assertThat(corrected.getPresentation())
                .isEqualTo("Presentacion ajustada por el estudiante");

        ActivityPlanResponse resubmitted = activityPlanService.submit(
                1L,
                "student01");

        assertThat(resubmitted.getStatus())
                .isEqualTo(ActivityPlanStatus.SUBMITTED.name());

        assertThat(resubmitted.getReviewCycle())
                .isEqualTo(2);

        assertThat(resubmitted.getActivitiesFeedback())
                .isNull();

        assertThat(resubmitted.isPracticeTutorApproved())
                .isFalse();

        assertThat(resubmitted.isDirectorApproved())
                .isFalse();

        verify(feedbackCommentService)
                .clearDocumentFeedback(
                        FeedbackDocumentType.ACTIVITY_PLAN,
                        1L);

        ReviewActivityPlanRequest approve = new ReviewActivityPlanRequest();
        approve.setApproved(true);

        ActivityPlanResponse tutorApproval = activityPlanService.review(
                1L,
                "tutor.practicas",
                approve);

        assertThat(tutorApproval.getStatus())
                .isEqualTo(ActivityPlanStatus.SUBMITTED.name());

        assertThat(tutorApproval.isPracticeTutorApproved())
                .isTrue();

        ActivityPlanResponse directorApproval = activityPlanService.review(
                1L,
                "director.practicas",
                approve);

        assertThat(directorApproval.getStatus())
                .isEqualTo(ActivityPlanStatus.APPROVED.name());

        assertThat(directorApproval.isDirectorApproved())
                .isTrue();

        assertThat(plan.getApprovedAt())
                .isNotNull();

        verify(notificationService)
                .notifyActivityPlanSubmitted(plan);

        verify(notificationService, times(3))
                .notifyActivityPlanReviewed(plan);
    }

    private ActivityPlan submittedPlan(
            Account student,
            Account tutor) {

        Institution institution = school();
        Course course = course(tutor);
        Enrollment enrollment = enrollment(student, EnrollmentStatus.APPROVED);
        enrollment.setCourse(course);

        return ActivityPlan.builder()
                .id(1L)
                .enrollment(enrollment)
                .student(student)
                .course(course)
                .educationalInstitution(institution)
                .studentFullName("Ana Loja")
                .educationalInstitutionName("Colegio Test")
                .status(ActivityPlanStatus.SUBMITTED)
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
                .curricularOrganizationUnit("Preprofesional")
                .integrativeKnowledgeProject("Proyecto integrador")
                .practiceType("DOCENTE")
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
