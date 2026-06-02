package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.practicereport.CreatePracticeReportRequest;
import com.sgp.systemsgp.dto.practicereport.PracticeReportActivityWeekRequest;
import com.sgp.systemsgp.dto.practicereport.PracticeReportActivityWeekResponse;
import com.sgp.systemsgp.dto.practicereport.PracticeReportResponse;
import com.sgp.systemsgp.dto.practicereport.ReviewPracticeReportRequest;
import com.sgp.systemsgp.dto.practicereport.UpdatePracticeReportRequest;
import com.sgp.systemsgp.dto.document.ReviewableDocumentSummaryResponse;
import com.sgp.systemsgp.dto.feedback.FeedbackCommentResponse;
import com.sgp.systemsgp.dto.feedback.FeedbackHistoryResponse;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.PracticeReportStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.PracticeReport;
import com.sgp.systemsgp.model.PracticeReportActivityWeek;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import com.sgp.systemsgp.repository.PracticeReportRepository;
import com.sgp.systemsgp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PracticeReportService {

    private static final List<PracticeReportStatus> REVIEWER_VISIBLE_STATUSES =
            List.of(PracticeReportStatus.SUBMITTED, PracticeReportStatus.APPROVED);

    private final PracticeReportRepository practiceReportRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final AccountRepository accountRepository;
    private final InstitutionRepository institutionRepository;
    private final NotificationService notificationService;
    private final FeedbackCommentService feedbackCommentService;
    private final PdfExportService pdfExportService;

    @Transactional
    public PracticeReportResponse create(
            String username,
            CreatePracticeReportRequest request) {

        Account student = getAccount(username);
        Enrollment enrollment = request.getEnrollmentId() != null
                ? getEnrollment(request.getEnrollmentId())
                : getDefaultEnrollment(student);

        validateStudentOwnsEnrollment(student, enrollment);
        validateEnrollmentApproved(enrollment);

        if (practiceReportRepository.existsByEnrollment_IdAndDeletedFalse(
                enrollment.getId())) {
            throw new BadRequestException(
                    "Ya existe un informe de practicas para este curso");
        }

        Institution institution = resolveEducationalInstitution(
                enrollment,
                request.getEducationalInstitutionId());

        PracticeReport report = PracticeReport.builder()
                .enrollment(enrollment)
                .student(student)
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .status(PracticeReportStatus.DRAFT)
                .build();

        applyCreateData(report, request, student, institution);

        practiceReportRepository.save(report);

        return mapToResponse(report);
    }

    public List<PracticeReportResponse> myReports(String username) {

        List<PracticeReport> reports = practiceReportRepository
                .findByStudent_UsernameAndCourse_ActiveTrueAndCourse_DeletedFalseAndDeletedFalse(username);

        return mapReportsToResponses(reports);
    }

    public List<ReviewableDocumentSummaryResponse> myReportSummaries(String username) {

        List<PracticeReport> reports = practiceReportRepository
                .findByStudent_UsernameAndCourse_ActiveTrueAndCourse_DeletedFalseAndDeletedFalse(username);

        return mapReportsToSummaries(reports);
    }

    public List<PracticeReportResponse> submittedDocuments(String username) {

        Account account = getAccount(username);
        List<PracticeReport> reports = practiceReportRepository
                .findByStatusInAndDeletedFalse(REVIEWER_VISIBLE_STATUSES)
                .stream()
                .filter(report -> canViewDirectorQueue(report.getCourse(), account))
                .toList();

        return mapReportsToResponses(reports);
    }

    public List<ReviewableDocumentSummaryResponse> submittedDocumentSummaries(String username) {

        Account account = getAccount(username);
        List<PracticeReport> reports = practiceReportRepository
                .findByStatusInAndDeletedFalse(REVIEWER_VISIBLE_STATUSES)
                .stream()
                .filter(report -> canViewDirectorQueue(report.getCourse(), account))
                .toList();

        return mapReportsToSummaries(reports);
    }

    public List<PracticeReportResponse> reviewQueue(String username) {

        List<PracticeReport> reports = practiceReportRepository
                .findByCourse_PracticeTutor_UsernameAndStatusInAndCourse_ActiveTrueAndCourse_DeletedFalseAndDeletedFalse(
                        username,
                        REVIEWER_VISIBLE_STATUSES);

        return mapReportsToResponses(reports);
    }

    public List<ReviewableDocumentSummaryResponse> reviewQueueSummaries(String username) {

        List<PracticeReport> reports = practiceReportRepository
                .findByCourse_PracticeTutor_UsernameAndStatusInAndCourse_ActiveTrueAndCourse_DeletedFalseAndDeletedFalse(
                        username,
                        REVIEWER_VISIBLE_STATUSES);

        return mapReportsToSummaries(reports);
    }

    public PracticeReportResponse getDefaults(
            String username,
            Long enrollmentId) {

        Account student = getAccount(username);
        Enrollment enrollment = enrollmentId != null
                ? getEnrollment(enrollmentId)
                : getDefaultEnrollment(student);

        validateStudentOwnsEnrollment(student, enrollment);
        validateEnrollmentApproved(enrollment);

        Institution institution = resolveEducationalInstitution(
                enrollment,
                null);

        PracticeReport report = PracticeReport.builder()
                .enrollment(enrollment)
                .student(student)
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .status(PracticeReportStatus.DRAFT)
                .build();

        copyStudentSnapshot(report, student);
        copyInstitutionSnapshot(report, institution);
        copyCourseObjectivesSnapshot(report);

        return mapToResponse(report);
    }

    public PracticeReportResponse getById(
            Long id,
            String username) {

        PracticeReport report = getReport(id);
        Account account = getAccount(username);

        validateCanView(report, account);

        return mapToResponse(report);
    }

    public byte[] exportApprovedPdf(
            Long id,
            String username) {

        PracticeReportResponse report = getById(id, username);
        validateApprovedForExport(report.getStatus());

        return pdfExportService.createPdf(
                "Informe de actividades cumplidas",
                List.of(
                        pdfExportService.section(
                                "Datos generales",
                                List.of(
                                        pdfExportService.field("Estudiante", report.getStudentFullName()),
                                        pdfExportService.field("Cedula", report.getStudentIdentification()),
                                        pdfExportService.field("Ciclo", report.getCourseName()),
                                        pdfExportService.field("Tutor Academico", firstPresent(
                                                report.getReviewedByName(),
                                                report.getReviewedBy())),
                                        pdfExportService.field("Correo Electronico", report.getStudentEmail()),
                                        pdfExportService.field("Nro. de telefono", report.getStudentPhone()),
                                        pdfExportService.field("Institucion", report.getEducationalInstitutionName()),
                                        pdfExportService.field("Codigo AMIE", report.getEducationalInstitutionCode()),
                                        pdfExportService.field("Direccion", report.getEducationalInstitutionAddress())
                                )),
                        pdfExportService.section(
                                "Presentacion y objetivos",
                                List.of(
                                        pdfExportService.field("Presentacion", report.getPresentation()),
                                        pdfExportService.field("Objetivo general", report.getGeneralObjective()),
                                        pdfExportService.field("Objetivo especifico 1", report.getSpecificObjective1()),
                                        pdfExportService.field("Objetivo especifico 2", report.getSpecificObjective2()),
                                        pdfExportService.field("Objetivo especifico 3", report.getSpecificObjective3())
                                )),
                        pdfExportService.section(
                                "Metodologia y actividades",
                                List.of(
                                        pdfExportService.field("Metodologia", report.getMethodology())
                                )),
                        pdfExportService.sectionWithTables(
                                "Actividades por semana",
                                List.of(),
                                List.of(activityWeeksTable(report.getActivityWeeks()))),
                        pdfExportService.section(
                                "Conclusiones",
                                List.of(
                                        pdfExportService.field("Conclusion 1", report.getConclusion1()),
                                        pdfExportService.field("Conclusion 2", report.getConclusion2()),
                                        pdfExportService.field("Conclusion 3", report.getConclusion3())
                                )),
                        pdfExportService.section(
                                "Recomendaciones",
                                List.of(
                                        pdfExportService.field("Recomendacion 1", report.getRecommendation1()),
                                        pdfExportService.field("Recomendacion 2", report.getRecommendation2()),
                                        pdfExportService.field("Recomendacion 3", report.getRecommendation3())
                                )),
                        pdfExportService.section(
                                "Elaboracion y aprobacion",
                                List.of(
                                        pdfExportService.field("Estudiante", report.getStudentFullName()),
                                        pdfExportService.field("Tutor Academico", firstPresent(
                                                report.getReviewedByName(),
                                                report.getReviewedBy())),
                                        pdfExportService.field(
                                                "Rol",
                                                "DOCENTE DE LA ASIGNATURA DE DISEÑO CURRICULAR EN INFORMÁTICA\nTUTOR ACADÉMICO")
                                ))
                ));
    }

    @Transactional
    public PracticeReportResponse update(
            Long id,
            String username,
            UpdatePracticeReportRequest request) {

        PracticeReport report = getReport(id);
        Account student = getAccount(username);

        validateStudentOwnsReport(student, report);
        validateEditable(report);

        if (request.getEducationalInstitutionId() != null) {
            Institution institution = resolveEducationalInstitution(
                    report.getEnrollment(),
                    request.getEducationalInstitutionId());

            report.setEducationalInstitution(institution);
        }

        copyStudentSnapshot(report, student);
        copyInstitutionSnapshot(report, report.getEducationalInstitution());
        copyCourseObjectivesSnapshot(report);
        applyUpdateData(report, request);
        moveToDraftAfterStudentUpdate(report);

        practiceReportRepository.save(report);

        return mapToResponse(report);
    }

    @Transactional
    public PracticeReportResponse submit(
            Long id,
            String username) {

        PracticeReport report = getReport(id);
        Account student = getAccount(username);

        validateStudentOwnsReport(student, report);
        validateEditable(report);

        if (report.getStatus() != PracticeReportStatus.SUBMITTED) {
            startNewReviewCycle(report);
        }
        report.setStatus(ReviewWorkflowStateMachine.transition(
                report.getStatus(),
                PracticeReportStatus.SUBMITTED,
                "informe de practicas"));
        report.setSubmittedAt(LocalDateTime.now());

        practiceReportRepository.save(report);
        notificationService.notifyPracticeReportSubmitted(report);

        return mapToResponse(report);
    }

    @Transactional
    public PracticeReportResponse review(
            Long id,
            String username,
            ReviewPracticeReportRequest request) {

        PracticeReport report = getReport(id);
        Account tutor = getAccount(username);

        validateCanReview(report, tutor);

        ReviewWorkflowStateMachine.ensureReviewable(
                report.getStatus(),
                "Solo se pueden revisar informes enviados");

        applyReviewFeedback(report, request);
        saveReviewFeedbackComments(report, request, tutor);

        if (request.getApproved() != null) {
            applyReviewDecision(report, tutor, request.getApproved());
        } else if (hasReviewFeedback(request)) {
            touchReviewAuthor(report, tutor);
        }

        practiceReportRepository.save(report);

        if (request.getApproved() != null) {
            notificationService.notifyPracticeReportReviewed(report);
        } else {
            notificationService.notifyPracticeReportFeedbackAdded(report, tutor);
        }

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
                        "Inscripción no encontrada"));
    }

    private Enrollment getDefaultEnrollment(Account student) {

        return enrollmentRepository
                .findByAccount_UsernameAndStatusAndCourse_ActiveTrueAndCourse_DeletedFalse(
                        student.getUsername(),
                        EnrollmentStatus.APPROVED)
                .stream()
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "No tienes ninguna inscripción aprobada para crear el informe de prácticas"));
    }

    private PracticeReport getReport(Long id) {

        return practiceReportRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Informe de prácticas no encontrado"));
    }

    private List<PracticeReportResponse> mapReportsToResponses(
            List<PracticeReport> reports) {

        Map<Long, List<FeedbackCommentResponse>> feedbackByDocumentId =
                feedbackCommentService.listResponsesByDocumentId(
                        FeedbackDocumentType.PRACTICE_REPORT,
                        reports.stream().map(PracticeReport::getId).toList());
        Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId =
                feedbackCommentService.listHistoryResponsesByDocumentId(
                        FeedbackDocumentType.PRACTICE_REPORT,
                        reports.stream().map(PracticeReport::getId).toList());

        return reports.stream()
                .map(report -> mapToResponse(
                        report,
                        feedbackByDocumentId,
                        historyByDocumentId))
                .toList();
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
                    "No puedes crear informes para otra inscripción");
        }
    }

    private void validateStudentOwnsReport(
            Account student,
            PracticeReport report) {

        if (!report.getStudent().getId().equals(student.getId())) {
            throw new AccessDeniedException(
                    "No puedes modificar este informe");
        }
    }

    private void validateEnrollmentApproved(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException(
                    "Solo se puede crear el informe de una inscripción aprobada");
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
            PracticeReport report,
            Account account) {

        if (report.getStudent().getId().equals(account.getId())) {
            return;
        }

        if (isVisibleToReviewers(report.getStatus())
                && (isAssignedPracticeTutor(report, account)
                || hasRole(account, RoleName.ROLE_ADMIN)
                || isDirectorForCourse(report.getCourse(), account))) {
            return;
        }

        throw new AccessDeniedException(
                "No puedes ver este informe");
    }

    private boolean isVisibleToReviewers(PracticeReportStatus status) {

        return REVIEWER_VISIBLE_STATUSES.contains(status);
    }

    private void validateCanReview(
            PracticeReport report,
            Account reviewer) {

        if (isDirectorForCourse(report.getCourse(), reviewer)) {
            return;
        }

        if (hasRole(reviewer, RoleName.ROLE_TUTOR_PRACTICAS)
                && isAssignedPracticeTutor(report, reviewer)) {
            return;
        }

        throw new AccessDeniedException(
                "Solo el tutor de prácticas asignado o el director de prácticas puede revisar este informe");
    }

    private boolean isAssignedPracticeTutor(
            PracticeReport report,
            Account account) {

        Course course = report.getCourse();

        return course.getPracticeTutor() != null
                && course.getPracticeTutor().getId().equals(account.getId());
    }

    private boolean isDirectorForCourse(
            Course course,
            Account account) {

        if (!hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)
                || course == null) {
            return false;
        }

        Career directorCareer = account.getCareer();
        Career courseCareer = course.getAcademicCycle() != null
                ? course.getAcademicCycle().getCareer()
                : course.getSubject() != null && course.getSubject().getAcademicCycle() != null
                        ? course.getSubject().getAcademicCycle().getCareer()
                        : null;

        return directorCareer != null
                && courseCareer != null
                && directorCareer.getId().equals(courseCareer.getId());
    }

    private boolean canViewDirectorQueue(
            Course course,
            Account account) {

        return hasRole(account, RoleName.ROLE_ADMIN)
                || isDirectorForCourse(course, account);
    }

    private boolean hasRole(
            Account account,
            RoleName roleName) {

        return account.getRoles()
                .stream()
                .anyMatch(role -> roleName.name().equals(role.getName()));
    }

    private void validateEditable(PracticeReport report) {

        ReviewWorkflowStateMachine.ensureEditable(
                report.getStatus(),
                "No se puede editar un informe aprobado");
    }

    private void moveToDraftAfterStudentUpdate(PracticeReport report) {

        if (report.getStatus() == PracticeReportStatus.SUBMITTED) {
            report.setStatus(ReviewWorkflowStateMachine.transition(
                    report.getStatus(),
                    PracticeReportStatus.DRAFT,
                    "informe de practicas"));
            report.setSubmittedAt(null);
            resetReviewDecision(report);
        }
    }

    private void resetReviewDecision(PracticeReport report) {

        report.setPracticeTutorApproved(false);
        report.setDirectorApproved(false);
        report.setReviewedBy(null);
        report.setDirectorReviewedBy(null);
        report.setReviewedAt(null);
        report.setDirectorReviewedAt(null);
        report.setApprovedAt(null);
        clearReviewFeedback(report);
        feedbackCommentService.clearDocumentFeedback(
                FeedbackDocumentType.PRACTICE_REPORT,
                report.getId());
    }

    private void startNewReviewCycle(PracticeReport report) {

        resetReviewDecision(report);
        report.setReviewCycle(ReviewWorkflowStateMachine.nextCycle(report.getReviewCycle()));
    }

    private void clearReviewFeedback(PracticeReport report) {

        report.setGeneralInfoFeedback(null);
        report.setPresentationFeedback(null);
        report.setObjectivesFeedback(null);
        report.setMethodologyFeedback(null);
        report.setActivitiesFeedback(null);
        report.setConclusionsFeedback(null);
        report.setRecommendationsFeedback(null);
        report.setApprovalFeedback(null);
    }

    private void applyReviewFeedback(
            PracticeReport report,
            ReviewPracticeReportRequest request) {

        setIfNotNull(request.getGeneralInfoFeedback(), report::setGeneralInfoFeedback);
        setIfNotNull(request.getPresentationFeedback(), report::setPresentationFeedback);
        setIfNotNull(request.getObjectivesFeedback(), report::setObjectivesFeedback);
        setIfNotNull(request.getMethodologyFeedback(), report::setMethodologyFeedback);
        setIfNotNull(request.getActivitiesFeedback(), report::setActivitiesFeedback);
        setIfNotNull(request.getConclusionsFeedback(), report::setConclusionsFeedback);
        setIfNotNull(request.getRecommendationsFeedback(), report::setRecommendationsFeedback);
        setIfNotNull(request.getApprovalFeedback(), report::setApprovalFeedback);
    }

    private boolean hasReviewFeedback(ReviewPracticeReportRequest request) {
        return request.getGeneralInfoFeedback() != null
                || request.getPresentationFeedback() != null
                || request.getObjectivesFeedback() != null
                || request.getMethodologyFeedback() != null
                || request.getActivitiesFeedback() != null
                || request.getConclusionsFeedback() != null
                || request.getRecommendationsFeedback() != null
                || request.getApprovalFeedback() != null;
    }

    private void saveReviewFeedbackComments(
            PracticeReport report,
            ReviewPracticeReportRequest request,
            Account reviewer) {

        saveDocumentFeedback(report, "generalInfoFeedback", request.getGeneralInfoFeedback(), reviewer);
        saveDocumentFeedback(report, "presentationFeedback", request.getPresentationFeedback(), reviewer);
        saveDocumentFeedback(report, "objectivesFeedback", request.getObjectivesFeedback(), reviewer);
        saveDocumentFeedback(report, "methodologyFeedback", request.getMethodologyFeedback(), reviewer);
        saveDocumentFeedback(report, "activitiesFeedback", request.getActivitiesFeedback(), reviewer);
        saveDocumentFeedback(report, "conclusionsFeedback", request.getConclusionsFeedback(), reviewer);
        saveDocumentFeedback(report, "recommendationsFeedback", request.getRecommendationsFeedback(), reviewer);
        saveDocumentFeedback(report, "approvalFeedback", request.getApprovalFeedback(), reviewer);
    }

    private void saveDocumentFeedback(
            PracticeReport report,
            String sectionKey,
            String message,
            Account reviewer) {

        feedbackCommentService.upsertDocumentFeedback(
                FeedbackDocumentType.PRACTICE_REPORT,
                report.getId(),
                sectionKey,
                message,
                reviewer,
                report.getReviewCycle());
    }

    private void touchReviewAuthor(
            PracticeReport report,
            Account reviewer) {

        if (hasRole(reviewer, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            report.setDirectorReviewedBy(reviewer);
            report.setDirectorReviewedAt(LocalDateTime.now());
            return;
        }

        report.setReviewedBy(reviewer);
        report.setReviewedAt(LocalDateTime.now());
    }

    private void applyReviewDecision(
            PracticeReport report,
            Account reviewer,
            boolean approved) {

        if (hasRole(reviewer, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            report.setDirectorApproved(approved);
            report.setDirectorReviewedBy(reviewer);
            report.setDirectorReviewedAt(LocalDateTime.now());
        } else {
            report.setPracticeTutorApproved(approved);
            report.setReviewedBy(reviewer);
            report.setReviewedAt(LocalDateTime.now());
        }

        if (!approved) {
            report.setStatus(ReviewWorkflowStateMachine.transition(
                    report.getStatus(),
                    PracticeReportStatus.NEEDS_CORRECTION,
                    "informe de practicas"));
            report.setApprovedAt(null);
            return;
        }

        if (report.isPracticeTutorApproved() && report.isDirectorApproved()) {
            report.setStatus(ReviewWorkflowStateMachine.transition(
                    report.getStatus(),
                    PracticeReportStatus.APPROVED,
                    "informe de practicas"));
            report.setApprovedAt(LocalDateTime.now());
            return;
        }

        report.setStatus(ReviewWorkflowStateMachine.transition(
                report.getStatus(),
                PracticeReportStatus.SUBMITTED,
                "informe de practicas"));
        report.setApprovedAt(null);
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
        Course loadedCourse = courseRepository
                .findByIdWithTutorsAndInstitutions(course.getId())
                .orElse(course);

        if (loadedCourse.getInstitutionalTutor() != null) {
            Institution legacyInstitution = getTutorInstitution(loadedCourse.getInstitutionalTutor());
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
            PracticeReport report,
            CreatePracticeReportRequest request,
            Account student,
            Institution institution) {

        copyStudentSnapshot(report, student);
        copyInstitutionSnapshot(report, institution);
        copyCourseObjectivesSnapshot(report);

        report.setPresentation(request.getPresentation());
        report.setMethodology(request.getMethodology());
        report.setConclusion1(request.getConclusion1());
        report.setConclusion2(request.getConclusion2());
        report.setConclusion3(request.getConclusion3());
        report.setRecommendation1(request.getRecommendation1());
        report.setRecommendation2(request.getRecommendation2());
        report.setRecommendation3(request.getRecommendation3());

        replaceActivityWeeks(report, request.getActivityWeeks());
    }

    private void applyUpdateData(
            PracticeReport report,
            UpdatePracticeReportRequest request) {

        setIfNotNull(request.getPresentation(), report::setPresentation);
        setIfNotNull(request.getMethodology(), report::setMethodology);
        setIfNotNull(request.getConclusion1(), report::setConclusion1);
        setIfNotNull(request.getConclusion2(), report::setConclusion2);
        setIfNotNull(request.getConclusion3(), report::setConclusion3);
        setIfNotNull(request.getRecommendation1(), report::setRecommendation1);
        setIfNotNull(request.getRecommendation2(), report::setRecommendation2);
        setIfNotNull(request.getRecommendation3(), report::setRecommendation3);

        if (request.getActivityWeeks() != null) {
            replaceActivityWeeks(report, request.getActivityWeeks());
        }
    }

    private void copyStudentSnapshot(
            PracticeReport report,
            Account student) {

        Person person = student.getPerson();

        if (person == null) {
            return;
        }

        String fullName = joinNames(
                person.getNames(),
                person.getLastNames());

        report.setStudentFullName(fullName);
        report.setStudentIdentification(person.getCedula());
        report.setStudentEmail(person.getInstitutionalEmail());
        report.setStudentPhone(person.getPhone());
    }

    private void copyInstitutionSnapshot(
            PracticeReport report,
            Institution institution) {

        report.setEducationalInstitutionName(institution.getName());
        report.setEducationalInstitutionCode(institution.getCode());
        report.setEducationalInstitutionAddress(institution.getAddress());
        report.setEducationalInstitutionPhone(institution.getPhone());
        report.setEducationalInstitutionEmail(institution.getEmail());
    }

    private void copyCourseObjectivesSnapshot(PracticeReport report) {

        Course course = report.getCourse();

        report.setGeneralObjective(course.getGeneralObjective());
        report.setSpecificObjective1(course.getSpecificObjective1());
        report.setSpecificObjective2(course.getSpecificObjective2());
        report.setSpecificObjective3(course.getSpecificObjective3());
    }

    private void replaceActivityWeeks(
            PracticeReport report,
            List<PracticeReportActivityWeekRequest> weeks) {

        report.getActivityWeeks().clear();

        if (weeks == null) {
            return;
        }

        for (PracticeReportActivityWeekRequest weekRequest : weeks) {
            PracticeReportActivityWeek week = PracticeReportActivityWeek.builder()
                    .report(report)
                    .weekNumber(weekRequest.getWeekNumber())
                    .startDate(activityWeekStartDate(report.getCourse(), weekRequest.getWeekNumber(), weekRequest.getStartDate()))
                    .endDate(activityWeekEndDate(report.getCourse(), weekRequest.getWeekNumber(), weekRequest.getEndDate()))
                    .activities(weekRequest.getActivities())
                    .build();

            report.getActivityWeeks().add(week);
        }
    }

    private java.time.LocalDate activityWeekStartDate(
            Course course,
            Integer weekNumber,
            java.time.LocalDate providedDate) {

        if (providedDate != null) {
            return providedDate;
        }

        return defaultActivityWeekStartDate(course, weekNumber);
    }

    private java.time.LocalDate activityWeekEndDate(
            Course course,
            Integer weekNumber,
            java.time.LocalDate providedDate) {

        if (providedDate != null) {
            return providedDate;
        }

        return defaultActivityWeekEndDate(course, weekNumber);
    }

    private java.time.LocalDate defaultActivityWeekStartDate(
            Course course,
            Integer weekNumber) {

        if (course == null || course.getStartDate() == null) {
            return null;
        }

        return course.getStartDate()
                .toLocalDate()
                .plusDays((long) (weekNumber == null ? 0 : Math.max(weekNumber - 1, 0)) * 7L);
    }

    private java.time.LocalDate defaultActivityWeekEndDate(
            Course course,
            Integer weekNumber) {

        java.time.LocalDate startDate = defaultActivityWeekStartDate(course, weekNumber);

        if (startDate == null) {
            return null;
        }

        java.time.LocalDate endDate = startDate.plusDays(4);

        return course.getEndDate() != null
                && endDate.isAfter(course.getEndDate().toLocalDate())
                        ? course.getEndDate().toLocalDate()
                        : endDate;
    }

    private void validateComplete(PracticeReport report) {

        requireText(report.getStudentFullName(), "Datos del estudiante incompletos");
        requireText(report.getEducationalInstitutionName(), "Datos de la institución educativa incompletos");
        requireText(report.getPresentation(), "La presentación es obligatoria");
        requireText(report.getGeneralObjective(), "El objetivo general es obligatorio");
        requireText(report.getSpecificObjective1(), "El objetivo específico 1 es obligatorio");
        requireText(report.getSpecificObjective2(), "El objetivo específico 2 es obligatorio");
        requireText(report.getSpecificObjective3(), "El objetivo específico 3 es obligatorio");
        requireText(report.getMethodology(), "La metodología es obligatoria");
        requireText(report.getConclusion1(), "La conclusión 1 es obligatoria");
        requireText(report.getConclusion2(), "La conclusión 2 es obligatoria");
        requireText(report.getConclusion3(), "La conclusión 3 es obligatoria");
        requireText(report.getRecommendation1(), "La recomendación 1 es obligatoria");
        requireText(report.getRecommendation2(), "La recomendación 2 es obligatoria");
        requireText(report.getRecommendation3(), "La recomendación 3 es obligatoria");

        if (report.getActivityWeeks().isEmpty()) {
            throw new BadRequestException(
                    "Debe registrar al menos una semana de actividades");
        }

        for (PracticeReportActivityWeek week : report.getActivityWeeks()) {
            if (week.getWeekNumber() == null
                    || week.getStartDate() == null
                    || week.getEndDate() == null
                    || !hasText(week.getActivities())) {
                throw new BadRequestException(
                        "Todas las semanas deben tener número, fechas y actividades");
            }

            if (week.getEndDate().isBefore(week.getStartDate())) {
                throw new BadRequestException(
                        "La fecha final de una semana no puede ser anterior a la fecha inicial");
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

    private void setIfNotNull(
            String value,
            java.util.function.Consumer<String> setter) {

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

        if (!PracticeReportStatus.APPROVED.name().equals(status)) {
            throw new BadRequestException(
                    "Solo se pueden exportar documentos aprobados");
        }
    }

    private PdfExportService.PdfWeekTable activityWeeksTable(List<PracticeReportActivityWeekResponse> weeks) {

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

    private List<ReviewableDocumentSummaryResponse> mapReportsToSummaries(List<PracticeReport> reports) {

        return reports.stream()
                .map(this::mapToSummary)
                .toList();
    }

    private ReviewableDocumentSummaryResponse mapToSummary(PracticeReport report) {

        Course course = report.getCourse();
        Account institutionalTutor = institutionalTutorFor(
                report.getEnrollment(),
                course);

        return ReviewableDocumentSummaryResponse.builder()
                .id(report.getId())
                .documentType("PRACTICE_REPORT")
                .status(report.getStatus().name())
                .reviewCycle(report.getReviewCycle())
                .enrollmentId(report.getEnrollment().getId())
                .courseId(course.getId())
                .courseName(course.getName())
                .courseCode(course.getCode())
                .courseActive(course.isActive())
                .studentId(report.getStudent().getId())
                .studentUsername(report.getStudent().getUsername())
                .studentFullName(report.getStudentFullName())
                .studentIdentification(report.getStudentIdentification())
                .academicCycleName(academicCycleName(report.getStudent()))
                .educationalInstitutionId(report.getEducationalInstitution().getId())
                .educationalInstitutionName(report.getEducationalInstitutionName())
                .practiceTutorUsername(accountUsername(course.getPracticeTutor()))
                .practiceTutorName(accountFullName(course.getPracticeTutor()))
                .institutionalTutorUsername(accountUsername(institutionalTutor))
                .institutionalTutorName(accountFullName(institutionalTutor))
                .practiceTutorApproved(report.isPracticeTutorApproved())
                .directorApproved(report.isDirectorApproved())
                .reviewedBy(accountUsername(report.getReviewedBy()))
                .reviewedByName(accountFullName(report.getReviewedBy()))
                .directorReviewedBy(accountUsername(report.getDirectorReviewedBy()))
                .directorReviewedByName(accountFullName(report.getDirectorReviewedBy()))
                .submittedAt(report.getSubmittedAt())
                .reviewedAt(report.getReviewedAt())
                .directorReviewedAt(report.getDirectorReviewedAt())
                .approvedAt(report.getApprovedAt())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    private String accountUsername(Account account) {

        return account != null ? account.getUsername() : null;
    }

    private String firstPresent(String firstValue, String secondValue) {

        return firstValue != null && !firstValue.isBlank()
                ? firstValue
                : secondValue;
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

    private PracticeReportResponse mapToResponse(PracticeReport report) {
        return mapToResponse(report, null, null);
    }

    private PracticeReportResponse mapToResponse(
            PracticeReport report,
            Map<Long, List<FeedbackCommentResponse>> feedbackByDocumentId,
            Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId) {

        return PracticeReportResponse.builder()
                .id(report.getId())
                .enrollmentId(report.getEnrollment().getId())
                .courseId(report.getCourse().getId())
                .courseName(report.getCourse().getName())
                .studentId(report.getStudent().getId())
                .studentUsername(report.getStudent().getUsername())
                .educationalInstitutionId(report.getEducationalInstitution().getId())
                .studentFullName(report.getStudentFullName())
                .studentIdentification(report.getStudentIdentification())
                .studentEmail(report.getStudentEmail())
                .studentPhone(report.getStudentPhone())
                .educationalInstitutionName(report.getEducationalInstitutionName())
                .educationalInstitutionCode(report.getEducationalInstitutionCode())
                .educationalInstitutionAddress(report.getEducationalInstitutionAddress())
                .educationalInstitutionPhone(report.getEducationalInstitutionPhone())
                .educationalInstitutionEmail(report.getEducationalInstitutionEmail())
                .presentation(report.getPresentation())
                .generalObjective(report.getGeneralObjective())
                .specificObjective1(report.getSpecificObjective1())
                .specificObjective2(report.getSpecificObjective2())
                .specificObjective3(report.getSpecificObjective3())
                .methodology(report.getMethodology())
                .activityWeeks(mapWeeks(report))
                .conclusion1(report.getConclusion1())
                .conclusion2(report.getConclusion2())
                .conclusion3(report.getConclusion3())
                .recommendation1(report.getRecommendation1())
                .recommendation2(report.getRecommendation2())
                .recommendation3(report.getRecommendation3())
                .generalInfoFeedback(report.getGeneralInfoFeedback())
                .presentationFeedback(report.getPresentationFeedback())
                .objectivesFeedback(report.getObjectivesFeedback())
                .methodologyFeedback(report.getMethodologyFeedback())
                .activitiesFeedback(report.getActivitiesFeedback())
                .conclusionsFeedback(report.getConclusionsFeedback())
                .recommendationsFeedback(report.getRecommendationsFeedback())
                .approvalFeedback(report.getApprovalFeedback())
                .feedbackComments(resolveFeedbackComments(
                        report.getId(),
                        feedbackByDocumentId))
                .feedbackHistory(resolveFeedbackHistory(
                        report.getId(),
                        historyByDocumentId))
                .status(report.getStatus().name())
                .reviewCycle(report.getReviewCycle())
                .practiceTutorApproved(report.isPracticeTutorApproved())
                .directorApproved(report.isDirectorApproved())
                .reviewedBy(
                        report.getReviewedBy() != null
                                ? report.getReviewedBy().getUsername()
                                : null)
                .reviewedByName(accountFullName(report.getReviewedBy()))
                .directorReviewedBy(
                        report.getDirectorReviewedBy() != null
                                ? report.getDirectorReviewedBy().getUsername()
                                : null)
                .directorReviewedByName(accountFullName(report.getDirectorReviewedBy()))
                .submittedAt(report.getSubmittedAt())
                .reviewedAt(report.getReviewedAt())
                .directorReviewedAt(report.getDirectorReviewedAt())
                .approvedAt(report.getApprovedAt())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    private List<FeedbackCommentResponse> resolveFeedbackComments(
            Long documentId,
            Map<Long, List<FeedbackCommentResponse>> feedbackByDocumentId) {

        if (feedbackByDocumentId != null) {
            return feedbackByDocumentId.getOrDefault(documentId, List.of());
        }

        return feedbackCommentService.listResponses(
                FeedbackDocumentType.PRACTICE_REPORT,
                documentId);
    }

    private List<FeedbackHistoryResponse> resolveFeedbackHistory(
            Long documentId,
            Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId) {

        if (historyByDocumentId != null) {
            return historyByDocumentId.getOrDefault(documentId, List.of());
        }

        return feedbackCommentService.listHistoryResponses(
                FeedbackDocumentType.PRACTICE_REPORT,
                documentId);
    }

    private List<PracticeReportActivityWeekResponse> mapWeeks(PracticeReport report) {

        return report.getActivityWeeks()
                .stream()
                .sorted(Comparator.comparing(
                        PracticeReportActivityWeek::getWeekNumber,
                        Comparator.nullsLast(Integer::compareTo)))
                .map(week -> PracticeReportActivityWeekResponse.builder()
                        .id(week.getId())
                        .weekNumber(week.getWeekNumber())
                        .startDate(activityWeekStartDate(report.getCourse(), week.getWeekNumber(), week.getStartDate()))
                        .endDate(activityWeekEndDate(report.getCourse(), week.getWeekNumber(), week.getEndDate()))
                        .activities(week.getActivities())
                        .build())
                .toList();
    }
}
