package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.practiceschedule.CreatePracticeScheduleRequest;
import com.sgp.systemsgp.dto.practiceschedule.PracticeAttendanceRequest;
import com.sgp.systemsgp.dto.practiceschedule.PracticeAttendanceResponse;
import com.sgp.systemsgp.dto.practiceschedule.PracticeSchedulePeriodRequest;
import com.sgp.systemsgp.dto.practiceschedule.PracticeSchedulePeriodResponse;
import com.sgp.systemsgp.dto.practiceschedule.PracticeScheduleResponse;
import com.sgp.systemsgp.dto.practiceschedule.UpdatePracticeScheduleRequest;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.PracticeAttendanceStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.PracticeAttendance;
import com.sgp.systemsgp.model.PracticeSchedule;
import com.sgp.systemsgp.model.PracticeSchedulePeriod;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.PracticeScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PracticeScheduleService {

    private final PracticeScheduleRepository practiceScheduleRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public PracticeScheduleResponse create(
            String username,
            CreatePracticeScheduleRequest request) {

        Account tutor = getAccount(username);
        Enrollment enrollment = getEnrollment(request.getEnrollmentId());

        validateEnrollmentApproved(enrollment);
        validateInstitutionalTutorCanManage(enrollment, tutor);

        if (practiceScheduleRepository.existsByEnrollment_IdAndDeletedFalse(
                enrollment.getId())) {
            throw new BadRequestException(
                    "Ya existe un horario de practicas para esta inscripcion");
        }

        Institution institution = resolveEducationalInstitution(enrollment);

        PracticeSchedule schedule = PracticeSchedule.builder()
                .enrollment(enrollment)
                .student(enrollment.getAccount())
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .scheduledBy(tutor)
                .build();

        applyCreateData(schedule, request);
        validateComplete(schedule);

        practiceScheduleRepository.save(schedule);

        return mapToResponse(schedule);
    }

    public List<PracticeScheduleResponse> mySchedules(String username) {

        return practiceScheduleRepository
                .findByStudent_UsernameAndDeletedFalse(username)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<PracticeScheduleResponse> managedSchedules(String username) {

        List<PracticeSchedule> schedules = new ArrayList<>();
        schedules.addAll(practiceScheduleRepository
                .findByEnrollment_Group_InstitutionalTutor_UsernameAndDeletedFalse(username));
        schedules.addAll(practiceScheduleRepository
                .findByCourse_InstitutionalTutor_UsernameAndDeletedFalse(username));

        Map<Long, PracticeSchedule> uniqueSchedules = new LinkedHashMap<>();
        schedules.forEach(schedule -> uniqueSchedules.putIfAbsent(schedule.getId(), schedule));

        return uniqueSchedules
                .values()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<PracticeScheduleResponse> institutionReviewQueue(String username) {

        Account director = getAccount(username);

        validateInstitutionDirectorCanReview(director);

        return practiceScheduleRepository
                .findByEducationalInstitution_IdAndDeletedFalse(
                        director.getInstitution().getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public PracticeScheduleResponse getById(
            Long id,
            String username) {

        PracticeSchedule schedule = getSchedule(id);
        Account account = getAccount(username);

        validateCanView(schedule, account);

        return mapToResponse(schedule);
    }

    @Transactional
    public PracticeScheduleResponse update(
            Long id,
            String username,
            UpdatePracticeScheduleRequest request) {

        PracticeSchedule schedule = getSchedule(id);
        Account tutor = getAccount(username);

        validateInstitutionalTutorCanManage(schedule.getEnrollment(), tutor);

        applyUpdateData(schedule, request);
        schedule.setScheduledBy(tutor);
        validateComplete(schedule);

        practiceScheduleRepository.save(schedule);

        return mapToResponse(schedule);
    }

    @Transactional
    public PracticeAttendanceResponse registerAttendance(
            Long scheduleId,
            String username,
            PracticeAttendanceRequest request) {

        PracticeSchedule schedule = getSchedule(scheduleId);
        Account tutor = getAccount(username);

        validateInstitutionalTutorCanManage(schedule.getEnrollment(), tutor);

        PracticeAttendance attendance = PracticeAttendance.builder()
                .schedule(schedule)
                .registeredBy(tutor)
                .registeredAt(LocalDateTime.now())
                .build();

        applyAttendanceData(attendance, schedule, request, tutor);
        validateAttendance(schedule, attendance, null);

        schedule.getAttendances().add(attendance);
        practiceScheduleRepository.save(schedule);

        return mapAttendance(attendance);
    }

    @Transactional
    public PracticeAttendanceResponse updateAttendance(
            Long scheduleId,
            Long attendanceId,
            String username,
            PracticeAttendanceRequest request) {

        PracticeSchedule schedule = getSchedule(scheduleId);
        Account tutor = getAccount(username);

        validateInstitutionalTutorCanManage(schedule.getEnrollment(), tutor);

        PracticeAttendance attendance = findAttendance(schedule, attendanceId);

        applyAttendanceData(attendance, schedule, request, tutor);
        validateAttendance(schedule, attendance, attendanceId);

        practiceScheduleRepository.save(schedule);

        return mapAttendance(attendance);
    }

    private Account getAccount(String username) {

        return accountRepository
                .findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new NotFoundException(
                        "Cuenta no encontrada"));
    }

    private Enrollment getEnrollment(Long id) {

        return enrollmentRepository
                .findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Inscripcion no encontrada"));
    }

    private PracticeSchedule getSchedule(Long id) {

        return practiceScheduleRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Horario de practicas no encontrado"));
    }

    private void validateEnrollmentApproved(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException(
                    "Solo se puede crear horario de una inscripcion aprobada");
        }

        if (!isActiveCourseEnrollment(enrollment)) {
            throw new BadRequestException(
                    "El curso de la inscripcion no esta activo");
        }
    }

    private boolean isActiveCourseEnrollment(Enrollment enrollment) {

        Course course = enrollment.getCourse();

        return course != null
                && course.isActive()
                && !course.isDeleted();
    }

    private void validateInstitutionalTutorCanManage(
            Enrollment enrollment,
            Account tutor) {

        if (!hasRole(tutor, RoleName.ROLE_TUTOR_INSTITUCIONAL)
                || !InstitutionalAssignmentResolver.isAssignedInstitutionalTutor(enrollment, tutor)) {
            throw new AccessDeniedException(
                    "Solo el tutor institucional asignado puede gestionar este horario");
        }
    }

    private void validateCanView(
            PracticeSchedule schedule,
            Account account) {

        if (schedule.getStudent().getId().equals(account.getId())
                || isAssignedInstitutionalTutor(schedule, account)
                || isAssignedPracticeTutor(schedule, account)
                || isInstitutionDirectorForSchedule(schedule, account)
                || hasRole(account, RoleName.ROLE_ADMIN)
                || hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            return;
        }

        throw new AccessDeniedException(
                "No puedes ver este horario de practicas");
    }

    private boolean isAssignedInstitutionalTutor(
            PracticeSchedule schedule,
            Account account) {

        return InstitutionalAssignmentResolver.isAssignedInstitutionalTutor(
                schedule.getEnrollment(),
                account);
    }

    private boolean isAssignedPracticeTutor(
            PracticeSchedule schedule,
            Account account) {

        Course course = schedule.getCourse();

        return course.getPracticeTutor() != null
                && course.getPracticeTutor().getId().equals(account.getId());
    }

    private void validateInstitutionDirectorCanReview(Account account) {

        if (!hasRole(account, RoleName.ROLE_DIRECTORA_INSTITUCION)) {
            throw new AccessDeniedException(
                    "Solo la directora de institucion puede revisar estos registros");
        }

        if (account.getInstitution() == null) {
            throw new BadRequestException(
                    "La directora de institucion debe tener una institucion asignada");
        }

        validateEducationalInstitution(account.getInstitution());
    }

    private boolean isInstitutionDirectorForSchedule(
            PracticeSchedule schedule,
            Account account) {

        return hasRole(account, RoleName.ROLE_DIRECTORA_INSTITUCION)
                && account.getInstitution() != null
                && schedule.getEducationalInstitution() != null
                && Objects.equals(
                        account.getInstitution().getId(),
                        schedule.getEducationalInstitution().getId());
    }

    private boolean hasRole(
            Account account,
            RoleName roleName) {

        return account.getRoles() != null
                && account.getRoles()
                        .stream()
                        .anyMatch(role -> roleName.name().equals(role.getName()));
    }

    private Institution resolveEducationalInstitution(Enrollment enrollment) {

        Institution institution = InstitutionalAssignmentResolver.educationalInstitution(enrollment);

        if (institution == null) {
            throw new BadRequestException(
                    "La inscripcion debe estar asignada a un grupo con tutor institucional e institucion");
        }

        validateEducationalInstitution(institution);

        return institution;
    }

    private void validateEducationalInstitution(Institution institution) {

        if (!institution.isActive() || institution.isDeleted()) {
            throw new BadRequestException(
                    "La institucion educativa receptora no esta activa");
        }

        if (institution.getType() != InstitutionType.ESCUELA
                && institution.getType() != InstitutionType.COLEGIO) {
            throw new BadRequestException(
                    "La institucion educativa receptora debe ser escuela o colegio");
        }
    }

    private void applyCreateData(
            PracticeSchedule schedule,
            CreatePracticeScheduleRequest request) {

        schedule.setStartDate(request.getStartDate());
        schedule.setEndDate(request.getEndDate());
        schedule.setObservations(request.getObservations());
        replacePeriods(schedule, request.getPeriods());
    }

    private void applyUpdateData(
            PracticeSchedule schedule,
            UpdatePracticeScheduleRequest request) {

        setIfNotNull(request.getStartDate(), schedule::setStartDate);
        setIfNotNull(request.getEndDate(), schedule::setEndDate);
        setIfNotNull(request.getObservations(), schedule::setObservations);

        if (request.getPeriods() != null) {
            replacePeriods(schedule, request.getPeriods());
        }
    }

    private void replacePeriods(
            PracticeSchedule schedule,
            List<PracticeSchedulePeriodRequest> periods) {

        schedule.getPeriods().clear();

        if (periods == null) {
            return;
        }

        for (PracticeSchedulePeriodRequest request : periods) {
            PracticeSchedulePeriod period = PracticeSchedulePeriod.builder()
                    .schedule(schedule)
                    .dayOfWeek(request.getDayOfWeek())
                    .startTime(request.getStartTime())
                    .endTime(request.getEndTime())
                    .totalMinutes(resolvePeriodMinutes(
                            request.getStartTime(),
                            request.getEndTime()))
                    .place(request.getPlace())
                    .notes(request.getNotes())
                    .build();

            schedule.getPeriods().add(period);
        }
    }

    private Integer resolvePeriodMinutes(
            LocalTime startTime,
            LocalTime endTime) {

        if (startTime == null || endTime == null) {
            return null;
        }

        return Math.toIntExact(Duration.between(
                startTime,
                endTime).toMinutes());
    }

    private void validateComplete(PracticeSchedule schedule) {

        if (schedule.getStartDate() != null
                && schedule.getEndDate() != null
                && schedule.getEndDate().isBefore(schedule.getStartDate())) {
            throw new BadRequestException(
                    "La fecha final del horario no puede ser anterior a la fecha inicial");
        }

        if (schedule.getPeriods().isEmpty()) {
            throw new BadRequestException(
                    "Debe registrar al menos un periodo de asistencia");
        }

        validatePeriods(schedule);
    }

    private void validatePeriods(PracticeSchedule schedule) {

        for (PracticeSchedulePeriod period : schedule.getPeriods()) {
            if (period.getDayOfWeek() == null
                    || period.getStartTime() == null
                    || period.getEndTime() == null) {
                throw new BadRequestException(
                        "Cada periodo debe tener dia, hora de inicio y hora de fin");
            }

            if (!period.getEndTime().isAfter(period.getStartTime())) {
                throw new BadRequestException(
                        "La hora de fin del periodo debe ser posterior a la hora de inicio");
            }

            if (period.getTotalMinutes() == null || period.getTotalMinutes() <= 0) {
                throw new BadRequestException(
                        "Cada periodo debe tener una duracion mayor a cero");
            }
        }

        for (DayOfWeek day : DayOfWeek.values()) {
            List<PracticeSchedulePeriod> dayPeriods = schedule.getPeriods()
                    .stream()
                    .filter(period -> period.getDayOfWeek() == day)
                    .sorted(Comparator.comparing(PracticeSchedulePeriod::getStartTime))
                    .toList();

            for (int index = 1; index < dayPeriods.size(); index++) {
                PracticeSchedulePeriod previous = dayPeriods.get(index - 1);
                PracticeSchedulePeriod current = dayPeriods.get(index);

                if (current.getStartTime().isBefore(previous.getEndTime())) {
                    throw new BadRequestException(
                            "Los periodos de un mismo dia no deben solaparse");
                }
            }
        }
    }

    private void applyAttendanceData(
            PracticeAttendance attendance,
            PracticeSchedule schedule,
            PracticeAttendanceRequest request,
            Account tutor) {

        PracticeSchedulePeriod period = request.getSchedulePeriodId() != null
                ? findPeriod(schedule, request.getSchedulePeriodId())
                : null;

        attendance.setSchedulePeriodId(
                period != null
                        ? period.getId()
                        : null);
        attendance.setScheduledDayOfWeek(
                period != null
                        ? period.getDayOfWeek()
                        : null);
        attendance.setScheduledStartTime(
                period != null
                        ? period.getStartTime()
                        : null);
        attendance.setScheduledEndTime(
                period != null
                        ? period.getEndTime()
                        : null);
        attendance.setAttendanceDate(request.getAttendanceDate());
        attendance.setStartTime(request.getStartTime());
        attendance.setEndTime(request.getEndTime());
        attendance.setTotalMinutes(resolveAttendanceMinutes(
                request.getStartTime(),
                request.getEndTime(),
                request.getTotalMinutes()));
        attendance.setStatus(request.getStatus());
        attendance.setObservations(request.getObservations());

        if (attendance.getRegisteredBy() == null) {
            attendance.setRegisteredBy(tutor);
        }

        if (attendance.getRegisteredAt() == null) {
            attendance.setRegisteredAt(LocalDateTime.now());
        }
    }

    private PracticeSchedulePeriod findPeriod(
            PracticeSchedule schedule,
            Long periodId) {

        return schedule.getPeriods()
                .stream()
                .filter(period -> Objects.equals(period.getId(), periodId))
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "El periodo no pertenece a este horario"));
    }

    private PracticeAttendance findAttendance(
            PracticeSchedule schedule,
            Long attendanceId) {

        return schedule.getAttendances()
                .stream()
                .filter(attendance -> Objects.equals(attendance.getId(), attendanceId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException(
                        "Asistencia no encontrada en este horario"));
    }

    private Integer resolveAttendanceMinutes(
            LocalTime startTime,
            LocalTime endTime,
            Integer requestedTotalMinutes) {

        if (requestedTotalMinutes != null) {
            return requestedTotalMinutes;
        }

        if (startTime == null && endTime == null) {
            return 0;
        }

        if (startTime == null || endTime == null) {
            return null;
        }

        return Math.toIntExact(Duration.between(
                startTime,
                endTime).toMinutes());
    }

    private void validateAttendance(
            PracticeSchedule schedule,
            PracticeAttendance attendance,
            Long currentAttendanceId) {

        if (attendance.getAttendanceDate() == null) {
            throw new BadRequestException(
                    "La fecha de asistencia es obligatoria");
        }

        if (attendance.getStatus() == null) {
            throw new BadRequestException(
                    "El estado de asistencia es obligatorio");
        }

        if (attendance.getScheduledDayOfWeek() != null
                && attendance.getAttendanceDate().getDayOfWeek()
                        != attendance.getScheduledDayOfWeek()) {
            throw new BadRequestException(
                    "La fecha de asistencia no coincide con el dia del periodo seleccionado");
        }

        validateAttendanceTimes(attendance);
        validateDuplicateAttendance(schedule, attendance, currentAttendanceId);
    }

    private void validateAttendanceTimes(PracticeAttendance attendance) {

        boolean requiresTimes = attendance.getStatus() == PracticeAttendanceStatus.PRESENT
                || attendance.getStatus() == PracticeAttendanceStatus.LATE;

        if (requiresTimes
                && (attendance.getStartTime() == null
                        || attendance.getEndTime() == null)) {
            throw new BadRequestException(
                    "Las asistencias presentes o atrasadas requieren hora de inicio y hora de fin");
        }

        if ((attendance.getStartTime() == null) != (attendance.getEndTime() == null)) {
            throw new BadRequestException(
                    "Debe registrar hora de inicio y hora de fin juntas");
        }

        if (attendance.getStartTime() != null
                && !attendance.getEndTime().isAfter(attendance.getStartTime())) {
            throw new BadRequestException(
                    "La hora de fin de la asistencia debe ser posterior a la hora de inicio");
        }

        if (attendance.getTotalMinutes() == null || attendance.getTotalMinutes() < 0) {
            throw new BadRequestException(
                    "El total de minutos de asistencia debe ser mayor o igual a cero");
        }

        if (requiresTimes && attendance.getTotalMinutes() <= 0) {
            throw new BadRequestException(
                    "Las asistencias presentes o atrasadas deben sumar minutos asistidos");
        }
    }

    private void validateDuplicateAttendance(
            PracticeSchedule schedule,
            PracticeAttendance attendance,
            Long currentAttendanceId) {

        if (attendance.getSchedulePeriodId() == null) {
            return;
        }

        boolean duplicated = schedule.getAttendances()
                .stream()
                .filter(existing -> !Objects.equals(existing.getId(), currentAttendanceId))
                .anyMatch(existing -> Objects.equals(
                        existing.getSchedulePeriodId(),
                        attendance.getSchedulePeriodId())
                        && Objects.equals(
                                existing.getAttendanceDate(),
                                attendance.getAttendanceDate()));

        if (duplicated) {
            throw new BadRequestException(
                    "Ya existe una asistencia registrada para ese periodo y fecha");
        }
    }

    private <T> void setIfNotNull(
            T value,
            Consumer<T> setter) {

        if (value != null) {
            setter.accept(value);
        }
    }

    private String joinNames(
            String names,
            String lastNames) {

        String joined = ((names != null ? names : "")
                + " "
                + (lastNames != null ? lastNames : ""))
                .trim();

        return joined.isBlank() ? null : joined;
    }

    private String formatMinutes(Integer totalMinutes) {

        if (totalMinutes == null) {
            return null;
        }

        int hours = totalMinutes / 60;
        int minutes = totalMinutes % 60;

        return hours + "h " + minutes + "min";
    }

    private PracticeScheduleResponse mapToResponse(PracticeSchedule schedule) {

        Person person = schedule.getStudent().getPerson();

        return PracticeScheduleResponse.builder()
                .id(schedule.getId())
                .enrollmentId(schedule.getEnrollment().getId())
                .courseId(schedule.getCourse().getId())
                .courseName(schedule.getCourse().getName())
                .studentId(schedule.getStudent().getId())
                .studentUsername(schedule.getStudent().getUsername())
                .studentFullName(
                        person != null
                                ? joinNames(person.getNames(), person.getLastNames())
                                : null)
                .studentIdentification(
                        person != null
                                ? person.getCedula()
                                : null)
                .educationalInstitutionId(schedule.getEducationalInstitution().getId())
                .educationalInstitutionName(schedule.getEducationalInstitution().getName())
                .educationalInstitutionCode(schedule.getEducationalInstitution().getCode())
                .startDate(schedule.getStartDate())
                .endDate(schedule.getEndDate())
                .observations(schedule.getObservations())
                .periods(mapPeriods(schedule))
                .attendances(mapAttendances(schedule))
                .scheduledBy(schedule.getScheduledBy().getUsername())
                .createdAt(schedule.getCreatedAt())
                .updatedAt(schedule.getUpdatedAt())
                .build();
    }

    private List<PracticeSchedulePeriodResponse> mapPeriods(PracticeSchedule schedule) {

        return schedule.getPeriods()
                .stream()
                .sorted(Comparator
                        .comparing(
                                (PracticeSchedulePeriod period) -> period.getDayOfWeek() != null
                                        ? period.getDayOfWeek().getValue()
                                        : Integer.MAX_VALUE)
                        .thenComparing(
                                PracticeSchedulePeriod::getStartTime,
                                Comparator.nullsLast(LocalTime::compareTo)))
                .map(period -> PracticeSchedulePeriodResponse.builder()
                        .id(period.getId())
                        .dayOfWeek(period.getDayOfWeek())
                        .startTime(period.getStartTime())
                        .endTime(period.getEndTime())
                        .totalMinutes(period.getTotalMinutes())
                        .totalTime(formatMinutes(period.getTotalMinutes()))
                        .place(period.getPlace())
                        .notes(period.getNotes())
                        .build())
                .toList();
    }

    private List<PracticeAttendanceResponse> mapAttendances(PracticeSchedule schedule) {

        return schedule.getAttendances()
                .stream()
                .sorted(Comparator
                        .comparing(
                                PracticeAttendance::getAttendanceDate,
                                Comparator.nullsLast(java.time.LocalDate::compareTo))
                        .thenComparing(
                                PracticeAttendance::getStartTime,
                                Comparator.nullsLast(LocalTime::compareTo)))
                .map(this::mapAttendance)
                .toList();
    }

    private PracticeAttendanceResponse mapAttendance(PracticeAttendance attendance) {

        return PracticeAttendanceResponse.builder()
                .id(attendance.getId())
                .scheduleId(attendance.getSchedule().getId())
                .schedulePeriodId(attendance.getSchedulePeriodId())
                .scheduledDayOfWeek(attendance.getScheduledDayOfWeek())
                .scheduledStartTime(attendance.getScheduledStartTime())
                .scheduledEndTime(attendance.getScheduledEndTime())
                .attendanceDate(attendance.getAttendanceDate())
                .startTime(attendance.getStartTime())
                .endTime(attendance.getEndTime())
                .totalMinutes(attendance.getTotalMinutes())
                .totalTime(formatMinutes(attendance.getTotalMinutes()))
                .status(
                        attendance.getStatus() != null
                                ? attendance.getStatus().name()
                                : null)
                .observations(attendance.getObservations())
                .registeredBy(attendance.getRegisteredBy().getUsername())
                .registeredAt(attendance.getRegisteredAt())
                .createdAt(attendance.getCreatedAt())
                .updatedAt(attendance.getUpdatedAt())
                .build();
    }
}
