/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EnrollmentService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona la asignación administrativa de estudiantes y el ciclo de vida de sus prácticas.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.enrollment.ArchivePracticeBatchRequest;
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
import org.springframework.security.access.AccessDeniedException;
import com.sgp.systemsgp.repository.PracticeOfferingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EnrollmentService {

    private static final List<EnrollmentStatus> VISIBLE_PRACTICE_STATUSES = List.of(
            EnrollmentStatus.APPROVED,
            EnrollmentStatus.COMPLETED, EnrollmentStatus.SUSPENDED, EnrollmentStatus.WITHDRAWN);

    private static final List<EnrollmentStatus> PRACTICE_LIST_STATUSES = List.of(
            EnrollmentStatus.PENDING,
            EnrollmentStatus.APPROVED,
            EnrollmentStatus.COMPLETED, EnrollmentStatus.SUSPENDED, EnrollmentStatus.WITHDRAWN);

    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;
    private final CourseRepository courseRepository;
    private final CourseGroupRepository courseGroupRepository;
    private final SubjectRepository subjectRepository;
    private final NotificationService notificationService;
    private final PracticeAuditService practiceAuditService;
    private final PracticeAccessService practiceAccessService;
    private final PracticeCompletionService practiceCompletionService;
    private final CourseMembershipService courseMembershipService;
    private final PracticeOfferingRepository practiceOfferingRepository;

    /** Compatibility guard for callers of the removed student workflow. */
    public EnrollmentResponse enroll(String username, Long courseId) {
        throw new AccessDeniedException("La inscripción corresponde al personal académico autorizado");
    }

    @Transactional
    public EnrollmentResponse assignStudent(String username, Long practiceId, Long studentId, Long groupId) {
        var actor=getAccount(username);
        var practice=practiceOfferingRepository.findForUpdate(practiceId).orElseThrow(() -> new NotFoundException("Práctica no encontrada"));
        var course=courseRepository.findForUpdate(practice.getCourse().getId()).orElseThrow(() -> new NotFoundException("Paralelo no encontrado"));
        if (!practiceAccessService.isAdmin(actor) && !practiceAccessService.isDirectorForCourse(course,actor)
                && !practiceAccessService.isPracticeTutorForCourse(course,actor))
            throw new AccessDeniedException("No puedes inscribir estudiantes en esta práctica");
        if (actor.getId().equals(studentId)) throw new AccessDeniedException("No se permite la autoinscripción");
        var student=accountRepository.findForMembershipUpdate(studentId).orElseThrow(() -> new NotFoundException("Estudiante no encontrado"));
        validateAccountCanEnroll(student);
        validateCourseAvailable(course);
        if (course.isLocked() || !practice.isEnrollmentOpen()) throw new BadRequestException("El período de inscripciones está cerrado");
        courseMembershipService.requireMembership(student,course);
        if (enrollmentRepository.existsByAccount_IdAndPractice_Id(studentId,practiceId)) throw new BadRequestException("El estudiante ya está inscrito en esta práctica");
        if (enrollmentRepository.countByPractice_IdAndStatus(practiceId,EnrollmentStatus.APPROVED)>=practice.getCapacity())
            throw new BadRequestException("La práctica alcanzó el límite de cupos");
        if (course.getPracticeTutor()==null) throw new BadRequestException("Asigna el tutor de prácticas antes de inscribir estudiantes");
        var enrollment=Enrollment.builder().account(student).course(course).practice(practice).status(EnrollmentStatus.APPROVED).enrolledAt(LocalDateTime.now()).build();
        if (groupId!=null) {
            var group=courseGroupRepository.findById(groupId).orElseThrow(() -> new NotFoundException("Grupo no encontrado"));
            if (!group.getCourse().getId().equals(course.getId())) throw new BadRequestException("El grupo debe pertenecer al paralelo de la práctica");
            validateGroupAvailable(group);validateGroupCapacity(enrollment,group);enrollment.setGroup(group);
        } else if (course.getInstitutionalTutor()==null) throw new BadRequestException("Selecciona un grupo con tutor institucional o asigna el tutor al paralelo");
        validateAssignedTutor(course.getPracticeTutor(),RoleName.ROLE_TUTOR_PRACTICAS);
        validateAssignedTutor(InstitutionalAssignmentResolver.institutionalTutor(enrollment),RoleName.ROLE_TUTOR_INSTITUCIONAL);
        enrollmentRepository.saveAndFlush(enrollment);
        practiceAuditService.logEnrollmentAction(enrollment,actor,"ASSIGN_STUDENT",null,EnrollmentStatus.APPROVED.name(),false,false,"Inscripción directa por personal autorizado");
        notificationService.notifyEnrollmentApproved(enrollment);
        return mapToResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse approve(String username, Long id) {

        Account account = getAccount(username);
        Enrollment enrollment = getEnrollment(id);
        validateEnrollmentManagerCanManage(enrollment, account);

        validateCourseAvailable(enrollment.getCourse());
        requirePending(enrollment);
        courseMembershipService.requireMembership(enrollment.getAccount(), enrollment.getCourse());
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
        validatePracticeCompletionManagerCanManage(enrollment, account);

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException(
                    "Solo se pueden concluir practicas aprobadas");
        }

        var completionSummary = practiceCompletionService.summarize(enrollment);
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
                "Cierre manual. " + (completionSummary.warnings().isEmpty()
                        ? "Sin advertencias documentales ni de horas."
                        : String.join(" ", completionSummary.warnings())));

        return mapToResponse(enrollment);
    }

    @Transactional
    public EnrollmentResponse reopen(String username, Long id) {

        Account account = getAccount(username);
        Enrollment enrollment = getEnrollment(id);
        validatePracticeCompletionManagerCanManage(enrollment, account);

        if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new BadRequestException(
                    "Solo se pueden reabrir practicas concluidas");
        }

        if (enrollment.isArchived()) {
            throw new BadRequestException(
                    "Administración debe desarchivar la práctica antes de reabrirla");
        }

        validateAccountCanEnroll(enrollment.getAccount());
        validateCourseAvailable(enrollment.getCourse());
        courseRepository.findForUpdate(enrollment.getCourse().getId()).orElseThrow(() -> new NotFoundException("Paralelo no encontrado"));
        if (enrollment.getPractice()==null) validateAvailableCapacity(enrollment.getCourse());
        else if (enrollmentRepository.countByPractice_IdAndStatus(enrollment.getPractice().getId(), EnrollmentStatus.APPROVED)>=enrollment.getPractice().getCapacity())
            throw new BadRequestException("La práctica alcanzó el límite de cupos");
        CourseGroup group = enrollment.getGroup();
        if (group != null) {
            validateGroupAvailable(group);
            validateGroupCapacity(enrollment,group);
        }

        EnrollmentStatus previousStatus = enrollment.getStatus();
        boolean previousArchived = enrollment.isArchived();
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
        validatePracticeArchiveManagerCanManage(enrollment, account);
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
        validatePracticeArchiveManagerCanManage(enrollment, account);
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
    public List<EnrollmentResponse> archiveBatch(
            String username,
            ArchivePracticeBatchRequest request) {

        Account account = getAccount(username);
        if (!canArchivePractices(account)) {
            throw new BadRequestException(
                    "No tienes permisos para archivar practicas");
        }

        Set<Long> enrollmentIds = request != null && request.getEnrollmentIds() != null
                ? new LinkedHashSet<>(request.getEnrollmentIds())
                : Set.of();

        if (enrollmentIds.isEmpty()) {
            throw new BadRequestException(
                    "Selecciona al menos una práctica para gestionar");
        }

        List<Enrollment> enrollments = enrollmentRepository.findAllById(enrollmentIds);

        if (enrollments.size() != enrollmentIds.size()) {
            throw new NotFoundException(
                    "Una o más prácticas seleccionadas no existen");
        }

        LocalDateTime changedAt = LocalDateTime.now();
        boolean archive = request.isArchived();

        enrollments.forEach(enrollment -> {
            validatePracticeArchiveManagerCanManage(enrollment, account);
            requireCompletedForArchive(enrollment);

            boolean previousArchived = enrollment.isArchived();
            enrollment.setArchived(archive);
            enrollment.setArchivedAt(archive ? changedAt : null);
            practiceAuditService.logEnrollmentAction(
                    enrollment,
                    account,
                    archive ? "ARCHIVE_BATCH" : "UNARCHIVE_BATCH",
                    enrollment.getStatus().name(),
                    enrollment.getStatus().name(),
                    previousArchived,
                    enrollment.isArchived(),
                    archive
                            ? "Archivo masivo por grupo de prácticas"
                            : "Desarchivo masivo por grupo de prácticas");
        });

        enrollmentRepository.saveAll(enrollments);

        return enrollments
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
        courseRepository.findForUpdate(enrollment.getCourse().getId()).orElseThrow(() -> new NotFoundException("Paralelo no encontrado"));
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
    public String applyIncidentDecision(String username,Long enrollmentId,com.sgp.systemsgp.enums.practiceincident.PracticeIncidentType type,Long targetGroupId) {
        var actor=getAccount(username);
        var enrollment=enrollmentRepository.findForUpdate(enrollmentId).orElseThrow(()->new NotFoundException("Práctica no encontrada"));
        if(practiceAccessService.isStudentForEnrollment(enrollment,actor)||!practiceAccessService.isDirectorForCourse(enrollment.getCourse(),actor))throw new AccessDeniedException("Solo dirección de la carrera puede aplicar cambios académicos ajenos a su propia práctica");
        if(enrollment.isArchived())throw new BadRequestException("La práctica está archivada");
        var before=enrollment.getStatus();
        if(type==com.sgp.systemsgp.enums.practiceincident.PracticeIncidentType.OTHER)return "Sin cambio de estado académico";
        if(type==com.sgp.systemsgp.enums.practiceincident.PracticeIncidentType.RESUMPTION) {
            if(before!=EnrollmentStatus.SUSPENDED)throw new BadRequestException("Solo se puede reanudar una práctica suspendida");
            validateAccountCanEnroll(enrollment.getAccount());validateCourseAvailable(enrollment.getCourse());
            courseRepository.findForUpdate(enrollment.getCourse().getId()).orElseThrow(()->new NotFoundException("Paralelo no encontrado"));
            courseMembershipService.requireMembership(enrollment.getAccount(),enrollment.getCourse());
            if(enrollment.getPractice()==null)validateAvailableCapacity(enrollment.getCourse());
            else if(enrollmentRepository.countByPractice_IdAndStatus(enrollment.getPractice().getId(),EnrollmentStatus.APPROVED)>=enrollment.getPractice().getCapacity())
                throw new BadRequestException("La práctica alcanzó el límite de cupos");
            if(enrollment.getGroup()!=null){validateGroupAvailable(enrollment.getGroup());validateGroupCapacity(enrollment,enrollment.getGroup());}
            validateAssignedTutor(enrollment.getCourse().getPracticeTutor(),RoleName.ROLE_TUTOR_PRACTICAS);
            validateAssignedTutor(InstitutionalAssignmentResolver.institutionalTutor(enrollment),RoleName.ROLE_TUTOR_INSTITUCIONAL);
            enrollment.setStatus(EnrollmentStatus.APPROVED);
        }else{
            if(before!=EnrollmentStatus.APPROVED&&before!=EnrollmentStatus.SUSPENDED)throw new BadRequestException("La incidencia requiere una práctica activa o suspendida");
            if(type==com.sgp.systemsgp.enums.practiceincident.PracticeIncidentType.SUSPENSION){
                if(before!=EnrollmentStatus.APPROVED)throw new BadRequestException("La práctica ya está suspendida");enrollment.setStatus(EnrollmentStatus.SUSPENDED);
            }else if(type==com.sgp.systemsgp.enums.practiceincident.PracticeIncidentType.WITHDRAWAL)enrollment.setStatus(EnrollmentStatus.WITHDRAWN);
            else{
                if(targetGroupId==null)throw new BadRequestException("Selecciona el nuevo grupo receptor");
                courseRepository.findForUpdate(enrollment.getCourse().getId()).orElseThrow(()->new NotFoundException("Paralelo no encontrado"));
                var group=getGroup(targetGroupId);
                if(!group.getCourse().getId().equals(enrollment.getCourse().getId()))throw new BadRequestException("El grupo debe pertenecer al paralelo de la práctica");
                validateGroupAvailable(group);validateGroupCapacity(enrollment,group);
                var oldTutor=InstitutionalAssignmentResolver.institutionalTutor(enrollment);
                var oldInstitution=InstitutionalAssignmentResolver.educationalInstitution(enrollment);
                var newTutor=group.getInstitutionalTutor();validateAssignedTutor(newTutor,RoleName.ROLE_TUTOR_INSTITUCIONAL);
                if(newTutor.getInstitution()==null)throw new BadRequestException("El tutor del grupo debe tener institución");
                boolean sameInstitution=oldInstitution!=null&&oldInstitution.getId().equals(newTutor.getInstitution().getId());
                if(type==com.sgp.systemsgp.enums.practiceincident.PracticeIncidentType.CHANGE_INSTITUTION&&sameInstitution)throw new BadRequestException("Selecciona un grupo de otra institución");
                if(type==com.sgp.systemsgp.enums.practiceincident.PracticeIncidentType.CHANGE_INSTITUTIONAL_TUTOR&&(!sameInstitution||oldTutor!=null&&oldTutor.getId().equals(newTutor.getId())))
                    throw new BadRequestException("Elige otro tutor institucional dentro de la misma institución");
                var oldGroup=enrollment.getGroup();enrollment.setGroup(group);enrollmentRepository.saveAndFlush(enrollment);
                return "Grupo "+(oldGroup==null?"sin grupo":oldGroup.getName())+" → "+group.getName()+"; tutor institucional "+(oldTutor==null?"sin tutor":oldTutor.getUsername())+" -> "+newTutor.getUsername();
            }
        }
        enrollmentRepository.saveAndFlush(enrollment);return before.name()+" -> "+enrollment.getStatus().name();
    }

    public void cancel(Long id, String username) {
        throw new AccessDeniedException("El estudiante no puede cancelar su asignación académica");
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

    private void validateAssignedTutor(Account tutor, RoleName role) {
        if (tutor==null || !practiceAccessService.hasRole(tutor,role) || tutor.isDeleted() || !tutor.isEnabled() || tutor.isLocked())
            throw new BadRequestException("Los tutores asignados deben tener su rol y su cuenta habilitados antes de inscribir estudiantes");
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

        if ((sameGroup && enrollment.getStatus()==EnrollmentStatus.APPROVED)
                || enrollmentRepository.existsByGroup_IdAndAccount_IdAndStatus(group.getId(), enrollment.getAccount().getId(), EnrollmentStatus.APPROVED)) {
            return;
        }

        long approvedCount = enrollmentRepository
                .countStudentsInGroup(
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

    private void validatePracticeCompletionManagerCanManage(
            Enrollment enrollment,
            Account account) {

        if (!practiceAccessService.canConcludePractice(enrollment, account)) {
            throw new BadRequestException(
                    "Solo el director de prácticas puede concluir o reabrir prácticas de su carrera");
        }
    }

    private void validatePracticeArchiveManagerCanManage(
            Enrollment enrollment,
            Account account) {

        if (!practiceAccessService.canArchivePractice(account)) {
            throw new BadRequestException(
                    "Solo el admin puede archivar o desarchivar prácticas");
        }
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

    private void requirePending(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new BadRequestException(
                    "Solo se pueden gestionar inscripciones pendientes");
        }
    }

    private void requireCompletedForArchive(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new BadRequestException(
                    "Solo se pueden archivar practicas concluidas");
        }
    }

    private boolean canArchivePractices(Account account) {

        return practiceAccessService.canArchivePractice(account);
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
        CourseGroup group = enrollment.getGroup();
        Subject subject = resolveCourseSubject(course);
        AcademicCycle academicCycle = getCourseAcademicCycle(course);
        Career career = academicCycle != null
                ? academicCycle.getCareer()
                : null;
        Person person = student.getPerson();
        Institution educationalInstitution = getEnrollmentEducationalInstitution(enrollment);
        Account institutionDirector = getInstitutionDirector(educationalInstitution);

        return EnrollmentResponse.builder()
                .coverImageUrl(EntityImageService.coverUrl(course))
                .institutionLogoUrl(EntityImageService.logoUrl(educationalInstitution))
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
                .practiceId(enrollment.getPractice()==null?null:enrollment.getPractice().getId())
                .practiceName(enrollment.getPractice()==null?course.getName():enrollment.getPractice().getName())
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
                .institutionalTutor(fullNameOrUsername(InstitutionalAssignmentResolver.institutionalTutor(enrollment)))
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

    private Institution getEnrollmentEducationalInstitution(Enrollment enrollment) {
        return getTutorInstitution(InstitutionalAssignmentResolver.institutionalTutor(enrollment));
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
