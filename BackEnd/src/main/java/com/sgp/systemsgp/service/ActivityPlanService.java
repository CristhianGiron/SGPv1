package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.activityplan.ActivityPlanActivityWeekRequest;
import com.sgp.systemsgp.dto.activityplan.ActivityPlanActivityWeekResponse;
import com.sgp.systemsgp.dto.activityplan.ActivityPlanResponse;
import com.sgp.systemsgp.dto.activityplan.ActivityPlanScheduleWeekRequest;
import com.sgp.systemsgp.dto.activityplan.ActivityPlanScheduleWeekResponse;
import com.sgp.systemsgp.dto.activityplan.CreateActivityPlanRequest;
import com.sgp.systemsgp.dto.activityplan.ReviewActivityPlanRequest;
import com.sgp.systemsgp.dto.activityplan.UpdateActivityPlanRequest;
import com.sgp.systemsgp.dto.document.ReviewableDocumentSummaryResponse;
import com.sgp.systemsgp.dto.feedback.FeedbackCommentResponse;
import com.sgp.systemsgp.dto.feedback.FeedbackHistoryResponse;
import com.sgp.systemsgp.enums.ActivityPlanStatus;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.ActivityPlan;
import com.sgp.systemsgp.model.ActivityPlanActivityWeek;
import com.sgp.systemsgp.model.ActivityPlanScheduleWeek;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.ActivityPlanRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityPlanService {

    private static final List<ActivityPlanStatus> REVIEWER_VISIBLE_STATUSES =
            List.of(ActivityPlanStatus.SUBMITTED, ActivityPlanStatus.APPROVED);

    private final ActivityPlanRepository activityPlanRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;
    private final InstitutionRepository institutionRepository;
    private final NotificationService notificationService;
    private final FeedbackCommentService feedbackCommentService;
    private final PdfExportService pdfExportService;

    @Transactional
    public ActivityPlanResponse create(
            String username,
            CreateActivityPlanRequest request) {

        Account student = getAccount(username);
        Enrollment enrollment = request.getEnrollmentId() != null
                ? getEnrollment(request.getEnrollmentId())
                : getDefaultEnrollment(student);

        validateStudentOwnsEnrollment(student, enrollment);
        validateEnrollmentApproved(enrollment);

        if (activityPlanRepository.existsByEnrollment_IdAndDeletedFalse(
                enrollment.getId())) {
            throw new BadRequestException(
                    "Ya existe un plan de actividades para este curso");
        }

        Institution institution = resolveEducationalInstitution(
                enrollment,
                request.getEducationalInstitutionId());

        ActivityPlan plan = ActivityPlan.builder()
                .enrollment(enrollment)
                .student(student)
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .status(ActivityPlanStatus.DRAFT)
                .build();

        applyCreateData(plan, request, student, institution);

        activityPlanRepository.save(plan);

        return mapToResponse(plan);
    }

    public List<ActivityPlanResponse> myPlans(String username) {

        List<ActivityPlan> plans = activityPlanRepository
                .findByStudent_UsernameAndDeletedFalse(username);

        return mapPlansToResponses(plans);
    }

    public List<ReviewableDocumentSummaryResponse> myPlanSummaries(String username) {

        List<ActivityPlan> plans = activityPlanRepository
                .findByStudent_UsernameAndDeletedFalse(username);

        return mapPlansToSummaries(plans);
    }

    public List<ActivityPlanResponse> reviewQueue(String username) {

        List<ActivityPlan> plans = activityPlanRepository
                .findByCourse_PracticeTutor_UsernameAndDeletedFalse(username)
                .stream()
                .filter(plan -> plan.getStatus() == ActivityPlanStatus.SUBMITTED)
                .toList();

        return mapPlansToResponses(plans);
    }

    public List<ReviewableDocumentSummaryResponse> reviewQueueSummaries(String username) {

        List<ActivityPlan> plans = activityPlanRepository
                .findByCourse_PracticeTutor_UsernameAndDeletedFalse(username)
                .stream()
                .filter(plan -> plan.getStatus() == ActivityPlanStatus.SUBMITTED)
                .toList();

        return mapPlansToSummaries(plans);
    }

    public List<ActivityPlanResponse> submittedDocuments() {

        List<ActivityPlan> plans = activityPlanRepository
                .findByStatusInAndDeletedFalse(REVIEWER_VISIBLE_STATUSES);

        return mapPlansToResponses(plans);
    }

    public List<ReviewableDocumentSummaryResponse> submittedDocumentSummaries() {

        List<ActivityPlan> plans = activityPlanRepository
                .findByStatusInAndDeletedFalse(REVIEWER_VISIBLE_STATUSES);

        return mapPlansToSummaries(plans);
    }

    public ActivityPlanResponse getDefaults(
            String username,
            Long enrollmentId) {

        Account student = getAccount(username);
        Enrollment enrollment = enrollmentId != null
                ? getEnrollment(enrollmentId)
                : getDefaultEnrollment(student);

        validateStudentOwnsEnrollment(student, enrollment);
        validateEnrollmentApproved(enrollment);

        Institution institution = getEnrollmentEducationalInstitution(enrollment);

        ActivityPlan plan = ActivityPlan.builder()
                .enrollment(enrollment)
                .student(student)
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .status(ActivityPlanStatus.DRAFT)
                .build();

        copyStudentSnapshot(plan, student);
        copyInstitutionSnapshot(plan, institution);
        copySubjectSnapshot(plan);
        copyCoursePracticeSnapshot(plan);

        return mapToResponse(plan);
    }

    private Enrollment getDefaultEnrollment(Account student) {

        return enrollmentRepository
                .findByAccount_UsernameAndStatusAndCourse_ActiveTrueAndCourse_DeletedFalse(
                        student.getUsername(),
                        EnrollmentStatus.APPROVED)
                .stream()
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "No tienes ninguna inscripción aprobada para crear el plan de actividades"));
    }

    public ActivityPlanResponse getById(
            Long id,
            String username) {

        ActivityPlan plan = getPlan(id);
        Account account = getAccount(username);

        validateCanView(plan, account);

        return mapToResponse(plan);
    }

    public byte[] exportApprovedPdf(
            Long id,
            String username) {

        ActivityPlanResponse plan = getById(id, username);
        validateApprovedForExport(plan.getStatus());

        return pdfExportService.createPdf(
                "Plan de actividades #" + plan.getId(),
                List.of(
                        pdfExportService.section(
                                "Datos generales",
                                List.of(
                                        pdfExportService.field("Estudiante", plan.getStudentFullName()),
                                        pdfExportService.field("Cedula", plan.getStudentIdentification()),
                                        pdfExportService.field("Curso", plan.getCourseName()),
                                        pdfExportService.field("Institucion", plan.getEducationalInstitutionName()),
                                        pdfExportService.field("Tipo de practica", plan.getPracticeType()),
                                        pdfExportService.field("Unidad curricular", plan.getCurricularOrganizationUnit()),
                                        pdfExportService.field("Proyecto integrador", plan.getIntegrativeKnowledgeProject()),
                                        pdfExportService.field("Enviado", plan.getSubmittedAt()),
                                        pdfExportService.field("Aprobado", plan.getApprovedAt())
                                )),
                        pdfExportService.section(
                                "Institucion",
                                List.of(
                                        pdfExportService.field("Mision", plan.getMission()),
                                        pdfExportService.field("Vision", plan.getVision()),
                                        pdfExportService.field("Valores institucionales", plan.getInstitutionalValues())
                                )),
                        pdfExportService.section(
                                "Presentacion y objetivos",
                                List.of(
                                        pdfExportService.field("Presentacion", plan.getPresentation()),
                                        pdfExportService.field("Objetivo general", plan.getGeneralObjective()),
                                        pdfExportService.field("Objetivo especifico 1", plan.getSpecificObjective1()),
                                        pdfExportService.field("Objetivo especifico 2", plan.getSpecificObjective2()),
                                        pdfExportService.field("Objetivo especifico 3", plan.getSpecificObjective3())
                                )),
                        pdfExportService.sectionWithTables(
                                "Actividades por semana",
                                List.of(),
                                List.of(activityWeeksTable(plan.getActivityWeeks()))),
                        pdfExportService.sectionWithScheduleMatrices(
                                "Cronograma de actividades",
                                List.of(),
                                List.of(scheduleMatrix(plan.getScheduleWeeks()))),
                        pdfExportService.section(
                                "Recursos",
                                List.of(
                                        pdfExportService.field("Legales", plan.getLegalResources()),
                                        pdfExportService.field("Humanos", plan.getHumanResources()),
                                        pdfExportService.field("Tecnologicos", plan.getTechnologicalResources()),
                                        pdfExportService.field("Fisicos", plan.getPhysicalResources())
                                )),
                        pdfExportService.section(
                                "Aprobacion",
                                List.of(
                                        pdfExportService.field("Revisado por tutor", plan.getReviewedBy()),
                                        pdfExportService.field("Revisado por direccion", plan.getDirectorReviewedBy())
                                ))
                ));
    }

    @Transactional
    public ActivityPlanResponse update(
            Long id,
            String username,
            UpdateActivityPlanRequest request) {

        ActivityPlan plan = getPlan(id);
        Account student = getAccount(username);

        validateStudentOwnsPlan(student, plan);
        validateEditable(plan);

        if (request.getEducationalInstitutionId() != null) {
            Institution institution = resolveEducationalInstitution(
                    plan.getEnrollment(),
                    request.getEducationalInstitutionId());

            plan.setEducationalInstitution(institution);
        }

        copyStudentSnapshot(plan, student);
        copyInstitutionSnapshot(plan, plan.getEducationalInstitution());
        copySubjectSnapshot(plan);
        copyCoursePracticeSnapshot(plan);
        applyUpdateData(plan, request);
        moveToDraftAfterStudentUpdate(plan);

        activityPlanRepository.save(plan);

        return mapToResponse(plan);
    }

    @Transactional
    public ActivityPlanResponse submit(
            Long id,
            String username) {

        ActivityPlan plan = getPlan(id);
        Account student = getAccount(username);

        validateStudentOwnsPlan(student, plan);
        validateEditable(plan);

        if (plan.getStatus() != ActivityPlanStatus.SUBMITTED) {
            startNewReviewCycle(plan);
        }
        plan.setStatus(ReviewWorkflowStateMachine.transition(
                plan.getStatus(),
                ActivityPlanStatus.SUBMITTED,
                "plan de actividades"));
        plan.setSubmittedAt(LocalDateTime.now());

        activityPlanRepository.save(plan);
        notificationService.notifyActivityPlanSubmitted(plan);

        return mapToResponse(plan);
    }

    @Transactional
    public ActivityPlanResponse review(
            Long id,
            String username,
            ReviewActivityPlanRequest request) {

        ActivityPlan plan = getPlan(id);
        Account tutor = getAccount(username);

        validateCanReview(plan, tutor);

        ReviewWorkflowStateMachine.ensureReviewable(
                plan.getStatus(),
                "Solo se pueden revisar planes enviados");

        applyReviewFeedback(plan, request);
        saveReviewFeedbackComments(plan, request, tutor);

        if (request.getApproved() != null) {
            applyReviewDecision(plan, tutor, request.getApproved());
        } else if (hasReviewFeedback(request)) {
            touchReviewAuthor(plan, tutor);
        }

        activityPlanRepository.save(plan);

        if (request.getApproved() != null) {
            notificationService.notifyActivityPlanReviewed(plan);
        } else {
            notificationService.notifyActivityPlanFeedbackAdded(plan, tutor);
        }

        return mapToResponse(plan);
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
                        "Inscripción no encontrada"));
    }

    private ActivityPlan getPlan(Long id) {

        return activityPlanRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Plan de actividades no encontrado"));
    }

    private Institution getInstitution(Long id) {

        return institutionRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Institución educativa no encontrada"));
    }

    private void validateStudentOwnsEnrollment(
            Account student,
            Enrollment enrollment) {

        if (!enrollment.getAccount().getId().equals(student.getId())) {
            throw new AccessDeniedException(
                    "No puedes crear planes para otra inscripción");
        }
    }

    private void validateStudentOwnsPlan(
            Account student,
            ActivityPlan plan) {

        if (!plan.getStudent().getId().equals(student.getId())) {
            throw new AccessDeniedException(
                    "No puedes modificar este plan");
        }
    }

    private void validateEnrollmentApproved(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException(
                    "Solo se puede crear el plan de una inscripción aprobada");
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

    private void validateCanView(
            ActivityPlan plan,
            Account account) {

        if (plan.getStudent().getId().equals(account.getId())) {
            return;
        }

        if (isVisibleToReviewers(plan.getStatus())
                && (isAssignedPracticeTutor(plan, account)
                || hasRole(account, RoleName.ROLE_ADMIN)
                || hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS))) {
            return;
        }

        throw new AccessDeniedException(
                "No puedes ver este plan");
    }

    private boolean isVisibleToReviewers(ActivityPlanStatus status) {

        return REVIEWER_VISIBLE_STATUSES.contains(status);
    }

    private void validateCanReview(
            ActivityPlan plan,
            Account reviewer) {

        if (hasRole(reviewer, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            return;
        }

        if (hasRole(reviewer, RoleName.ROLE_TUTOR_PRACTICAS)
                && isAssignedPracticeTutor(plan, reviewer)) {
            return;
        }

        throw new AccessDeniedException(
                "Solo el tutor de prácticas asignado o el director de prácticas puede revisar este plan");
    }

    private void validatePracticeTutorCanReview(
            ActivityPlan plan,
            Account tutor) {

        if (!hasRole(tutor, RoleName.ROLE_TUTOR_PRACTICAS)
                || !isAssignedPracticeTutor(plan, tutor)) {
            throw new AccessDeniedException(
                    "Solo el tutor de prácticas asignado puede revisar este plan");
        }
    }

    private boolean isAssignedPracticeTutor(
            ActivityPlan plan,
            Account account) {

        Course course = plan.getCourse();

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

    private void validateEditable(ActivityPlan plan) {

        ReviewWorkflowStateMachine.ensureEditable(
                plan.getStatus(),
                "No se puede editar un plan aprobado");
    }

    private void moveToDraftAfterStudentUpdate(ActivityPlan plan) {

        if (plan.getStatus() == ActivityPlanStatus.SUBMITTED) {
            plan.setStatus(ReviewWorkflowStateMachine.transition(
                    plan.getStatus(),
                    ActivityPlanStatus.DRAFT,
                    "plan de actividades"));
            plan.setSubmittedAt(null);
            resetReviewDecision(plan);
        }
    }

    private void resetReviewDecision(ActivityPlan plan) {

        plan.setPracticeTutorApproved(false);
        plan.setDirectorApproved(false);
        plan.setReviewedBy(null);
        plan.setDirectorReviewedBy(null);
        plan.setReviewedAt(null);
        plan.setDirectorReviewedAt(null);
        plan.setApprovedAt(null);
        clearReviewFeedback(plan);
        feedbackCommentService.clearDocumentFeedback(
                FeedbackDocumentType.ACTIVITY_PLAN,
                plan.getId());
    }

    private void startNewReviewCycle(ActivityPlan plan) {

        resetReviewDecision(plan);
        plan.setReviewCycle(ReviewWorkflowStateMachine.nextCycle(plan.getReviewCycle()));
    }

    private void clearReviewFeedback(ActivityPlan plan) {

        plan.setGeneralInfoFeedback(null);
        plan.setPresentationFeedback(null);
        plan.setObjectivesFeedback(null);
        plan.setActivitiesFeedback(null);
        plan.setScheduleFeedback(null);
        plan.setResourcesFeedback(null);
        plan.setApprovalFeedback(null);
    }

    private void applyReviewFeedback(
            ActivityPlan plan,
            ReviewActivityPlanRequest request) {

        setIfNotNull(request.getGeneralInfoFeedback(), plan::setGeneralInfoFeedback);
        setIfNotNull(request.getPresentationFeedback(), plan::setPresentationFeedback);
        setIfNotNull(request.getObjectivesFeedback(), plan::setObjectivesFeedback);
        setIfNotNull(request.getActivitiesFeedback(), plan::setActivitiesFeedback);
        setIfNotNull(request.getScheduleFeedback(), plan::setScheduleFeedback);
        setIfNotNull(request.getResourcesFeedback(), plan::setResourcesFeedback);
        setIfNotNull(request.getApprovalFeedback(), plan::setApprovalFeedback);
    }

    private boolean hasReviewFeedback(ReviewActivityPlanRequest request) {
        return request.getGeneralInfoFeedback() != null
                || request.getPresentationFeedback() != null
                || request.getObjectivesFeedback() != null
                || request.getActivitiesFeedback() != null
                || request.getScheduleFeedback() != null
                || request.getResourcesFeedback() != null
                || request.getApprovalFeedback() != null;
    }

    private void saveReviewFeedbackComments(
            ActivityPlan plan,
            ReviewActivityPlanRequest request,
            Account reviewer) {

        saveDocumentFeedback(plan, "generalInfoFeedback", request.getGeneralInfoFeedback(), reviewer);
        saveDocumentFeedback(plan, "presentationFeedback", request.getPresentationFeedback(), reviewer);
        saveDocumentFeedback(plan, "objectivesFeedback", request.getObjectivesFeedback(), reviewer);
        saveDocumentFeedback(plan, "activitiesFeedback", request.getActivitiesFeedback(), reviewer);
        saveDocumentFeedback(plan, "scheduleFeedback", request.getScheduleFeedback(), reviewer);
        saveDocumentFeedback(plan, "resourcesFeedback", request.getResourcesFeedback(), reviewer);
        saveDocumentFeedback(plan, "approvalFeedback", request.getApprovalFeedback(), reviewer);
    }

    private void saveDocumentFeedback(
            ActivityPlan plan,
            String sectionKey,
            String message,
            Account reviewer) {

        feedbackCommentService.upsertDocumentFeedback(
                FeedbackDocumentType.ACTIVITY_PLAN,
                plan.getId(),
                sectionKey,
                message,
                reviewer,
                plan.getReviewCycle());
    }

    private void touchReviewAuthor(
            ActivityPlan plan,
            Account reviewer) {

        if (hasRole(reviewer, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            plan.setDirectorReviewedBy(reviewer);
            plan.setDirectorReviewedAt(LocalDateTime.now());
            return;
        }

        plan.setReviewedBy(reviewer);
        plan.setReviewedAt(LocalDateTime.now());
    }

    private void applyReviewDecision(
            ActivityPlan plan,
            Account reviewer,
            boolean approved) {

        if (hasRole(reviewer, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            plan.setDirectorApproved(approved);
            plan.setDirectorReviewedBy(reviewer);
            plan.setDirectorReviewedAt(LocalDateTime.now());
        } else {
            plan.setPracticeTutorApproved(approved);
            plan.setReviewedBy(reviewer);
            plan.setReviewedAt(LocalDateTime.now());
        }

        if (!approved) {
            plan.setStatus(ReviewWorkflowStateMachine.transition(
                    plan.getStatus(),
                    ActivityPlanStatus.NEEDS_CORRECTION,
                    "plan de actividades"));
            plan.setApprovedAt(null);
            return;
        }

        if (plan.isPracticeTutorApproved() && plan.isDirectorApproved()) {
            plan.setStatus(ReviewWorkflowStateMachine.transition(
                    plan.getStatus(),
                    ActivityPlanStatus.APPROVED,
                    "plan de actividades"));
            plan.setApprovedAt(LocalDateTime.now());
            return;
        }

        plan.setStatus(ReviewWorkflowStateMachine.transition(
                plan.getStatus(),
                ActivityPlanStatus.SUBMITTED,
                "plan de actividades"));
        plan.setApprovedAt(null);
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
                "La inscripción debe estar asignada a un grupo con tutor institucional e institución");
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
                    "La institución educativa no está activa");
        }

        if (institution.getType() != InstitutionType.ESCUELA
                && institution.getType() != InstitutionType.COLEGIO) {
            throw new BadRequestException(
                    "La institución educativa debe ser escuela o colegio");
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
                    "La institución educativa debe coincidir con el tutor institucional del curso");
        }
    }

    private void applyCreateData(
            ActivityPlan plan,
            CreateActivityPlanRequest request,
            Account student,
            Institution institution) {

        copyStudentSnapshot(plan, student);
        copyInstitutionSnapshot(plan, institution);
        copySubjectSnapshot(plan);
        copyCoursePracticeSnapshot(plan);

        plan.setPresentation(request.getPresentation());
        plan.setLegalResources(request.getLegalResources());
        plan.setHumanResources(request.getHumanResources());
        plan.setTechnologicalResources(request.getTechnologicalResources());
        plan.setPhysicalResources(request.getPhysicalResources());

        replaceActivityWeeks(plan, request.getActivityWeeks());
        replaceScheduleWeeks(plan, request.getScheduleWeeks());
    }

    private void applyUpdateData(
            ActivityPlan plan,
            UpdateActivityPlanRequest request) {

        setIfNotNull(request.getPresentation(), plan::setPresentation);
        setIfNotNull(request.getLegalResources(), plan::setLegalResources);
        setIfNotNull(request.getHumanResources(), plan::setHumanResources);
        setIfNotNull(request.getTechnologicalResources(), plan::setTechnologicalResources);
        setIfNotNull(request.getPhysicalResources(), plan::setPhysicalResources);

        if (request.getActivityWeeks() != null) {
            replaceActivityWeeks(plan, request.getActivityWeeks());
        }

        if (request.getScheduleWeeks() != null) {
            replaceScheduleWeeks(plan, request.getScheduleWeeks());
        }
    }

    private void copyStudentSnapshot(
            ActivityPlan plan,
            Account student) {

        Person person = student.getPerson();

        if (person == null) {
            return;
        }

        plan.setStudentFullName(joinNames(
                person.getNames(),
                person.getLastNames()));
        plan.setStudentIdentification(person.getCedula());
        plan.setStudentEmail(person.getInstitutionalEmail());
        plan.setStudentPhone(person.getPhone());
    }

    private void copyInstitutionSnapshot(
            ActivityPlan plan,
            Institution institution) {

        plan.setEducationalInstitutionName(institution.getName());
        plan.setEducationalInstitutionCode(institution.getCode());
        plan.setEducationalInstitutionAddress(institution.getAddress());
        plan.setEducationalInstitutionPhone(institution.getPhone());
        plan.setEducationalInstitutionEmail(institution.getEmail());
        plan.setTeacherCount(institution.getTeacherCount());
        plan.setStudentCount(institution.getStudentCount());
        plan.setMission(institution.getMission());
        plan.setVision(institution.getVision());
        plan.setInstitutionalValues(institution.getInstitutionalValues());
    }

    private void copySubjectSnapshot(ActivityPlan plan) {

        if (plan.getCourse().getSubject() != null) {
            plan.setSubjectDenomination(
                    plan.getCourse().getSubject().getName());
        }
    }

    private void copyCoursePracticeSnapshot(ActivityPlan plan) {

        Course course = plan.getCourse();

        plan.setCurricularOrganizationUnit(course.getCurricularOrganizationUnit());
        plan.setIntegrativeKnowledgeProject(course.getIntegrativeKnowledgeProject());
        plan.setPracticeType(course.getPracticeType());
        plan.setGeneralObjective(course.getGeneralObjective());
        plan.setSpecificObjective1(course.getSpecificObjective1());
        plan.setSpecificObjective2(course.getSpecificObjective2());
        plan.setSpecificObjective3(course.getSpecificObjective3());
    }

    private void replaceActivityWeeks(
            ActivityPlan plan,
            List<ActivityPlanActivityWeekRequest> weeks) {

        plan.getActivityWeeks().clear();

        if (weeks == null) {
            return;
        }

        for (ActivityPlanActivityWeekRequest weekRequest : weeks) {
            ActivityPlanActivityWeek week = ActivityPlanActivityWeek.builder()
                    .plan(plan)
                    .weekNumber(weekRequest.getWeekNumber())
                    .startDate(weekRequest.getStartDate())
                    .endDate(weekRequest.getEndDate())
                    .activities(weekRequest.getActivities())
                    .build();

            plan.getActivityWeeks().add(week);
        }
    }

    private void replaceScheduleWeeks(
            ActivityPlan plan,
            List<ActivityPlanScheduleWeekRequest> weeks) {

        plan.getScheduleWeeks().clear();

        if (weeks == null) {
            return;
        }

        for (ActivityPlanScheduleWeekRequest weekRequest : weeks) {
            ActivityPlanScheduleWeek week = ActivityPlanScheduleWeek.builder()
                    .plan(plan)
                    .weekNumber(weekRequest.getWeekNumber())
                    .startDate(weekRequest.getStartDate())
                    .endDate(weekRequest.getEndDate())
                    .scheduledActivities(weekRequest.getScheduledActivities())
                    .build();

            plan.getScheduleWeeks().add(week);
        }
    }

    private void validateComplete(ActivityPlan plan) {

        requireText(plan.getStudentFullName(), "Datos del estudiante incompletos");
        requireText(plan.getCurricularOrganizationUnit(), "La unidad de organización curricular es obligatoria");
        requireText(plan.getSubjectDenomination(), "La denominación de la asignatura es obligatoria");
        requireText(plan.getIntegrativeKnowledgeProject(), "El proyecto integrador de saberes es obligatorio");
        requireText(plan.getPracticeType(), "El tipo de práctica es obligatorio");
        requireText(plan.getEducationalInstitutionName(), "Datos de la institución educativa incompletos");
        requireNumber(plan.getTeacherCount(), "El número de docentes es obligatorio");
        requireNumber(plan.getStudentCount(), "El número de estudiantes es obligatorio");
        requireText(plan.getMission(), "La misión institucional es obligatoria");
        requireText(plan.getVision(), "La visión institucional es obligatoria");
        requireText(plan.getInstitutionalValues(), "Los valores institucionales son obligatorios");
        requireText(plan.getPresentation(), "La presentación es obligatoria");
        requireText(plan.getGeneralObjective(), "El objetivo general es obligatorio");
        requireText(plan.getSpecificObjective1(), "El objetivo específico 1 es obligatorio");
        requireText(plan.getSpecificObjective2(), "El objetivo específico 2 es obligatorio");
        requireText(plan.getSpecificObjective3(), "El objetivo específico 3 es obligatorio");
        requireText(plan.getLegalResources(), "Los recursos legales son obligatorios");
        requireText(plan.getHumanResources(), "Los recursos humanos son obligatorios");
        requireText(plan.getTechnologicalResources(), "Los recursos tecnológicos son obligatorios");
        requireText(plan.getPhysicalResources(), "Los recursos físicos son obligatorios");
        validateActivityWeeks(plan);
        validateScheduleWeeks(plan);
    }

    private void validateActivityWeeks(ActivityPlan plan) {

        if (plan.getActivityWeeks().isEmpty()) {
            throw new BadRequestException(
                    "Debe registrar al menos una semana de actividades a cumplir");
        }

        for (ActivityPlanActivityWeek week : plan.getActivityWeeks()) {
            if (week.getWeekNumber() == null
                    || week.getStartDate() == null
                    || week.getEndDate() == null
                    || !hasText(week.getActivities())) {
                throw new BadRequestException(
                        "Todas las actividades por semana deben tener número, fechas y actividades");
            }

            validateDateRange(week.getStartDate(), week.getEndDate());
        }
    }

    private void validateScheduleWeeks(ActivityPlan plan) {

        if (plan.getScheduleWeeks().isEmpty()) {
            throw new BadRequestException(
                    "Debe registrar al menos una semana en el cronograma");
        }

        for (ActivityPlanScheduleWeek week : plan.getScheduleWeeks()) {
            if (week.getWeekNumber() == null
                    || week.getStartDate() == null
                    || week.getEndDate() == null
                    || !hasText(week.getScheduledActivities())) {
                throw new BadRequestException(
                        "Todas las semanas del cronograma deben tener número, fechas y actividades");
            }

            validateDateRange(week.getStartDate(), week.getEndDate());
        }
    }

    private void validateDateRange(
            java.time.LocalDate startDate,
            java.time.LocalDate endDate) {

        if (endDate.isBefore(startDate)) {
            throw new BadRequestException(
                    "La fecha final de una semana no puede ser anterior a la fecha inicial");
        }
    }

    private void requireText(
            String value,
            String message) {

        if (!hasText(value)) {
            throw new BadRequestException(message);
        }
    }

    private void requireNumber(
            Integer value,
            String message) {

        if (value == null || value < 0) {
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

    private void validateApprovedForExport(String status) {

        if (!ActivityPlanStatus.APPROVED.name().equals(status)) {
            throw new BadRequestException(
                    "Solo se pueden exportar documentos aprobados");
        }
    }

    private PdfExportService.PdfWeekTable activityWeeksTable(List<ActivityPlanActivityWeekResponse> weeks) {

        if (weeks == null || weeks.isEmpty()) {
            return pdfExportService.weekTable(List.of());
        }

        return pdfExportService.weekTable(weeks.stream()
                .map(week -> pdfExportService.weekRow(
                        week.getWeekNumber(),
                        week.getStartDate(),
                        week.getEndDate(),
                        "Actividad",
                        week.getActivities()))
                .toList());
    }

    private PdfExportService.PdfScheduleMatrix scheduleMatrix(List<ActivityPlanScheduleWeekResponse> weeks) {

        if (weeks == null || weeks.isEmpty()) {
            return pdfExportService.scheduleMatrix(
                    "CRONOGRAMA DE ACTIVIDADES PRACTICAS PARA EL DESARROLLO DEL PIS",
                    List.of());
        }

        return pdfExportService.scheduleMatrix(
                "CRONOGRAMA DE ACTIVIDADES PRACTICAS PARA EL DESARROLLO DEL PIS",
                weeks.stream()
                .map(week -> pdfExportService.scheduleRow(
                        week.getWeekNumber(),
                        week.getStartDate(),
                        week.getEndDate(),
                        week.getScheduledActivities()))
                .toList());
    }

    private List<ReviewableDocumentSummaryResponse> mapPlansToSummaries(List<ActivityPlan> plans) {

        return plans.stream()
                .map(this::mapToSummary)
                .toList();
    }

    private ReviewableDocumentSummaryResponse mapToSummary(ActivityPlan plan) {

        Course course = plan.getCourse();
        Account institutionalTutor = institutionalTutorFor(
                plan.getEnrollment(),
                course);

        return ReviewableDocumentSummaryResponse.builder()
                .id(plan.getId())
                .documentType("ACTIVITY_PLAN")
                .status(plan.getStatus().name())
                .reviewCycle(plan.getReviewCycle())
                .enrollmentId(plan.getEnrollment().getId())
                .courseId(course.getId())
                .courseName(course.getName())
                .courseCode(course.getCode())
                .courseActive(course.isActive())
                .studentId(plan.getStudent().getId())
                .studentUsername(plan.getStudent().getUsername())
                .studentFullName(plan.getStudentFullName())
                .studentIdentification(plan.getStudentIdentification())
                .academicCycleName(academicCycleName(plan.getStudent()))
                .educationalInstitutionId(plan.getEducationalInstitution().getId())
                .educationalInstitutionName(plan.getEducationalInstitutionName())
                .practiceTutorUsername(accountUsername(course.getPracticeTutor()))
                .practiceTutorName(accountFullName(course.getPracticeTutor()))
                .institutionalTutorUsername(accountUsername(institutionalTutor))
                .institutionalTutorName(accountFullName(institutionalTutor))
                .practiceTutorApproved(plan.isPracticeTutorApproved())
                .directorApproved(plan.isDirectorApproved())
                .reviewedBy(accountUsername(plan.getReviewedBy()))
                .reviewedByName(accountFullName(plan.getReviewedBy()))
                .directorReviewedBy(accountUsername(plan.getDirectorReviewedBy()))
                .directorReviewedByName(accountFullName(plan.getDirectorReviewedBy()))
                .submittedAt(plan.getSubmittedAt())
                .reviewedAt(plan.getReviewedAt())
                .directorReviewedAt(plan.getDirectorReviewedAt())
                .approvedAt(plan.getApprovedAt())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .build();
    }

    private String accountUsername(Account account) {

        return account != null ? account.getUsername() : null;
    }

    private String accountFullName(Account account) {

        if (account == null || account.getPerson() == null) {
            return accountUsername(account);
        }

        String fullName = joinNames(
                account.getPerson().getNames(),
                account.getPerson().getLastNames());

        return fullName != null ? fullName : account.getUsername();
    }

    private String academicCycleName(Account account) {

        return account != null && account.getAcademicCycle() != null
                ? account.getAcademicCycle().getName()
                : null;
    }

    private Account institutionalTutorFor(
            Enrollment enrollment,
            Course course) {

        if (enrollment != null
                && enrollment.getGroup() != null
                && enrollment.getGroup().getInstitutionalTutor() != null) {
            return enrollment.getGroup().getInstitutionalTutor();
        }

        return course != null ? course.getInstitutionalTutor() : null;
    }

    private List<ActivityPlanResponse> mapPlansToResponses(List<ActivityPlan> plans) {

        Map<Long, List<FeedbackCommentResponse>> feedbackByDocumentId =
                feedbackCommentService.listResponsesByDocumentId(
                        FeedbackDocumentType.ACTIVITY_PLAN,
                        plans.stream().map(ActivityPlan::getId).toList());
        Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId =
                feedbackCommentService.listHistoryResponsesByDocumentId(
                        FeedbackDocumentType.ACTIVITY_PLAN,
                        plans.stream().map(ActivityPlan::getId).toList());

        return plans.stream()
                .map(plan -> mapToResponse(
                        plan,
                        feedbackByDocumentId,
                        historyByDocumentId))
                .toList();
    }

    private ActivityPlanResponse mapToResponse(ActivityPlan plan) {
        return mapToResponse(plan, null, null);
    }

    private ActivityPlanResponse mapToResponse(
            ActivityPlan plan,
            Map<Long, List<FeedbackCommentResponse>> feedbackByDocumentId,
            Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId) {

        return ActivityPlanResponse.builder()
                .id(plan.getId())
                .enrollmentId(plan.getEnrollment().getId())
                .courseId(plan.getCourse().getId())
                .courseName(plan.getCourse().getName())
                .studentId(plan.getStudent().getId())
                .studentUsername(plan.getStudent().getUsername())
                .educationalInstitutionId(plan.getEducationalInstitution().getId())
                .studentFullName(plan.getStudentFullName())
                .studentIdentification(plan.getStudentIdentification())
                .studentEmail(plan.getStudentEmail())
                .studentPhone(plan.getStudentPhone())
                .curricularOrganizationUnit(plan.getCurricularOrganizationUnit())
                .subjectDenomination(plan.getSubjectDenomination())
                .integrativeKnowledgeProject(plan.getIntegrativeKnowledgeProject())
                .practiceType(plan.getPracticeType())
                .educationalInstitutionName(plan.getEducationalInstitutionName())
                .educationalInstitutionCode(plan.getEducationalInstitutionCode())
                .educationalInstitutionAddress(plan.getEducationalInstitutionAddress())
                .educationalInstitutionPhone(plan.getEducationalInstitutionPhone())
                .educationalInstitutionEmail(plan.getEducationalInstitutionEmail())
                .teacherCount(plan.getTeacherCount())
                .studentCount(plan.getStudentCount())
                .mission(plan.getMission())
                .vision(plan.getVision())
                .institutionalValues(plan.getInstitutionalValues())
                .presentation(plan.getPresentation())
                .generalObjective(plan.getGeneralObjective())
                .specificObjective1(plan.getSpecificObjective1())
                .specificObjective2(plan.getSpecificObjective2())
                .specificObjective3(plan.getSpecificObjective3())
                .activityWeeks(mapActivityWeeks(plan))
                .scheduleWeeks(mapScheduleWeeks(plan))
                .legalResources(plan.getLegalResources())
                .humanResources(plan.getHumanResources())
                .technologicalResources(plan.getTechnologicalResources())
                .physicalResources(plan.getPhysicalResources())
                .generalInfoFeedback(plan.getGeneralInfoFeedback())
                .presentationFeedback(plan.getPresentationFeedback())
                .objectivesFeedback(plan.getObjectivesFeedback())
                .activitiesFeedback(plan.getActivitiesFeedback())
                .scheduleFeedback(plan.getScheduleFeedback())
                .resourcesFeedback(plan.getResourcesFeedback())
                .approvalFeedback(plan.getApprovalFeedback())
                .feedbackComments(resolveFeedbackComments(
                        plan.getId(),
                        feedbackByDocumentId))
                .feedbackHistory(resolveFeedbackHistory(
                        plan.getId(),
                        historyByDocumentId))
                .status(plan.getStatus().name())
                .reviewCycle(plan.getReviewCycle())
                .practiceTutorApproved(plan.isPracticeTutorApproved())
                .directorApproved(plan.isDirectorApproved())
                .reviewedBy(
                        plan.getReviewedBy() != null
                                ? plan.getReviewedBy().getUsername()
                                : null)
                .directorReviewedBy(
                        plan.getDirectorReviewedBy() != null
                                ? plan.getDirectorReviewedBy().getUsername()
                                : null)
                .submittedAt(plan.getSubmittedAt())
                .reviewedAt(plan.getReviewedAt())
                .directorReviewedAt(plan.getDirectorReviewedAt())
                .approvedAt(plan.getApprovedAt())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .build();
    }

    private List<FeedbackCommentResponse> resolveFeedbackComments(
            Long documentId,
            Map<Long, List<FeedbackCommentResponse>> feedbackByDocumentId) {

        if (feedbackByDocumentId != null) {
            return feedbackByDocumentId.getOrDefault(documentId, List.of());
        }

        return feedbackCommentService.listResponses(
                FeedbackDocumentType.ACTIVITY_PLAN,
                documentId);
    }

    private List<FeedbackHistoryResponse> resolveFeedbackHistory(
            Long documentId,
            Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId) {

        if (historyByDocumentId != null) {
            return historyByDocumentId.getOrDefault(documentId, List.of());
        }

        return feedbackCommentService.listHistoryResponses(
                FeedbackDocumentType.ACTIVITY_PLAN,
                documentId);
    }

    private List<ActivityPlanActivityWeekResponse> mapActivityWeeks(ActivityPlan plan) {

        return plan.getActivityWeeks()
                .stream()
                .sorted(Comparator.comparing(
                        ActivityPlanActivityWeek::getWeekNumber,
                        Comparator.nullsLast(Integer::compareTo)))
                .map(week -> ActivityPlanActivityWeekResponse.builder()
                        .id(week.getId())
                        .weekNumber(week.getWeekNumber())
                        .startDate(week.getStartDate())
                        .endDate(week.getEndDate())
                        .activities(week.getActivities())
                        .build())
                .toList();
    }

    private List<ActivityPlanScheduleWeekResponse> mapScheduleWeeks(ActivityPlan plan) {

        return plan.getScheduleWeeks()
                .stream()
                .sorted(Comparator.comparing(
                        ActivityPlanScheduleWeek::getWeekNumber,
                        Comparator.nullsLast(Integer::compareTo)))
                .map(week -> ActivityPlanScheduleWeekResponse.builder()
                        .id(week.getId())
                        .weekNumber(week.getWeekNumber())
                        .startDate(week.getStartDate())
                        .endDate(week.getEndDate())
                        .scheduledActivities(week.getScheduledActivities())
                        .build())
                .toList();
    }
}
