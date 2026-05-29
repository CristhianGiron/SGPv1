package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.dto.activityevaluation.ActivityEvaluationAspectRequest;
import com.sgp.systemsgp.dto.activityevaluation.ActivityEvaluationResponse;
import com.sgp.systemsgp.dto.activityevaluation.CreateActivityEvaluationRequest;
import com.sgp.systemsgp.enums.ActivityDevelopmentMode;
import com.sgp.systemsgp.enums.ActivityEvaluationAspectType;
import com.sgp.systemsgp.enums.ActivityEvaluationLevel;
import com.sgp.systemsgp.enums.ActivityEvaluationPracticeType;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.ActivityEvaluation;
import com.sgp.systemsgp.model.ActivityEvaluationAspect;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.ActivityEvaluationRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;

class ActivityEvaluationServiceTest {

    @Mock
    private ActivityEvaluationRepository activityEvaluationRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    private ActivityEvaluationService activityEvaluationService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        activityEvaluationService = new ActivityEvaluationService(
                activityEvaluationRepository,
                enrollmentRepository,
                accountRepository,
                institutionRepository);
    }

    @Test
    void createBuildsEvaluationFromApprovedEnrollment() {

        Institution institution = school();
        Account tutor = practiceTutor();
        Account student = student();
        Enrollment enrollment = enrollment(
                student,
                tutor,
                institutionalTutor(institution),
                EnrollmentStatus.APPROVED);

        CreateActivityEvaluationRequest request = completeRequest();

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(tutor));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        when(institutionRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(institution));

        when(activityEvaluationRepository.existsByEnrollment_IdAndDeletedFalse(1L))
                .thenReturn(false);

        ActivityEvaluationResponse response = activityEvaluationService.create(
                "tutor.practicas",
                request);

        assertThat(response.getStudentFullName())
                .isEqualTo("Ana Loja");

        assertThat(response.getPracticeType())
                .isEqualTo(ActivityEvaluationPracticeType.DOCENTE.name());

        assertThat(response.getTotalScore())
                .isEqualTo(5);

        assertThat(response.getAverageScore())
                .isEqualByComparingTo("2.50");

        verify(activityEvaluationRepository)
                .save(any(ActivityEvaluation.class));
    }

    @Test
    void createRejectsPendingEnrollment() {

        Account tutor = practiceTutor();
        Enrollment enrollment = enrollment(
                student(),
                tutor,
                institutionalTutor(school()),
                EnrollmentStatus.PENDING);

        CreateActivityEvaluationRequest request = completeRequest();

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(tutor));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        assertThatThrownBy(() -> activityEvaluationService.create(
                "tutor.practicas",
                request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo se puede evaluar una inscripcion aprobada");

        verify(activityEvaluationRepository, never())
                .save(any(ActivityEvaluation.class));
    }

    @Test
    void studentCanViewOwnEvaluation() {

        Account student = student();
        Account tutor = practiceTutor();
        ActivityEvaluation evaluation = evaluation(
                student,
                tutor,
                institutionalTutor(school()));

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(activityEvaluationRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(evaluation));

        ActivityEvaluationResponse response = activityEvaluationService.getById(
                1L,
                "student01");

        assertThat(response.getStudentUsername())
                .isEqualTo("student01");

        assertThat(response.getAspects())
                .hasSize(2);
    }

    private CreateActivityEvaluationRequest completeRequest() {

        CreateActivityEvaluationRequest request = new CreateActivityEvaluationRequest();
        request.setEnrollmentId(1L);
        request.setEducationalInstitutionId(1L);
        request.setPracticeType(ActivityEvaluationPracticeType.DOCENTE);
        request.setAcademicPeriod("septiembre 2025-febrero 2026");
        request.setDevelopmentMode(ActivityDevelopmentMode.PRESENCIAL);
        request.setAspects(java.util.List.of(
                aspect(
                        ActivityEvaluationAspectType.GENERAL,
                        "Puntualidad",
                        ActivityEvaluationLevel.ALTO),
                aspect(
                        ActivityEvaluationAspectType.ESPECIFICO,
                        "Planificacion pedagogica",
                        ActivityEvaluationLevel.MEDIO)));
        request.setHoursCompleted(120);
        request.setActivitiesCompletionPercentage(BigDecimal.valueOf(95.5));
        request.setEvaluationDate(LocalDate.of(2026, 5, 13));

        return request;
    }

    private ActivityEvaluationAspectRequest aspect(
            ActivityEvaluationAspectType type,
            String item,
            ActivityEvaluationLevel level) {

        ActivityEvaluationAspectRequest request =
                new ActivityEvaluationAspectRequest();
        request.setAspectType(type);
        request.setItem(item);
        request.setLevel(level);

        return request;
    }

    private ActivityEvaluation evaluation(
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

        ActivityEvaluation evaluation = ActivityEvaluation.builder()
                .id(1L)
                .enrollment(enrollment)
                .student(student)
                .course(course)
                .educationalInstitution(institution)
                .evaluatedBy(practiceTutor)
                .educationalInstitutionName("Colegio Test")
                .practiceType(ActivityEvaluationPracticeType.DOCENTE)
                .studentFullName("Ana Loja")
                .studentIdentification("1100000001")
                .academicPeriod("septiembre 2025-febrero 2026")
                .developmentMode(ActivityDevelopmentMode.PRESENCIAL)
                .hoursCompleted(120)
                .activitiesCompletionPercentage(BigDecimal.valueOf(95.5))
                .evaluationDate(LocalDate.of(2026, 5, 13))
                .build();

        evaluation.getAspects().add(ActivityEvaluationAspect.builder()
                .evaluation(evaluation)
                .aspectType(ActivityEvaluationAspectType.GENERAL)
                .item("Puntualidad")
                .level(ActivityEvaluationLevel.ALTO)
                .build());
        evaluation.getAspects().add(ActivityEvaluationAspect.builder()
                .evaluation(evaluation)
                .aspectType(ActivityEvaluationAspectType.ESPECIFICO)
                .item("Planificacion")
                .level(ActivityEvaluationLevel.MEDIO)
                .build());

        return evaluation;
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
                .academicCycle(AcademicCycle.builder()
                        .name("septiembre 2025-febrero 2026")
                        .build())
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
