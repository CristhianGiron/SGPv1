package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.enrollment.EnrollmentResponse;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.CourseGroup;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.Subject;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CourseGroupRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentService {

    private static final List<EnrollmentStatus> VISIBLE_PRACTICE_STATUSES = List.of(
            EnrollmentStatus.APPROVED,
            EnrollmentStatus.COMPLETED);

    private static final List<EnrollmentStatus> PRACTICE_LIST_STATUSES = List.of(
            EnrollmentStatus.PENDING,
            EnrollmentStatus.APPROVED,
            EnrollmentStatus.COMPLETED);

    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;
    private final CourseRepository courseRepository;
    private final CourseGroupRepository courseGroupRepository;
    private final SubjectRepository subjectRepository;
    private final NotificationService notificationService;
    private final PracticeAuditService practiceAuditService;
    private final PracticeAccessService practiceAccessService;

    @Transactional
    public EnrollmentResponse enroll(
            String username,
            Long courseId) {

        Account account = getAccount(username);
        Course course = getCourse(courseId);

        validateAccountCanEnroll(account);
        validateCourseAvailable(course);
        validateStudentAcademicCycle(account, course);
        validateNotAlreadyEnrolled(account, course);
        validateSingleActiveEnrollment(account, null);
        validateAvailableCapacity(course);

        Enrollment enrollment = Enrollment.builder()
                .account(account)
                .course(course)
                .enrolledAt(LocalDateTime.now())
                .status(EnrollmentStatus.PENDING)
                .build();

        enrollmentRepository.save(enrollment);
        notificationService.notifyEnrollmentPending(enrollment);

        return mapToResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse approve(String username, Long id) {

        Account account = getAccount(username);
        Enrollment enrollment = getEnrollment(id);
        validateEnrollmentManagerCanManage(enrollment, account);

        validateCourseAvailable(enrollment.getCourse());
        requirePending(enrollment);
        validateSingleActiveEnrollment(enrollment.getAccount(), enrollment.getId());
        validateAvailableCapacity(enrollment.getCourse());

        enrollment.setStatus(EnrollmentStatus.APPROVED);
        enrollmentRepository.save(enrollment);
        notificationService.notifyEnrollmentApproved(enrollment);

        return mapToResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse reject(String username, Long id) {

        Account account = getAccount(username);
        Enrollment enrollment = getEnrollment(id);
        validateEnrollmentManagerCanManage(enrollment, account);

        requirePending(enrollment);

        enrollment.setStatus(EnrollmentStatus.REJECTED);
        enrollmentRepository.save(enrollment);
        notificationService.notifyEnrollmentRejected(enrollment);

        return mapToResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse complete(String username, Long id) {

        Account account = getAccount(username);
        Enrollment enrollment = getEnrollment(id);
        validatePracticeLifecycleManagerCanManage(enrollment, account);

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException(
                    "Solo se pueden concluir practicas aprobadas");
        }

        EnrollmentStatus previousStatus = enrollment.getStatus();
        boolean previousArchived = enrollment.isArchived();
        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        enrollment.setArchived(false);
        enrollment.setArchivedAt(null);
        enrollmentRepository.save(enrollment);
        practiceAuditService.logEnrollmentAction(
                enrollment,
                account,
                "COMPLETE_PRACTICE",
                previousStatus.name(),
                enrollment.getStatus().name(),
                previousArchived,
                enrollment.isArchived(),
                null);

        return mapToResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse reopen(String username, Long id) {

        Account account = getAccount(username);
        Enrollment enrollment = getEnrollment(id);
        validatePracticeLifecycleManagerCanManage(enrollment, account);

        if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new BadRequestException(
                    "Solo se pueden reabrir practicas concluidas");
        }

        EnrollmentStatus previousStatus = enrollment.getStatus();
        boolean previousArchived = enrollment.isArchived();
        validateSingleActiveEnrollment(enrollment.getAccount(), enrollment.getId());
        enrollment.setStatus(EnrollmentStatus.APPROVED);
        enrollment.setArchived(false);
        enrollment.setArchivedAt(null);
        enrollmentRepository.save(enrollment);
        practiceAuditService.logEnrollmentAction(
                enrollment,
                account,
                "REOPEN_PRACTICE",
                previousStatus.name(),
                enrollment.getStatus().name(),
                previousArchived,
                enrollment.isArchived(),
                null);

        return mapToResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse archive(String username, Long id) {

        Account account = getAccount(username);
        Enrollment enrollment = getEnrollment(id);
        validatePracticeLifecycleManagerCanManage(enrollment, account);
        requireCompletedForArchive(enrollment);

        boolean previousArchived = enrollment.isArchived();
        enrollment.setArchived(true);
        enrollment.setArchivedAt(LocalDateTime.now());
        enrollmentRepository.save(enrollment);
        practiceAuditService.logEnrollmentAction(
                enrollment,
                account,
                "ARCHIVE_PRACTICE",
                enrollment.getStatus().name(),
                enrollment.getStatus().name(),
                previousArchived,
                enrollment.isArchived(),
                null);

        return mapToResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse unarchive(String username, Long id) {

        Account account = getAccount(username);
        Enrollment enrollment = getEnrollment(id);
        validatePracticeLifecycleManagerCanManage(enrollment, account);
        requireCompletedForArchive(enrollment);

        boolean previousArchived = enrollment.isArchived();
        enrollment.setArchived(false);
        enrollment.setArchivedAt(null);
        enrollmentRepository.save(enrollment);
        practiceAuditService.logEnrollmentAction(
                enrollment,
                account,
                "UNARCHIVE_PRACTICE",
                enrollment.getStatus().name(),
                enrollment.getStatus().name(),
                previousArchived,
                enrollment.isArchived(),
                null);

        return mapToResponse(enrollment);
    }

    @Transactional
    public List<EnrollmentResponse> archiveAllCompleted(String username) {

        Account account = getAccount(username);
        if (!canArchivePractices(account)) {
            throw new BadRequestException(
                    "No tienes permisos para archivar practicas");
        }

        List<Enrollment> visiblePractices = visiblePracticeEnrollments(account)
                .stream()
                .filter(enrollment -> canViewEnrollment(enrollment, account))
                .filter(enrollment -> !enrollment.isArchived())
                .toList();

        boolean hasUncompletedPractices = visiblePractices
                .stream()
                .anyMatch(enrollment -> enrollment.getStatus() != EnrollmentStatus.COMPLETED);

        if (hasUncompletedPractices) {
            throw new BadRequestException(
                    "Solo se puede archivar todo cuando todas las practicas visibles estan concluidas");
        }

        LocalDateTime archivedAt = LocalDateTime.now();
        visiblePractices
                .forEach(enrollment -> {
                    boolean previousArchived = enrollment.isArchived();
                    enrollment.setArchived(true);
                    enrollment.setArchivedAt(archivedAt);
                    practiceAuditService.logEnrollmentAction(
                            enrollment,
                            account,
                            "ARCHIVE_ALL_COMPLETED",
                            enrollment.getStatus().name(),
                            enrollment.getStatus().name(),
                            previousArchived,
                            enrollment.isArchived(),
                            "Archivo masivo de prácticas concluidas");
                });

        enrollmentRepository.saveAll(visiblePractices);

        return visiblePractices
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public EnrollmentResponse assignGroup(
            String username,
            Long enrollmentId,
            Long groupId) {

        Account account = getAccount(username);
        Enrollment enrollment = getEnrollment(enrollmentId);
        CourseGroup group = getGroup(groupId);

        if (!enrollment.getCourse().getId().equals(group.getCourse().getId())) {
            throw new BadRequestException(
                    "El grupo debe pertenecer al curso de la inscripción");
        }

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException(
                    "Solo se puede asignar grupo a inscripciones aprobadas");
        }

        validateCourseAvailable(group.getCourse());
        validateGroupManagerCanManage(group.getCourse(), account);
        validateGroupAvailable(group);
        validateGroupCapacity(enrollment, group);

        enrollment.setGroup(group);
        enrollmentRepository.save(enrollment);

        return mapToResponse(enrollment);
    }

    @Transactional
    public void cancel(
            Long id,
            String username) {

        Enrollment enrollment = getEnrollment(id);

        if (!enrollment.getAccount().getUsername().equals(username)) {
            throw new BadRequestException(
                    "No puedes cancelar esta inscripción");
        }

        requirePendingForCancellation(enrollment);

        try {
            enrollmentRepository.delete(enrollment);
            enrollmentRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new BadRequestException(
                    "No se puede cancelar esta inscripción porque ya tiene registros de práctica asociados");
        }
    }

    public List<EnrollmentResponse> getCourseEnrollments(
            String username,
            Long courseId) {

        Account account = getAccount(username);
        Course course = getCourse(courseId);

        if (!hasRole(account, RoleName.ROLE_ADMIN)
                && !hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            validatePracticeTutorCanManage(course, account);
        } else if (hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            validateDirectorCanManageCourse(course, account);
        }

        return enrollmentRepository
                .findByCourse_Id(courseId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<EnrollmentResponse> myEnrollments(String username) {

        Account account = getAccount(username);

        return enrollmentRepository
                .findByAccount_Id(account.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<EnrollmentResponse> managedEnrollments(String username) {

        Account account = getAccount(username);
        List<Enrollment> enrollments = new ArrayList<>();

        if (hasRole(account, RoleName.ROLE_ADMIN)
                || hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            enrollments.addAll(enrollmentRepository.findByStatusIn(VISIBLE_PRACTICE_STATUSES));
        } else {
            if (hasRole(account, RoleName.ROLE_TUTOR_PRACTICAS)) {
                enrollments.addAll(enrollmentRepository.findByCourse_PracticeTutor_UsernameAndStatusIn(
                        username,
                        VISIBLE_PRACTICE_STATUSES));
            }

            if (hasRole(account, RoleName.ROLE_TUTOR_INSTITUCIONAL)) {
                enrollments.addAll(enrollmentRepository.findByGroup_InstitutionalTutor_UsernameAndStatusIn(
                        username,
                        VISIBLE_PRACTICE_STATUSES));
                enrollments.addAll(enrollmentRepository.findByCourse_InstitutionalTutor_UsernameAndStatusIn(
                        username,
                        VISIBLE_PRACTICE_STATUSES));
            }
        }

        Map<Long, Enrollment> uniqueEnrollments = new LinkedHashMap<>();
        enrollments.forEach(enrollment -> uniqueEnrollments.putIfAbsent(
                enrollment.getId(),
                enrollment));

        return uniqueEnrollments
                .values()
                .stream()
                .filter(enrollment -> enrollment.getStatus() == EnrollmentStatus.COMPLETED
                        || isActiveCourseEnrollment(enrollment))
                .filter(enrollment -> canViewEnrollment(enrollment, account))
                .map(this::mapToResponse)
                .toList();
    }

    public List<EnrollmentResponse> practiceEnrollments(String username) {

        Account account = getAccount(username);

        return visiblePracticeEnrollments(account)
                .stream()
                .filter(enrollment -> enrollment.getStatus() == EnrollmentStatus.COMPLETED
                        || isActiveCourseEnrollment(enrollment))
                .filter(enrollment -> PRACTICE_LIST_STATUSES.contains(enrollment.getStatus()))
                .filter(enrollment -> canViewEnrollment(enrollment, account))
                .map(this::mapToResponse)
                .toList();
    }

    private Account getAccount(String username) {

        return accountRepository
                .findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new NotFoundException(
                        "Cuenta no encontrada"));
    }

    private Course getCourse(Long id) {

        return courseRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Curso no encontrado"));
    }

    private Enrollment getEnrollment(Long id) {

        return enrollmentRepository
                .findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Inscripción no encontrada"));
    }

    private CourseGroup getGroup(Long id) {

        return courseGroupRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Grupo no encontrado"));
    }

    private void validateAccountCanEnroll(Account account) {

        if (account.isDeleted()) {
            throw new BadRequestException(
                    "La cuenta fue eliminada");
        }

        if (!account.isEnabled()) {
            throw new BadRequestException(
                    "La cuenta está desactivada");
        }

        if (account.isLocked()) {
            throw new BadRequestException(
                    "La cuenta está bloqueada");
        }
    }

    private void validateCourseAvailable(Course course) {

        if (course.isDeleted()) {
            throw new BadRequestException(
                    "El curso fue eliminado");
        }

        if (!course.isActive()) {
            throw new BadRequestException(
                    "El curso no está disponible");
        }

        if (course.isLocked()) {
            throw new BadRequestException(
                    "El curso está bloqueado");
        }
    }

    private void validateStudentAcademicCycle(
            Account account,
            Course course) {

        if (!hasRole(account, RoleName.ROLE_ESTUDIANTE)) {
            throw new BadRequestException(
                    "Solo los estudiantes pueden matricularse en cursos");
        }

        AcademicCycle studentCycle = account.getAcademicCycle();

        if (studentCycle == null) {
            throw new BadRequestException(
                    "El estudiante no tiene ciclo académico asignado");
        }

        AcademicCycle courseCycle = getCourseAcademicCycle(course);

        if (courseCycle == null) {
            throw new BadRequestException(
                    "El curso no tiene ciclo académico asignado");
        }

        if (!studentCycle.getId().equals(courseCycle.getId())) {
            throw new BadRequestException(
                    "Solo puedes matricularte en cursos de tu ciclo académico");
        }
    }

    private void validateNotAlreadyEnrolled(
            Account account,
            Course course) {

        boolean alreadyExists = enrollmentRepository
                .existsByAccount_IdAndCourse_Id(
                        account.getId(),
                        course.getId());

        if (alreadyExists) {
            throw new BadRequestException(
                    "Ya estás inscrito en este curso");
        }
    }

    private void validateAvailableCapacity(Course course) {

        long approvedCount = enrollmentRepository
                .countByCourse_IdAndStatus(
                        course.getId(),
                        EnrollmentStatus.APPROVED);

        if (approvedCount >= course.getCapacity()) {
            throw new BadRequestException(
                    "El curso alcanzó el límite de cupos");
        }
    }

    private void validateGroupAvailable(CourseGroup group) {

        if (!group.isActive() || group.isDeleted()) {
            throw new BadRequestException(
                    "El grupo no está disponible");
        }

        if (group.getInstitutionalTutor() == null) {
            throw new BadRequestException(
                    "El grupo debe tener tutor institucional asignado");
        }
    }

    private void validateGroupCapacity(
            Enrollment enrollment,
            CourseGroup group) {

        if (group.getCapacity() == null) {
            return;
        }

        boolean sameGroup = enrollment.getGroup() != null
                && enrollment.getGroup().getId().equals(group.getId());

        if (sameGroup) {
            return;
        }

        long approvedCount = enrollmentRepository
                .countByGroup_IdAndStatus(
                        group.getId(),
                        EnrollmentStatus.APPROVED);

        if (approvedCount >= group.getCapacity()) {
            throw new BadRequestException(
                    "El grupo alcanzó el límite de cupos");
        }
    }

    private void validatePracticeTutorCanManage(
            Course course,
            Account tutor) {

        if (!hasRole(tutor, RoleName.ROLE_TUTOR_PRACTICAS)
                || course.getPracticeTutor() == null
                || !course.getPracticeTutor().getId().equals(tutor.getId())) {
            throw new BadRequestException(
                    "Solo el tutor de practicas asignado puede gestionar grupos de este curso");
        }
    }

    private void validateGroupManagerCanManage(
            Course course,
            Account account) {

        if (hasRole(account, RoleName.ROLE_ADMIN)) {
            return;
        }

        validatePracticeTutorCanManage(course, account);
    }

    private void validateEnrollmentManagerCanManage(
            Enrollment enrollment,
            Account account) {

        if (hasRole(account, RoleName.ROLE_ADMIN)) {
            return;
        }

        validateDirectorCanManageCourse(enrollment.getCourse(), account);
    }

    private void validatePracticeLifecycleManagerCanManage(
            Enrollment enrollment,
            Account account) {

        practiceAccessService.requirePracticeLifecycleAccess(enrollment, account);
    }

    private void validateDirectorCanManageCourse(
            Course course,
            Account account) {

        if (!hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            throw new BadRequestException(
                    "No tienes permisos para gestionar esta inscripción");
        }

        Career directorCareer = account.getCareer();
        Career courseCareer = getCourseCareer(course);

        if (directorCareer == null
                || courseCareer == null
                || !directorCareer.getId().equals(courseCareer.getId())) {
            throw new BadRequestException(
                    "El director de practicas solo puede gestionar inscripciones de su carrera");
        }
    }

    private boolean canViewEnrollment(
            Enrollment enrollment,
            Account account) {

        return practiceAccessService.canViewEnrollment(enrollment, account);
    }

    private void validateSingleActiveEnrollment(
            Account account,
            Long currentEnrollmentId) {

        List<Enrollment> activeEnrollments = enrollmentRepository
                .findByAccount_IdAndStatusInAndCourse_ActiveTrueAndCourse_DeletedFalse(
                        account.getId(),
                        List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));

        boolean hasAnotherActiveEnrollment = activeEnrollments != null
                && activeEnrollments.stream()
                .anyMatch(enrollment -> currentEnrollmentId == null
                        || !enrollment.getId().equals(currentEnrollmentId));

        if (hasAnotherActiveEnrollment) {
            throw new BadRequestException(
                    "Solo puedes tener una inscripcion en un curso activo");
        }
    }

    private void requirePending(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new BadRequestException(
                    "Solo se pueden gestionar inscripciones pendientes");
        }
    }

    private void requirePendingForCancellation(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new BadRequestException(
                    "Solo puedes cancelar inscripciones pendientes");
        }
    }

    private void requireCompletedForArchive(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new BadRequestException(
                    "Solo se pueden archivar practicas concluidas");
        }
    }

    private boolean canArchivePractices(Account account) {

        return hasRole(account, RoleName.ROLE_ADMIN)
                || hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)
                || hasRole(account, RoleName.ROLE_TUTOR_PRACTICAS);
    }

    private List<Enrollment> visiblePracticeEnrollments(Account account) {

        List<Enrollment> enrollments = new ArrayList<>();

        if (hasRole(account, RoleName.ROLE_ESTUDIANTE)) {
            enrollments.addAll(enrollmentRepository.findByAccount_Id(account.getId()));
        }

        if (hasRole(account, RoleName.ROLE_ADMIN)
                || hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            enrollments.addAll(enrollmentRepository.findByStatusIn(PRACTICE_LIST_STATUSES));
        } else {
            if (hasRole(account, RoleName.ROLE_TUTOR_PRACTICAS)) {
                enrollments.addAll(enrollmentRepository.findByCourse_PracticeTutor_UsernameAndStatusIn(
                        account.getUsername(),
                        PRACTICE_LIST_STATUSES));
            }

            if (hasRole(account, RoleName.ROLE_TUTOR_INSTITUCIONAL)) {
                enrollments.addAll(enrollmentRepository.findByGroup_InstitutionalTutor_UsernameAndStatusIn(
                        account.getUsername(),
                        PRACTICE_LIST_STATUSES));
                enrollments.addAll(enrollmentRepository.findByCourse_InstitutionalTutor_UsernameAndStatusIn(
                        account.getUsername(),
                        PRACTICE_LIST_STATUSES));
            }
        }

        Map<Long, Enrollment> uniqueEnrollments = new LinkedHashMap<>();
        enrollments.forEach(enrollment -> uniqueEnrollments.putIfAbsent(
                enrollment.getId(),
                enrollment));

        return new ArrayList<>(uniqueEnrollments.values());
    }

    private boolean hasRole(
            Account account,
            RoleName roleName) {

        return account.getRoles()
                .stream()
                .anyMatch(role -> roleName.name().equals(role.getName()));
    }

    private boolean isActiveCourseEnrollment(Enrollment enrollment) {

        Course course = enrollment.getCourse();

        return course != null
                && course.isActive()
                && !course.isDeleted();
    }

    private AcademicCycle getCourseAcademicCycle(Course course) {

        if (course.getAcademicCycle() != null) {
            return course.getAcademicCycle();
        }

        if (course.getSubject() == null
                || course.getSubject().getAcademicCycle() == null) {
            return null;
        }

        return course.getSubject().getAcademicCycle();
    }

    private Career getCourseCareer(Course course) {

        AcademicCycle academicCycle = getCourseAcademicCycle(course);

        return academicCycle != null
                ? academicCycle.getCareer()
                : null;
    }

    private String getCourseAcademicCycleName(Course course) {

        AcademicCycle academicCycle = getCourseAcademicCycle(course);

        return academicCycle != null
                ? academicCycle.getName()
                : null;
    }

    private EnrollmentResponse mapToResponse(Enrollment enrollment) {
        Account student = enrollment.getAccount();
        Course course = enrollment.getCourse();
        CourseGroup group = resolveEnrollmentGroup(enrollment);
        Subject subject = resolveCourseSubject(course);
        AcademicCycle academicCycle = getCourseAcademicCycle(course);
        Career career = academicCycle != null
                ? academicCycle.getCareer()
                : null;
        Person person = student.getPerson();
        Institution educationalInstitution = getEnrollmentEducationalInstitution(enrollment);
        Account institutionDirector = getInstitutionDirector(educationalInstitution);

        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .student(student.getUsername())
                .studentFullName(
                        person != null
                                ? joinNames(person.getNames(), person.getLastNames())
                                : null)
                .studentIdentification(
                        person != null
                                ? person.getCedula()
                                : null)
                .studentEmail(
                        person != null
                                ? person.getInstitutionalEmail()
                                : null)
                .studentPhone(
                        person != null
                                ? person.getPhone()
                                : null)
                .courseId(course.getId())
                .courseName(course.getName())
                .courseActive(course.isActive())
                .groupId(
                        group != null
                                ? group.getId()
                                : null)
                .groupName(
                        group != null
                                ? group.getName()
                                : null)
                .subjectId(
                        subject != null
                                ? subject.getId()
                                : null)
                .subjectName(
                        subject != null
                                ? subject.getName()
                                : null)
                .facultyId(
                        career != null && career.getFaculty() != null
                                ? career.getFaculty().getId()
                                : null)
                .facultyName(
                        career != null && career.getFaculty() != null
                                ? career.getFaculty().getName()
                                : null)
                .careerId(
                        career != null
                                ? career.getId()
                                : null)
                .careerName(
                        career != null
                                ? career.getName()
                                : null)
                .academicCycleId(
                        academicCycle != null
                                ? academicCycle.getId()
                                : null)
                .academicCycleName(
                        academicCycle != null
                                ? academicCycle.getName()
                                : null)
                .educationalInstitutionId(
                        educationalInstitution != null
                                ? educationalInstitution.getId()
                                : null)
                .educationalInstitutionName(
                        educationalInstitution != null
                                ? educationalInstitution.getName()
                                : null)
                .educationalInstitutionCode(
                        educationalInstitution != null
                                ? educationalInstitution.getCode()
                                : null)
                .educationalInstitutionAddress(
                        educationalInstitution != null
                                ? educationalInstitution.getAddress()
                                : null)
                .educationalInstitutionPhone(
                        educationalInstitution != null
                                ? educationalInstitution.getPhone()
                                : null)
                .educationalInstitutionEmail(
                        educationalInstitution != null
                                ? educationalInstitution.getEmail()
                                : null)
                .institutionalTutor(fullNameOrUsername(getEnrollmentInstitutionalTutor(enrollment)))
                .institutionDirector(fullNameOrUsername(institutionDirector))
                .practiceTutor(fullNameOrUsername(course.getPracticeTutor()))
                .studentAcademicCycle(
                        student.getAcademicCycle() != null
                                ? student.getAcademicCycle().getName()
                                : null)
                .courseAcademicCycle(
                        getCourseAcademicCycleName(course))
                .status(enrollment.getStatus().name())
                .enrolledAt(enrollment.getEnrolledAt())
                .archived(enrollment.isArchived())
                .archivedAt(enrollment.getArchivedAt())
                .build();
    }

    private Subject resolveCourseSubject(Course course) {

        if (course == null) {
            return null;
        }

        if (course.getSubject() != null) {
            return course.getSubject();
        }

        return subjectRepository.findByCourse_IdAndDeletedFalse(course.getId())
                .stream()
                .findFirst()
                .orElse(null);
    }

    private Institution getCourseEducationalInstitution(Course course) {

        if (course.getInstitutionalTutor() != null) {
            Institution institution = getTutorInstitution(course.getInstitutionalTutor());
            if (institution != null) {
                return institution;
            }
        }

        return null;
    }

    private Institution getEnrollmentEducationalInstitution(Enrollment enrollment) {

        Institution institution = getTutorInstitution(getEnrollmentInstitutionalTutor(enrollment));

        if (institution != null) {
            return institution;
        }

        return getCourseEducationalInstitution(enrollment.getCourse());
    }

    private Account getEnrollmentInstitutionalTutor(Enrollment enrollment) {

        CourseGroup group = resolveEnrollmentGroup(enrollment);

        if (group != null
                && group.getInstitutionalTutor() != null) {
            return group.getInstitutionalTutor();
        }

        return enrollment.getCourse() != null
                ? enrollment.getCourse().getInstitutionalTutor()
                : null;
    }

    private Account getInstitutionDirector(Institution institution) {

        if (institution == null || institution.getId() == null) {
            return null;
        }

        return accountRepository
                .findByInstitution_IdAndRoles_NameAndDeletedFalseAndEnabledTrueAndLockedFalse(
                        institution.getId(),
                        RoleName.ROLE_DIRECTORA_INSTITUCION.name())
                .stream()
                .min((left, right) -> left.getId().compareTo(right.getId()))
                .orElse(null);
    }

    private CourseGroup resolveEnrollmentGroup(Enrollment enrollment) {

        if (enrollment.getGroup() != null) {
            return enrollment.getGroup();
        }

        if (enrollment.getCourse() == null
                || enrollment.getCourse().getId() == null) {
            return null;
        }

        List<CourseGroup> activeGroups = courseGroupRepository
                .findByCourse_IdAndDeletedFalse(enrollment.getCourse().getId())
                .stream()
                .filter(CourseGroup::isActive)
                .toList();

        return activeGroups.size() == 1
                ? activeGroups.get(0)
                : null;
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

    private String fullNameOrUsername(Account account) {

        if (account == null) {
            return null;
        }

        Person person = account.getPerson();
        String fullName = person != null
                ? joinNames(person.getNames(), person.getLastNames())
                : null;

        return fullName != null
                ? fullName
                : account.getUsername();
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
}
