package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.dto.practicefollowup.CreatePracticeFollowUpReportRequest;
import com.sgp.systemsgp.dto.practicefollowup.PracticeFollowUpReportResponse;
import com.sgp.systemsgp.dto.practicefollowup.PracticeFollowUpSessionRequest;
import com.sgp.systemsgp.enums.ActivityDevelopmentMode;
import com.sgp.systemsgp.enums.ActivityEvaluationPracticeType;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.PracticeFollowUpReport;
import com.sgp.systemsgp.model.PracticeFollowUpSession;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import com.sgp.systemsgp.repository.PracticeFollowUpReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.Set;

class PracticeFollowUpReportServiceTest {

    @Mock
    private PracticeFollowUpReportRepository practiceFollowUpReportRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    private PracticeFollowUpReportService practiceFollowUpReportService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        practiceFollowUpReportService = new PracticeFollowUpReportService(
                practiceFollowUpReportRepository,
                enrollmentRepository,
                accountRepository,
                institutionRepository);
    }

    @Test
    void createBuildsReportAndCalculatesMinutes() {

        Institution institution = school();
        Account tutor = practiceTutor();
        Account student = student();
        Enrollment enrollment = enrollment(
                student,
                tutor,
                institutionalTutor(institution),
                EnrollmentStatus.APPROVED);

        CreatePracticeFollowUpReportRequest request = completeRequest();

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(tutor));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        when(institutionRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(institution));

        when(practiceFollowUpReportRepository.existsByEnrollment_IdAndDeletedFalse(1L))
                .thenReturn(false);

        PracticeFollowUpReportResponse response =
                practiceFollowUpReportService.create(
                        "tutor.practicas",
                        request);

        assertThat(response.getStudentFullName())
                .isEqualTo("Ana Loja");

        assertThat(response.getTotalMinutes())
                .isEqualTo(270);

        assertThat(response.getTotalTime())
                .isEqualTo("4h 30min");

        assertThat(response.getSessions())
                .hasSize(2);

        verify(practiceFollowUpReportRepository)
                .save(any(PracticeFollowUpReport.class));
    }

    @Test
    void createRejectsPendingEnrollment() {

        Account tutor = practiceTutor();
        Enrollment enrollment = enrollment(
                student(),
                tutor,
                institutionalTutor(school()),
                EnrollmentStatus.PENDING);

        CreatePracticeFollowUpReportRequest request = completeRequest();

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(tutor));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        assertThatThrownBy(() -> practiceFollowUpReportService.create(
                "tutor.practicas",
                request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo se puede crear seguimiento de una inscripcion aprobada");

        verify(practiceFollowUpReportRepository, never())
                .save(any(PracticeFollowUpReport.class));
    }

    @Test
    void studentCanViewOwnReport() {

        Account student = student();
        Account tutor = practiceTutor();
        PracticeFollowUpReport report = report(
                student,
                tutor,
                institutionalTutor(school()));

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(practiceFollowUpReportRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(report));

        PracticeFollowUpReportResponse response =
                practiceFollowUpReportService.getById(
                        1L,
                        "student01");

        assertThat(response.getStudentUsername())
                .isEqualTo("student01");

        assertThat(response.getSessions())
                .hasSize(1);
    }

    private CreatePracticeFollowUpReportRequest completeRequest() {

        CreatePracticeFollowUpReportRequest request =
                new CreatePracticeFollowUpReportRequest();
        request.setEnrollmentId(1L);
        request.setEducationalInstitutionId(1L);
        request.setPracticeType(ActivityEvaluationPracticeType.DOCENTE);
        request.setAcademicPeriod("septiembre 2025-febrero 2026");
        request.setDevelopmentMode(ActivityDevelopmentMode.PRESENCIAL);
        request.setSessions(java.util.List.of(
                session(
                        LocalDate.of(2026, 5, 13),
                        LocalTime.of(8, 0),
                        LocalTime.of(10, 30),
                        null),
                session(
                        LocalDate.of(2026, 5, 20),
                        LocalTime.of(9, 0),
                        LocalTime.of(11, 0),
                        120)));
        request.setDeliveryDate(LocalDate.of(2026, 5, 21));

        return request;
    }

    private PracticeFollowUpSessionRequest session(
            LocalDate supervisionDate,
            LocalTime startTime,
            LocalTime endTime,
            Integer totalMinutes) {

        PracticeFollowUpSessionRequest request =
                new PracticeFollowUpSessionRequest();
        request.setSupervisionDate(supervisionDate);
        request.setStartTime(startTime);
        request.setEndTime(endTime);
        request.setTotalMinutes(totalMinutes);
        request.setSupervisedActivities("Actividades supervisadas");

        return request;
    }

    private PracticeFollowUpReport report(
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

        PracticeFollowUpReport report = PracticeFollowUpReport.builder()
                .id(1L)
                .enrollment(enrollment)
                .student(student)
                .course(course)
                .educationalInstitution(institution)
                .reportedBy(practiceTutor)
                .educationalInstitutionName("Colegio Test")
                .practiceType(ActivityEvaluationPracticeType.DOCENTE)
                .studentFullName("Ana Loja")
                .studentIdentification("1100000001")
                .academicPeriod("septiembre 2025-febrero 2026")
                .developmentMode(ActivityDevelopmentMode.PRESENCIAL)
                .totalMinutes(150)
                .deliveryDate(LocalDate.of(2026, 5, 21))
                .build();

        report.getSessions().add(PracticeFollowUpSession.builder()
                .report(report)
                .supervisionDate(LocalDate.of(2026, 5, 13))
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 30))
                .totalMinutes(150)
                .supervisedActivities("Actividades supervisadas")
                .build());

        return report;
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
