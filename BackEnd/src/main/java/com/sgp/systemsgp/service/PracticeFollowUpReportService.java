package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.practicefollowup.CreatePracticeFollowUpReportRequest;
import com.sgp.systemsgp.dto.practicefollowup.PracticeFollowUpReportResponse;
import com.sgp.systemsgp.dto.practicefollowup.PracticeFollowUpSessionRequest;
import com.sgp.systemsgp.dto.practicefollowup.PracticeFollowUpSessionResponse;
import com.sgp.systemsgp.dto.practicefollowup.UpdatePracticeFollowUpReportRequest;
import com.sgp.systemsgp.enums.ActivityEvaluationPracticeType;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.PracticeFollowUpReport;
import com.sgp.systemsgp.model.PracticeFollowUpSession;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import com.sgp.systemsgp.repository.PracticeFollowUpReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PracticeFollowUpReportService {

    private final PracticeFollowUpReportRepository practiceFollowUpReportRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;
    private final InstitutionRepository institutionRepository;
    private final PdfExportService pdfExportService;

    @Transactional
    public PracticeFollowUpReportResponse create(
            String username,
            CreatePracticeFollowUpReportRequest request) {

        Account tutor = getAccount(username);
        Enrollment enrollment = getEnrollment(request.getEnrollmentId());

        validateEnrollmentApproved(enrollment);
        validatePracticeTutorCanManage(enrollment.getCourse(), tutor);

        if (practiceFollowUpReportRepository.existsByEnrollment_IdAndDeletedFalse(
                enrollment.getId())) {
            throw new BadRequestException(
                    "Ya existe un reporte de seguimiento para esta inscripcion");
        }

        Institution institution = resolveEducationalInstitution(
                enrollment,
                request.getEducationalInstitutionId());

        PracticeFollowUpReport report = PracticeFollowUpReport.builder()
                .enrollment(enrollment)
                .student(enrollment.getAccount())
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .reportedBy(tutor)
                .build();

        applyCreateData(report, request, institution);
        validateComplete(report);

        practiceFollowUpReportRepository.save(report);

        return mapToResponse(report);
    }

    public List<PracticeFollowUpReportResponse> myReports(String username) {

        return practiceFollowUpReportRepository
                .findByStudent_UsernameAndDeletedFalse(username)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<PracticeFollowUpReportResponse> managedReports(String username) {

        return practiceFollowUpReportRepository
                .findByCourse_PracticeTutor_UsernameAndDeletedFalse(username)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public PracticeFollowUpReportResponse getDefaults(
            String username,
            Long enrollmentId) {

        if (enrollmentId == null) {
            throw new BadRequestException(
                    "Debe seleccionar la inscripcion para crear el seguimiento");
        }

        Account tutor = getAccount(username);
        Enrollment enrollment = getEnrollment(enrollmentId);

        validateEnrollmentApproved(enrollment);
        validatePracticeTutorCanManage(enrollment.getCourse(), tutor);

        Institution institution = resolveEducationalInstitution(
                enrollment,
                null);

        PracticeFollowUpReport report = PracticeFollowUpReport.builder()
                .enrollment(enrollment)
                .student(enrollment.getAccount())
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .reportedBy(tutor)
                .build();

        copyInstitutionSnapshot(report, institution);
        copyStudentSnapshot(report, report.getStudent());
        copyCoursePracticeType(report);

        return mapToResponse(report);
    }

    public PracticeFollowUpReportResponse getById(
            Long id,
            String username) {

        PracticeFollowUpReport report = getReport(id);
        Account account = getAccount(username);

        validateCanView(report, account);

        return mapToResponse(report);
    }

    public byte[] exportPdf(
            Long id,
            String username) {

        PracticeFollowUpReport report = getReport(id);
        Account account = getAccount(username);

        validateCanView(report, account);

        PracticeFollowUpReportResponse response = mapToResponse(report);

        return pdfExportService.createPracticeFollowUpReportPdf(
                new PdfExportService.PdfPracticeFollowUpReport(
                        response.getEducationalInstitutionName(),
                        response.getPracticeType(),
                        response.getStudentFullName(),
                        response.getStudentIdentification(),
                        response.getCourseName(),
                        response.getAcademicPeriod(),
                        response.getDevelopmentMode(),
                        response.getTotalMinutes(),
                        response.getDeliveryDate(),
                        accountFullName(report.getReportedBy()),
                        "DOCENTE TUTOR DE PRACTICAS",
                        followUpSessions(response.getSessions())));
    }

    @Transactional
    public PracticeFollowUpReportResponse update(
            Long id,
            String username,
            UpdatePracticeFollowUpReportRequest request) {

        PracticeFollowUpReport report = getReport(id);
        Account tutor = getAccount(username);

        validatePracticeTutorCanManage(report.getCourse(), tutor);

        if (request.getEducationalInstitutionId() != null) {
            Institution institution = resolveEducationalInstitution(
                    report.getEnrollment(),
                    request.getEducationalInstitutionId());

            report.setEducationalInstitution(institution);
        }

        copyInstitutionSnapshot(report, report.getEducationalInstitution());
        copyStudentSnapshot(report, report.getStudent());
        copyCoursePracticeType(report);
        applyUpdateData(report, request);
        report.setReportedBy(tutor);
        validateComplete(report);

        practiceFollowUpReportRepository.save(report);

        return mapToResponse(report);
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

    private PracticeFollowUpReport getReport(Long id) {

        return practiceFollowUpReportRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Reporte de seguimiento de practica no encontrado"));
    }

    private Institution getInstitution(Long id) {

        return institutionRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Institucion educativa receptora no encontrada"));
    }

    private void validateEnrollmentApproved(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException(
                    "Solo se puede crear seguimiento de una inscripcion aprobada");
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

    private void validatePracticeTutorCanManage(
            Course course,
            Account tutor) {

        if (!hasRole(tutor, RoleName.ROLE_TUTOR_PRACTICAS)
                || course.getPracticeTutor() == null
                || !course.getPracticeTutor().getId().equals(tutor.getId())) {
            throw new AccessDeniedException(
                    "Solo el tutor de practicas asignado puede llenar este seguimiento");
        }
    }

    private void validateCanView(
            PracticeFollowUpReport report,
            Account account) {

        if (report.getStudent().getId().equals(account.getId())
                || isAssignedPracticeTutor(report, account)
                || hasRole(account, RoleName.ROLE_ADMIN)
                || hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            return;
        }

        throw new AccessDeniedException(
                "No puedes ver este reporte de seguimiento");
    }

    private boolean isAssignedPracticeTutor(
            PracticeFollowUpReport report,
            Account account) {

        Course course = report.getCourse();

        return course.getPracticeTutor() != null
                && course.getPracticeTutor().getId().equals(account.getId());
    }

    private boolean hasRole(
            Account account,
            RoleName roleName) {

        return account.getRoles()
                .stream()
                .anyMatch(role -> roleName.name().equals(role.getName()));
    }

    private Institution resolveEducationalInstitution(
            Enrollment enrollment,
            Long educationalInstitutionId) {

        Institution institution = educationalInstitutionId != null
                ? getInstitution(educationalInstitutionId)
                : getEnrollmentEducationalInstitution(enrollment);

        validateEducationalInstitution(institution);
        validateMatchesCourseInstitution(enrollment, institution);

        return institution;
    }

    private Institution getEnrollmentEducationalInstitution(Enrollment enrollment) {

        Institution institution = InstitutionalAssignmentResolver.educationalInstitution(enrollment);

        if (institution != null) {
            return institution;
        }

        Course course = enrollment.getCourse();

        if (course.getInstitutionalTutor() != null) {
            Institution legacyInstitution = getTutorInstitution(course.getInstitutionalTutor());
            if (legacyInstitution != null) {
                return legacyInstitution;
            }
        }

        throw new BadRequestException(
                "La inscripcion debe estar asignada a un grupo con tutor institucional e institucion");
    }

    private Institution getTutorInstitution(Account tutor) {
        if (tutor == null) {
            return null;
        }

        Institution institution = tutor.getInstitution();
        if (institution != null) {
            return institution;
        }

        return accountRepository.findByIdAndDeletedFalse(tutor.getId())
                .map(Account::getInstitution)
                .orElse(null);
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

    private void validateMatchesCourseInstitution(
            Enrollment enrollment,
            Institution institution) {

        Account institutionalTutor = InstitutionalAssignmentResolver.institutionalTutor(enrollment);

        if (institutionalTutor == null
                || institutionalTutor.getInstitution() == null) {
            return;
        }

        Long courseInstitutionId = institutionalTutor
                .getInstitution()
                .getId();

        if (!courseInstitutionId.equals(institution.getId())) {
            throw new BadRequestException(
                    "La institucion educativa receptora debe coincidir con el tutor institucional del curso");
        }
    }

    private void applyCreateData(
            PracticeFollowUpReport report,
            CreatePracticeFollowUpReportRequest request,
            Institution institution) {

        copyInstitutionSnapshot(report, institution);
        copyStudentSnapshot(report, report.getStudent());
        copyCoursePracticeType(report);

        report.setDevelopmentMode(request.getDevelopmentMode());
        report.setDeliveryDate(request.getDeliveryDate());

        replaceSessions(report, request.getSessions());
        report.setTotalMinutes(resolveReportTotalMinutes(
                request.getTotalMinutes(),
                report));
    }

    private void applyUpdateData(
            PracticeFollowUpReport report,
            UpdatePracticeFollowUpReportRequest request) {

        setIfNotNull(request.getDevelopmentMode(), report::setDevelopmentMode);
        setIfNotNull(request.getDeliveryDate(), report::setDeliveryDate);

        if (request.getSessions() != null) {
            replaceSessions(report, request.getSessions());
        }

        report.setTotalMinutes(resolveReportTotalMinutes(
                request.getTotalMinutes(),
                report));
    }

    private void copyInstitutionSnapshot(
            PracticeFollowUpReport report,
            Institution institution) {

        report.setEducationalInstitutionName(institution.getName());
        report.setEducationalInstitutionCode(institution.getCode());
        report.setEducationalInstitutionAddress(institution.getAddress());
        report.setEducationalInstitutionPhone(institution.getPhone());
        report.setEducationalInstitutionEmail(institution.getEmail());
    }

    private void copyStudentSnapshot(
            PracticeFollowUpReport report,
            Account student) {

        Person person = student.getPerson();

        if (person != null) {
            report.setStudentFullName(joinNames(
                    person.getNames(),
                    person.getLastNames()));
            report.setStudentIdentification(person.getCedula());
            report.setStudentEmail(person.getInstitutionalEmail());
            report.setStudentPhone(person.getPhone());
        }

        if (student.getAcademicCycle() != null) {
            report.setAcademicPeriod(student.getAcademicCycle().getName());
        }
    }

    private void replaceSessions(
            PracticeFollowUpReport report,
            List<PracticeFollowUpSessionRequest> sessions) {

        report.getSessions().clear();

        if (sessions == null) {
            return;
        }

        for (PracticeFollowUpSessionRequest sessionRequest : sessions) {
            Integer totalMinutes = resolveSessionTotalMinutes(
                    sessionRequest.getStartTime(),
                    sessionRequest.getEndTime(),
                    sessionRequest.getTotalMinutes());

            PracticeFollowUpSession session = PracticeFollowUpSession.builder()
                    .report(report)
                    .supervisionDate(sessionRequest.getSupervisionDate())
                    .startTime(sessionRequest.getStartTime())
                    .endTime(sessionRequest.getEndTime())
                    .totalMinutes(totalMinutes)
                    .supervisedActivities(sessionRequest.getSupervisedActivities())
                    .build();

            report.getSessions().add(session);
        }
    }

    private Integer resolveSessionTotalMinutes(
            LocalTime startTime,
            LocalTime endTime,
            Integer requestedTotalMinutes) {

        if (requestedTotalMinutes != null) {
            return requestedTotalMinutes;
        }

        if (startTime == null || endTime == null) {
            return null;
        }

        return Math.toIntExact(Duration.between(
                startTime,
                endTime).toMinutes());
    }

    private Integer resolveReportTotalMinutes(
            Integer requestedTotalMinutes,
            PracticeFollowUpReport report) {

        if (requestedTotalMinutes != null) {
            return requestedTotalMinutes;
        }

        return report.getSessions()
                .stream()
                .filter(session -> session.getTotalMinutes() != null)
                .mapToInt(PracticeFollowUpSession::getTotalMinutes)
                .sum();
    }

    private void copyCoursePracticeType(PracticeFollowUpReport report) {

        report.setPracticeType(resolveCoursePracticeType(report.getCourse()));
    }

    private ActivityEvaluationPracticeType resolveCoursePracticeType(Course course) {

        String practiceType = course.getPracticeType();

        if (practiceType == null || practiceType.isBlank()) {
            return null;
        }

        try {
            return ActivityEvaluationPracticeType.valueOf(practiceType.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                    "El tipo de practica del curso debe ser OBSERVACION, ELABORACION o DOCENTE");
        }
    }

    private void validateComplete(PracticeFollowUpReport report) {

        requireText(report.getEducationalInstitutionName(),
                "La institucion educativa receptora es obligatoria");
        requireText(report.getStudentFullName(),
                "El nombre del estudiante es obligatorio");
        requireText(report.getStudentIdentification(),
                "La cedula del estudiante es obligatoria");
        requireText(report.getAcademicPeriod(),
                "El periodo academico es obligatorio");

        if (report.getPracticeType() == null) {
            throw new BadRequestException(
                    "El tipo de practicas es obligatorio");
        }

        if (report.getDevelopmentMode() == null) {
            throw new BadRequestException(
                    "El desarrollo de actividades es obligatorio");
        }

        validateSessions(report);

        if (report.getTotalMinutes() == null || report.getTotalMinutes() < 0) {
            throw new BadRequestException(
                    "El total de horas y minutos debe ser mayor o igual a cero");
        }

        if (report.getDeliveryDate() == null) {
            throw new BadRequestException(
                    "La fecha de entrega es obligatoria");
        }
    }

    private void validateSessions(PracticeFollowUpReport report) {

        if (report.getSessions().isEmpty()) {
            throw new BadRequestException(
                    "Debe registrar al menos una visita o supervision");
        }

        for (PracticeFollowUpSession session : report.getSessions()) {
            if (session.getSupervisionDate() == null
                    || session.getStartTime() == null
                    || session.getEndTime() == null
                    || !hasText(session.getSupervisedActivities())) {
                throw new BadRequestException(
                        "Cada visita debe tener fecha, hora de inicio, hora de fin y actividades supervisadas");
            }

            if (!session.getEndTime().isAfter(session.getStartTime())) {
                throw new BadRequestException(
                        "La hora de fin debe ser posterior a la hora de inicio");
            }

            if (session.getTotalMinutes() == null || session.getTotalMinutes() <= 0) {
                throw new BadRequestException(
                        "El total de minutos de cada visita debe ser mayor a cero");
            }
        }
    }

    private void requireText(
            String value,
            String message) {

        if (!hasText(value)) {
            throw new BadRequestException(message);
        }
    }

    private boolean hasText(String value) {

        return value != null && !value.isBlank();
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

    private String accountFullName(Account account) {

        if (account == null || account.getPerson() == null) {
            return account != null ? account.getUsername() : null;
        }

        String fullName = joinNames(
                account.getPerson().getNames(),
                account.getPerson().getLastNames());

        return fullName != null ? fullName : account.getUsername();
    }

    private List<PdfExportService.PdfPracticeFollowUpSession> followUpSessions(
            List<PracticeFollowUpSessionResponse> sessions) {

        if (sessions == null) {
            return List.of();
        }

        return sessions.stream()
                .map(session -> new PdfExportService.PdfPracticeFollowUpSession(
                        session.getSupervisionDate(),
                        session.getStartTime(),
                        session.getEndTime(),
                        session.getTotalMinutes(),
                        session.getSupervisedActivities(),
                        null))
                .toList();
    }

    private PracticeFollowUpReportResponse mapToResponse(
            PracticeFollowUpReport report) {

        return PracticeFollowUpReportResponse.builder()
                .id(report.getId())
                .enrollmentId(report.getEnrollment().getId())
                .courseId(report.getCourse().getId())
                .courseName(report.getCourse().getName())
                .studentId(report.getStudent().getId())
                .studentUsername(report.getStudent().getUsername())
                .educationalInstitutionId(report.getEducationalInstitution().getId())
                .educationalInstitutionName(report.getEducationalInstitutionName())
                .educationalInstitutionCode(report.getEducationalInstitutionCode())
                .educationalInstitutionAddress(report.getEducationalInstitutionAddress())
                .educationalInstitutionPhone(report.getEducationalInstitutionPhone())
                .educationalInstitutionEmail(report.getEducationalInstitutionEmail())
                .practiceType(
                        report.getPracticeType() != null
                                ? report.getPracticeType().name()
                                : null)
                .studentFullName(report.getStudentFullName())
                .studentIdentification(report.getStudentIdentification())
                .studentEmail(report.getStudentEmail())
                .studentPhone(report.getStudentPhone())
                .academicPeriod(report.getAcademicPeriod())
                .developmentMode(
                        report.getDevelopmentMode() != null
                                ? report.getDevelopmentMode().name()
                                : null)
                .sessions(mapSessions(report))
                .totalMinutes(report.getTotalMinutes())
                .totalTime(formatMinutes(report.getTotalMinutes()))
                .deliveryDate(report.getDeliveryDate())
                .reportedBy(report.getReportedBy().getUsername())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    private List<PracticeFollowUpSessionResponse> mapSessions(
            PracticeFollowUpReport report) {

        return report.getSessions()
                .stream()
                .sorted(Comparator
                        .comparing(
                                PracticeFollowUpSession::getSupervisionDate,
                                Comparator.nullsLast(java.time.LocalDate::compareTo))
                        .thenComparing(
                                PracticeFollowUpSession::getStartTime,
                                Comparator.nullsLast(LocalTime::compareTo)))
                .map(session -> PracticeFollowUpSessionResponse.builder()
                        .id(session.getId())
                        .supervisionDate(session.getSupervisionDate())
                        .startTime(session.getStartTime())
                        .endTime(session.getEndTime())
                        .totalMinutes(session.getTotalMinutes())
                        .totalTime(formatMinutes(session.getTotalMinutes()))
                        .supervisedActivities(session.getSupervisedActivities())
                        .build())
                .toList();
    }

    private String formatMinutes(Integer totalMinutes) {

        if (totalMinutes == null) {
            return null;
        }

        int hours = totalMinutes / 60;
        int minutes = totalMinutes % 60;

        return hours + "h " + minutes + "min";
    }
}
