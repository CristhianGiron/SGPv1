package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.enrollment.EnrollmentResponse;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.CourseGroup;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CourseGroupRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
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

    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;
    private final CourseRepository courseRepository;
    private final CourseGroupRepository courseGroupRepository;
    private final NotificationService notificationService;

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
    public EnrollmentResponse approve(Long id) {

        Enrollment enrollment = getEnrollment(id);

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
    public EnrollmentResponse reject(Long id) {

        Enrollment enrollment = getEnrollment(id);

        requirePending(enrollment);

        enrollment.setStatus(EnrollmentStatus.REJECTED);
        enrollmentRepository.save(enrollment);
        notificationService.notifyEnrollmentRejected(enrollment);

        return mapToResponse(enrollment);
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
            enrollments.addAll(enrollmentRepository.findByStatus(EnrollmentStatus.APPROVED));
        } else {
            if (hasRole(account, RoleName.ROLE_TUTOR_PRACTICAS)) {
                enrollments.addAll(enrollmentRepository.findByCourse_PracticeTutor_UsernameAndStatus(
                        username,
                        EnrollmentStatus.APPROVED));
            }

            if (hasRole(account, RoleName.ROLE_TUTOR_INSTITUCIONAL)) {
                enrollments.addAll(enrollmentRepository.findByGroup_InstitutionalTutor_UsernameAndStatus(
                        username,
                        EnrollmentStatus.APPROVED));
                enrollments.addAll(enrollmentRepository.findByCourse_InstitutionalTutor_UsernameAndStatus(
                        username,
                        EnrollmentStatus.APPROVED));
            }
        }

        Map<Long, Enrollment> uniqueEnrollments = new LinkedHashMap<>();
        enrollments.forEach(enrollment -> uniqueEnrollments.putIfAbsent(
                enrollment.getId(),
                enrollment));

        return uniqueEnrollments
                .values()
                .stream()
                .filter(this::isActiveCourseEnrollment)
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

        if (course.getSubject() == null
                || course.getSubject().getAcademicCycle() == null) {
            return null;
        }

        return course.getSubject().getAcademicCycle();
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
        Person person = student.getPerson();
        Institution educationalInstitution = getEnrollmentEducationalInstitution(enrollment);

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
                        enrollment.getGroup() != null
                                ? enrollment.getGroup().getId()
                                : null)
                .groupName(
                        enrollment.getGroup() != null
                                ? enrollment.getGroup().getName()
                                : null)
                .subjectId(
                        course.getSubject() != null
                                ? course.getSubject().getId()
                                : null)
                .subjectName(
                        course.getSubject() != null
                                ? course.getSubject().getName()
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
                .practiceTutor(fullNameOrUsername(course.getPracticeTutor()))
                .studentAcademicCycle(
                        student.getAcademicCycle() != null
                                ? student.getAcademicCycle().getName()
                                : null)
                .courseAcademicCycle(
                        getCourseAcademicCycleName(course))
                .status(enrollment.getStatus().name())
                .enrolledAt(enrollment.getEnrolledAt())
                .build();
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

        if (enrollment.getGroup() != null
                && enrollment.getGroup().getInstitutionalTutor() != null) {
            return enrollment.getGroup().getInstitutionalTutor();
        }

        return enrollment.getCourse() != null
                ? enrollment.getCourse().getInstitutionalTutor()
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
