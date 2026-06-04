package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.dto.practiceschedule.CreatePracticeScheduleRequest;
import com.sgp.systemsgp.dto.practiceschedule.PracticeAttendanceRequest;
import com.sgp.systemsgp.dto.practiceschedule.PracticeAttendanceResponse;
import com.sgp.systemsgp.dto.practiceschedule.PracticeSchedulePeriodRequest;
import com.sgp.systemsgp.dto.practiceschedule.PracticeScheduleResponse;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.PracticeAttendanceStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.PracticeSchedule;
import com.sgp.systemsgp.model.PracticeSchedulePeriod;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.PracticeScheduleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.Set;

class PracticeScheduleServiceTest {

    @Mock
    private PracticeScheduleRepository practiceScheduleRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private AccountRepository accountRepository;

    private PracticeScheduleService practiceScheduleService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        practiceScheduleService = new PracticeScheduleService(
                practiceScheduleRepository,
                enrollmentRepository,
                accountRepository,
                new PracticeAccessService());
    }

    @Test
    void createBuildsScheduleAndCalculatesMinutes() {

        Institution institution = school();
        Account tutor = institutionalTutor(institution);
        Account student = student();
        Enrollment enrollment = enrollment(
                student,
                tutor,
                practiceTutor(),
                EnrollmentStatus.APPROVED);

        CreatePracticeScheduleRequest request = completeScheduleRequest();

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.institucional"))
                .thenReturn(Optional.of(tutor));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        when(practiceScheduleRepository.existsByEnrollment_IdAndDeletedFalse(1L))
                .thenReturn(false);

        PracticeScheduleResponse response =
                practiceScheduleService.create(
                        "tutor.institucional",
                        request);

        assertThat(response.getStudentFullName())
                .isEqualTo("Ana Loja");

        assertThat(response.getEducationalInstitutionName())
                .isEqualTo("Colegio Test");

        assertThat(response.getPeriods())
                .hasSize(2);

        assertThat(response.getPeriods().get(0).getTotalMinutes())
                .isEqualTo(240);

        assertThat(response.getScheduledBy())
                .isEqualTo("tutor.institucional");

        verify(practiceScheduleRepository)
                .save(any(PracticeSchedule.class));
    }

    @Test
    void createRejectsPendingEnrollment() {

        Institution institution = school();
        Account tutor = institutionalTutor(institution);
        Enrollment enrollment = enrollment(
                student(),
                tutor,
                practiceTutor(),
                EnrollmentStatus.PENDING);

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.institucional"))
                .thenReturn(Optional.of(tutor));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        assertThatThrownBy(() -> practiceScheduleService.create(
                "tutor.institucional",
                completeScheduleRequest()))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo se puede crear horario de una inscripcion aprobada");

        verify(practiceScheduleRepository, never())
                .save(any(PracticeSchedule.class));
    }

    @Test
    void institutionalTutorRegistersAttendanceFromPeriod() {

        Institution institution = school();
        Account tutor = institutionalTutor(institution);
        PracticeSchedule schedule = schedule(
                student(),
                tutor,
                practiceTutor());

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.institucional"))
                .thenReturn(Optional.of(tutor));

        when(practiceScheduleRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(schedule));

        PracticeAttendanceResponse response =
                practiceScheduleService.registerAttendance(
                        1L,
                        "tutor.institucional",
                        attendanceRequest(
                                LocalDate.of(2026, 5, 18),
                                PracticeAttendanceStatus.LATE));

        assertThat(response.getSchedulePeriodId())
                .isEqualTo(100L);

        assertThat(response.getScheduledDayOfWeek())
                .isEqualTo(DayOfWeek.MONDAY);

        assertThat(response.getTotalMinutes())
                .isEqualTo(235);

        assertThat(response.getRegisteredBy())
                .isEqualTo("tutor.institucional");

        verify(practiceScheduleRepository)
                .save(schedule);
    }

    @Test
    void attendanceDateMustMatchSelectedPeriodDay() {

        Institution institution = school();
        Account tutor = institutionalTutor(institution);
        PracticeSchedule schedule = schedule(
                student(),
                tutor,
                practiceTutor());

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.institucional"))
                .thenReturn(Optional.of(tutor));

        when(practiceScheduleRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(schedule));

        assertThatThrownBy(() -> practiceScheduleService.registerAttendance(
                1L,
                "tutor.institucional",
                attendanceRequest(
                        LocalDate.of(2026, 5, 19),
                        PracticeAttendanceStatus.PRESENT)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("La fecha de asistencia no coincide con el dia del periodo seleccionado");

        verify(practiceScheduleRepository, never())
                .save(any(PracticeSchedule.class));
    }

    @Test
    void studentCanViewOwnSchedule() {

        Account student = student();
        PracticeSchedule schedule = schedule(
                student,
                institutionalTutor(school()),
                practiceTutor());

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(practiceScheduleRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(schedule));

        PracticeScheduleResponse response =
                practiceScheduleService.getById(
                        1L,
                        "student01");

        assertThat(response.getStudentUsername())
                .isEqualTo("student01");

        assertThat(response.getPeriods())
                .hasSize(1);
    }

    @Test
    void institutionDirectorCanReviewSchedulesFromOwnInstitution() {

        Institution institution = school();
        Account director = institutionDirector(institution);
        PracticeSchedule schedule = schedule(
                student(),
                institutionalTutor(institution),
                practiceTutor());

        when(accountRepository.findByUsernameAndDeletedFalse("directora.colegio"))
                .thenReturn(Optional.of(director));

        when(practiceScheduleRepository.findByEducationalInstitution_IdAndDeletedFalse(1L))
                .thenReturn(java.util.List.of(schedule));

        java.util.List<PracticeScheduleResponse> response =
                practiceScheduleService.institutionReviewQueue("directora.colegio");

        assertThat(response)
                .hasSize(1);

        assertThat(response.get(0).getEducationalInstitutionName())
                .isEqualTo("Colegio Test");
    }

    @Test
    void institutionDirectorCanViewScheduleFromOwnInstitution() {

        Institution institution = school();
        Account director = institutionDirector(institution);
        PracticeSchedule schedule = schedule(
                student(),
                institutionalTutor(institution),
                practiceTutor());

        when(accountRepository.findByUsernameAndDeletedFalse("directora.colegio"))
                .thenReturn(Optional.of(director));

        when(practiceScheduleRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(schedule));

        PracticeScheduleResponse response =
                practiceScheduleService.getById(
                        1L,
                        "directora.colegio");

        assertThat(response.getEducationalInstitutionId())
                .isEqualTo(1L);
    }

    private CreatePracticeScheduleRequest completeScheduleRequest() {

        CreatePracticeScheduleRequest request =
                new CreatePracticeScheduleRequest();
        request.setEnrollmentId(1L);
        request.setStartDate(LocalDate.of(2026, 5, 18));
        request.setEndDate(LocalDate.of(2026, 8, 28));
        request.setObservations("Horario aprobado");
        request.setPeriods(java.util.List.of(
                period(
                        DayOfWeek.MONDAY,
                        LocalTime.of(8, 0),
                        LocalTime.of(12, 0)),
                period(
                        DayOfWeek.WEDNESDAY,
                        LocalTime.of(8, 0),
                        LocalTime.of(11, 0))));

        return request;
    }

    private PracticeSchedulePeriodRequest period(
            DayOfWeek dayOfWeek,
            LocalTime startTime,
            LocalTime endTime) {

        PracticeSchedulePeriodRequest request =
                new PracticeSchedulePeriodRequest();
        request.setDayOfWeek(dayOfWeek);
        request.setStartTime(startTime);
        request.setEndTime(endTime);
        request.setPlace("Aula");
        request.setNotes("Acompanamiento a docente");

        return request;
    }

    private PracticeAttendanceRequest attendanceRequest(
            LocalDate attendanceDate,
            PracticeAttendanceStatus status) {

        PracticeAttendanceRequest request =
                new PracticeAttendanceRequest();
        request.setSchedulePeriodId(100L);
        request.setAttendanceDate(attendanceDate);
        request.setStartTime(LocalTime.of(8, 5));
        request.setEndTime(LocalTime.of(12, 0));
        request.setStatus(status);
        request.setObservations("Asistencia registrada");

        return request;
    }

    private PracticeSchedule schedule(
            Account student,
            Account institutionalTutor,
            Account practiceTutor) {

        Course course = course(
                institutionalTutor,
                practiceTutor);
        Enrollment enrollment = enrollment(
                student,
                institutionalTutor,
                practiceTutor,
                EnrollmentStatus.APPROVED);
        enrollment.setCourse(course);

        PracticeSchedule schedule = PracticeSchedule.builder()
                .id(1L)
                .enrollment(enrollment)
                .student(student)
                .course(course)
                .educationalInstitution(institutionalTutor.getInstitution())
                .scheduledBy(institutionalTutor)
                .startDate(LocalDate.of(2026, 5, 18))
                .endDate(LocalDate.of(2026, 8, 28))
                .observations("Horario aprobado")
                .build();

        schedule.getPeriods().add(PracticeSchedulePeriod.builder()
                .id(100L)
                .schedule(schedule)
                .dayOfWeek(DayOfWeek.MONDAY)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(12, 0))
                .totalMinutes(240)
                .place("Aula")
                .notes("Acompanamiento")
                .build());

        return schedule;
    }

    private Enrollment enrollment(
            Account student,
            Account institutionalTutor,
            Account practiceTutor,
            EnrollmentStatus status) {

        return Enrollment.builder()
                .id(1L)
                .account(student)
                .course(course(
                        institutionalTutor,
                        practiceTutor))
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

    private Account institutionalTutor(Institution institution) {

        return Account.builder()
                .id(30L)
                .username("tutor.institucional")
                .institution(institution)
                .roles(Set.of(role(RoleName.ROLE_TUTOR_INSTITUCIONAL)))
                .build();
    }

    private Account practiceTutor() {

        return Account.builder()
                .id(20L)
                .username("tutor.practicas")
                .roles(Set.of(role(RoleName.ROLE_TUTOR_PRACTICAS)))
                .build();
    }

    private Account institutionDirector(Institution institution) {

        return Account.builder()
                .id(40L)
                .username("directora.colegio")
                .institution(institution)
                .roles(Set.of(role(RoleName.ROLE_DIRECTORA_INSTITUCION)))
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
