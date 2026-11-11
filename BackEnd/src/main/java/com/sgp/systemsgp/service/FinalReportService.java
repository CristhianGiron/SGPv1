/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FinalReportService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa la lógica de aplicación de el informe del tutor institucional (L.3).
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.service.documentversion.PracticeDocumentVersionService;
import com.sgp.systemsgp.service.pdf.PdfExportService;
import com.sgp.systemsgp.repository.CompletedActivityRecordRepository;
import com.sgp.systemsgp.model.CompletedActivityRecord;
import org.springframework.web.multipart.MultipartFile;

import com.sgp.systemsgp.dto.finalreport.CreateFinalReportRequest;
import com.sgp.systemsgp.dto.finalreport.FinalReportActivityWeekRequest;
import com.sgp.systemsgp.dto.finalreport.FinalReportActivityWeekResponse;
import com.sgp.systemsgp.dto.finalreport.FinalReportResponse;
import com.sgp.systemsgp.dto.finalreport.ReviewFinalReportRequest;
import com.sgp.systemsgp.dto.finalreport.UpdateFinalReportInstitutionalSectionRequest;
import com.sgp.systemsgp.dto.finalreport.UpdateFinalReportRequest;
import com.sgp.systemsgp.dto.document.ReviewableDocumentSummaryResponse;
import com.sgp.systemsgp.dto.feedback.FeedbackCommentResponse;
import com.sgp.systemsgp.dto.feedback.FeedbackHistoryResponse;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.enums.FinalReportStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.FinalReport;
import com.sgp.systemsgp.model.FinalReportActivityWeek;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.FinalReportRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinalReportService {

    private static final List<FinalReportStatus> REVIEWER_VISIBLE_STATUSES =
            List.of(FinalReportStatus.SUBMITTED, FinalReportStatus.APPROVED);

    private final PracticeDocumentVersionService documentVersions;
    private final FinalReportRepository finalReportRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;
    private final InstitutionRepository institutionRepository;
    private final NotificationService notificationService;
    private final FeedbackCommentService feedbackCommentService;
    private final PdfExportService pdfExportService;
    private final CompletedActivityRecordRepository completedActivityRecordRepository;

    @Transactional
    public FinalReportResponse create(String username, CreateFinalReportRequest request,
            MultipartFile image) {
        var validatedImage = image == null ? null : EntityImageService.decode(image);
        FinalReportResponse created = create(username, request);
        FinalReport report = getReport(created.getId());
        report.setLetterheadImage(validatedImage);
        return mapToResponse(report);
    }

    @Transactional
    public FinalReportResponse update(Long id, String username, UpdateFinalReportRequest request,
            MultipartFile image) {
        var validatedImage = image == null ? null : EntityImageService.decode(image);
        update(id, username, request);
        FinalReport report = getReport(id);
        if (validatedImage != null) report.setLetterheadImage(validatedImage);
        return mapToResponse(report);
    }

    @Transactional
    public FinalReportResponse updateInstitutionalSection(Long id, String username,
            UpdateFinalReportInstitutionalSectionRequest request,
            MultipartFile image) {
        var validatedImage = image == null ? null : EntityImageService.decode(image);
        updateInstitutionalSection(id, username, request);
        FinalReport report = getReport(id);
        if (validatedImage != null) report.setLetterheadImage(validatedImage);
        return mapToResponse(report);
    }

    @Transactional
    public FinalReportResponse attachLegacyLetterhead(Long id, String username,
            MultipartFile image) {
        FinalReport report = getReport(id);
        validateInstitutionalTutorCanWork(report, getAccount(username));
        if (report.getStatus() != FinalReportStatus.APPROVED || report.getLetterheadImage() != null)
            throw new BadRequestException("Esta opción solo permite completar el membrete faltante de un L.3 ya aprobado");
        PracticeAccessService.requireOperationalEnrollment(report.getEnrollment());
        documentVersions.baseline(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,mapToResponse(report),null);
        report.setLetterheadImage(EntityImageService.decode(image));
        finalReportRepository.save(report);
        documentVersions.record(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,"LEGACY_LETTERHEAD_ATTACHED",mapToResponse(report),()->renderPdf(report.getId(),username,true));
        return mapToResponse(report);
    }

    public EntityImageService.ImageFile letterhead(Long id, String username) {
        FinalReport report = getReport(id);
        validateCanView(report, getAccount(username));
        if (report.getLetterheadImage() == null) throw new NotFoundException("El L.3 todavía no tiene membrete");
        return new EntityImageService.ImageFile(report.getLetterheadImage().getContentType(), report.getLetterheadImage().getData());
    }

    private Integer completedPracticeMinutes(FinalReport report) {
        if (report.getCompletedPracticeMinutes() != null) return report.getCompletedPracticeMinutes();
        if (report.getEnrollment() == null || report.getEnrollment().getId() == null) return null;
        return completedActivityRecordRepository.findByEnrollment_IdAndDeletedFalse(report.getEnrollment().getId())
                .map(CompletedActivityRecord::getTotalMinutes).orElse(null);
    }


    @Transactional
    public FinalReportResponse create(
            String username,
            CreateFinalReportRequest request) {

        Account student = getAccount(username);
        Enrollment enrollment = request.getEnrollmentId() != null
                ? getEnrollment(request.getEnrollmentId())
                : getDefaultEnrollment(student);

        validateStudentOwnsEnrollment(student, enrollment);
        validateEnrollmentApproved(enrollment);
        validateEnrollmentHasInstitutionalTutor(enrollment);

        if (finalReportRepository.existsByEnrollment_IdAndDeletedFalse(
                enrollment.getId())) {
            throw new BadRequestException(
                    "Ya existe un informe final para este curso");
        }

        Institution institution = resolveEducationalInstitution(
                enrollment,
                request.getEducationalInstitutionId());

        FinalReport report = FinalReport.builder()
                .enrollment(enrollment)
                .student(student)
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .status(FinalReportStatus.DRAFT)
                .build();

        applyCreateData(report, request, student, institution);

        finalReportRepository.save(report);

        return mapToResponse(report);
    }

    public List<FinalReportResponse> myReports(String username) {

        List<FinalReport> reports = finalReportRepository
                .findByStudent_UsernameAndDeletedFalse(username);

        return mapReportsToResponses(reports);
    }

    public List<ReviewableDocumentSummaryResponse> myReportSummaries(String username) {

        List<FinalReport> reports = finalReportRepository
                .findByStudent_UsernameAndDeletedFalse(username);

        return mapReportsToSummaries(reports);
    }

    public List<FinalReportResponse> practiceReviewQueue(String username) {

        List<FinalReport> reports = finalReportRepository
                .findByCourse_PracticeTutor_UsernameAndDeletedFalse(username)
                .stream()
                .filter(report -> isVisibleToReviewers(report.getStatus()))
                .toList();

        return mapReportsToResponses(reports);
    }

    public List<ReviewableDocumentSummaryResponse> practiceReviewQueueSummaries(String username) {

        List<FinalReport> reports = finalReportRepository
                .findByCourse_PracticeTutor_UsernameAndDeletedFalse(username)
                .stream()
                .filter(report -> isVisibleToReviewers(report.getStatus()))
                .toList();

        return mapReportsToSummaries(reports);
    }

    public List<FinalReportResponse> institutionalReviewQueue(String username) {

        Account account = getAccount(username);
        List<FinalReport> reports = new ArrayList<>();
        reports.addAll(finalReportRepository
                .findByEnrollment_Group_InstitutionalTutor_UsernameAndDeletedFalse(username));
        reports.addAll(finalReportRepository
                .findByCourse_InstitutionalTutor_UsernameAndDeletedFalse(username));

        Map<Long, FinalReport> uniqueReports = new LinkedHashMap<>();
        reports.forEach(report -> uniqueReports.putIfAbsent(report.getId(), report));

        List<FinalReport> visibleReports = uniqueReports
                .values()
                .stream()
                .filter(report -> isAssignedInstitutionalTutor(report, account))
                .filter(report -> isVisibleToReviewers(report.getStatus()))
                .toList();

        return mapReportsToResponses(visibleReports);
    }

    public List<ReviewableDocumentSummaryResponse> institutionalReviewQueueSummaries(String username) {

        Account account = getAccount(username);
        List<FinalReport> reports = new ArrayList<>();
        reports.addAll(finalReportRepository
                .findByEnrollment_Group_InstitutionalTutor_UsernameAndDeletedFalse(username));
        reports.addAll(finalReportRepository
                .findByCourse_InstitutionalTutor_UsernameAndDeletedFalse(username));

        Map<Long, FinalReport> uniqueReports = new LinkedHashMap<>();
        reports.forEach(report -> uniqueReports.putIfAbsent(report.getId(), report));

        List<FinalReport> visibleReports = uniqueReports
                .values()
                .stream()
                .filter(report -> isAssignedInstitutionalTutor(report, account))
                .filter(report -> isVisibleToReviewers(report.getStatus()))
                .toList();

        return mapReportsToSummaries(visibleReports);
    }

    public List<FinalReportResponse> submittedDocuments(String username) {

        Account account = getAccount(username);
        List<FinalReport> reports = finalReportRepository
                .findByStatusInAndDeletedFalse(REVIEWER_VISIBLE_STATUSES)
                .stream()
                .filter(report -> canViewDirectorQueue(report.getCourse(), account))
                .toList();

        return mapReportsToResponses(reports);
    }

    public List<ReviewableDocumentSummaryResponse> submittedDocumentSummaries(String username) {

        Account account = getAccount(username);
        List<FinalReport> reports = finalReportRepository
                .findByStatusInAndDeletedFalse(REVIEWER_VISIBLE_STATUSES)
                .stream()
                .filter(report -> canViewDirectorQueue(report.getCourse(), account))
                .toList();

        return mapReportsToSummaries(reports);
    }

    public FinalReportResponse getDefaults(
            String username,
            Long enrollmentId) {

        Account student = getAccount(username);
        Enrollment enrollment = enrollmentId != null
                ? getEnrollment(enrollmentId)
                : getDefaultEnrollment(student);

        validateStudentOwnsEnrollment(student, enrollment);
        validateEnrollmentApproved(enrollment);
        validateEnrollmentHasInstitutionalTutor(enrollment);

        Institution institution = resolveEducationalInstitution(
                enrollment,
                null);

        FinalReport report = FinalReport.builder()
                .enrollment(enrollment)
                .student(student)
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .status(FinalReportStatus.DRAFT)
                .build();

        copyInstitutionSnapshot(report, institution);
        copyStudentSnapshot(report, student);

        return mapToResponse(report);
    }

    public FinalReportResponse getById(
            Long id,
            String username) {

        FinalReport report = getReport(id);
        Account account = getAccount(username);

        validateCanView(report, account);

        return mapToResponse(report);
    }

    public byte[] exportApprovedPdf(Long id, String username) {
        var document=getById(id,username);
        validateApprovedForExport(document.getStatus());
        byte[] retained=documentVersions.retainedPdf(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,id);
        return retained==null?renderPdf(id,username,true):retained;
    }

    @Transactional
    public byte[] previewPdf(Long id, String username) {
        return PdfPreview.mark(renderPdf(id, username, false));
    }

    private byte[] renderPdf(Long id, String username, boolean requireApproved) {

        FinalReportResponse report = getById(id, username);
        if (requireApproved) validateApprovedForExport(report.getStatus());

        FinalReport entity = getReport(id);
        if (requireApproved && entity.getLetterheadImage() == null)
            throw new BadRequestException("El L.3 requiere un membrete institucional adjuntado en su formulario");
        Course course = entity.getCourse();
        List<PdfExportService.PdfField> general = new ArrayList<>(DocumentPdfData.institution(
                pdfExportService, entity.getEducationalInstitution(), report.getEducationalInstitutionName(),
                report.getEducationalInstitutionCode(), report.getEducationalInstitutionAddress(),
                DocumentPdfData.institutionalTutor(entity.getEnrollment()), false));
        general.add(pdfExportService.field("@subheading", "Datos del Estudiante"));
        general.add(pdfExportService.field("Estudiante", report.getStudentFullName()));
        general.add(pdfExportService.field("Cédula de Identidad", report.getStudentIdentification()));
        general.add(pdfExportService.field("Carrera", DocumentPdfData.career(course, entity.getStudent())));
        general.add(pdfExportService.field("Titulación", DocumentPdfData.degree(course, entity.getStudent())));
        general.add(pdfExportService.field("Ciclo", DocumentPdfData.cycle(course, entity.getStudent())));
        Integer minutes = completedPracticeMinutes(entity);
        general.add(pdfExportService.field("Número de horas realizadas", minutes == null ? null
                : String.format("%dh:%02d", minutes / 60, minutes % 60)));
        LocalDate date = entity.getReportDate() != null ? entity.getReportDate()
                : entity.getApprovedAt() == null ? null : entity.getApprovedAt().toLocalDate();
        return pdfExportService.createPdf("Informe final de prácticas preprofesionales", List.of(
                pdfExportService.section("Información general", general),
                pdfExportService.section("Antecedentes", List.of(pdfExportService.field("@paragraph", report.getAntecedents()))),
                pdfExportService.section("Objetivo", List.of(pdfExportService.field("@paragraph", report.getObjective()))),
                pdfExportService.sectionWithTables("Actividades", List.of(), List.of(activityWeeksTable(report.getActivityWeeks()))),
                pdfExportService.section("Conclusiones", List.of(
                        pdfExportService.field("@bullet", report.getConclusion1()),
                        pdfExportService.field("@bullet", report.getConclusion2()),
                        pdfExportService.field("@bullet", report.getConclusion3()))),
                pdfExportService.section("Recomendaciones", List.of(
                        pdfExportService.field("@bullet", report.getRecommendation1()),
                        pdfExportService.field("@bullet", report.getRecommendation2()),
                        pdfExportService.field("@bullet", report.getRecommendation3()))),
                pdfExportService.section("Firma tutor institucional", List.of(
                        pdfExportService.field("Fecha", date == null ? null : date.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))),
                        pdfExportService.field("Tutor Institucional", DocumentPdfData.name(DocumentPdfData.institutionalTutor(entity.getEnrollment()))),
                        pdfExportService.field("Rol", "TUTOR INSTITUCIONAL")))), entity.getLetterheadImage() == null ? null : entity.getLetterheadImage().getData());
    }

    @Transactional
    public FinalReportResponse update(
            Long id,
            String username,
            UpdateFinalReportRequest request) {

        FinalReport report = getReport(id);
        Account student = getAccount(username);

        validateStudentOwnsReport(student, report);
        validateEditable(report);
        documentVersions.baseline(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,mapToResponse(report),null);

        if (request.getEducationalInstitutionId() != null) {
            Institution institution = resolveEducationalInstitution(
                    report.getEnrollment(),
                    request.getEducationalInstitutionId());

            report.setEducationalInstitution(institution);
        }

        copyStudentSnapshot(report, student);
        copyInstitutionSnapshot(report, report.getEducationalInstitution());
        applyUpdateData(report, request);
        moveToDraftAfterStudentUpdate(report);

        finalReportRepository.save(report);

        return mapToResponse(report);
    }

    @Transactional
    public FinalReportResponse submit(
            Long id,
            String username) {

        FinalReport report = getReport(id);
        Account student = getAccount(username);

        validateStudentOwnsReport(student, report);
        validateEditable(report);
        documentVersions.baseline(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,mapToResponse(report),null);

        if (report.getStatus() != FinalReportStatus.SUBMITTED) {
            startNewReviewCycle(report);
        }
        report.setStatus(ReviewWorkflowStateMachine.transition(
                report.getStatus(),
                FinalReportStatus.SUBMITTED,
                "informe final"));
        report.setSubmittedAt(LocalDateTime.now());

        finalReportRepository.save(report);
        documentVersions.record(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,"SUBMITTED",mapToResponse(report),"APPROVED".equals(report.getStatus().name()) ? () -> renderPdf(report.getId(),username,true) : null);
        notificationService.notifyFinalReportSubmitted(report);

        return mapToResponse(report);
    }

    @Transactional
    public FinalReportResponse updateInstitutionalSection(
            Long id,
            String username,
            UpdateFinalReportInstitutionalSectionRequest request) {

        FinalReport report = getReport(id);
        Account tutor = getAccount(username);

        validateInstitutionalTutorCanWork(report, tutor);
        validateInstitutionalSectionEditable(report);
        documentVersions.baseline(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,mapToResponse(report),"APPROVED".equals(report.getStatus().name()) ? () -> renderPdf(report.getId(),username,true) : null);

        if (request.getCompletedHours() != null || request.getCompletedMinutes() != null) {
            Integer previous = completedPracticeMinutes(report);
            int hours = request.getCompletedHours() != null ? request.getCompletedHours() : previous == null ? 0 : previous / 60;
            int minutes = request.getCompletedMinutes() != null ? request.getCompletedMinutes() : previous == null ? 0 : previous % 60;
            if (hours < 0 || hours > 10000 || minutes < 0 || minutes > 59)
                throw new BadRequestException("Revisa las horas y minutos de práctica realizados");
            report.setCompletedPracticeMinutes(hours * 60 + minutes);
        }
        if (request.getReportDate() != null) report.setReportDate(request.getReportDate());
        setIfNotNull(request.getConclusion1(), report::setConclusion1);
        setIfNotNull(request.getConclusion2(), report::setConclusion2);
        setIfNotNull(request.getConclusion3(), report::setConclusion3);
        setIfNotNull(request.getRecommendation1(), report::setRecommendation1);
        setIfNotNull(request.getRecommendation2(), report::setRecommendation2);
        setIfNotNull(request.getRecommendation3(), report::setRecommendation3);
        resetReviewDecision(report);

        finalReportRepository.save(report);
        documentVersions.record(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,"INSTITUTIONAL_SECTION",mapToResponse(report),"APPROVED".equals(report.getStatus().name()) ? () -> renderPdf(report.getId(),username,true) : null);

        return mapToResponse(report);
    }

    @Transactional
    public FinalReportResponse reviewByPracticeTutor(
            Long id,
            String username,
            ReviewFinalReportRequest request) {

        FinalReport report = getReport(id);
        Account tutor = getAccount(username);

        validatePracticeTutorCanReview(report, tutor);
        validateReviewable(report);
        documentVersions.baseline(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,mapToResponse(report),"APPROVED".equals(report.getStatus().name()) ? () -> renderPdf(report.getId(),username,true) : null);

        if (Boolean.TRUE.equals(request.getApproved())) {
            validateInstitutionalSectionComplete(report);
        }

        applyPracticeFeedback(report, request);
        savePracticeFeedbackComments(report, request, tutor);

        if (request.getApproved() != null) {
            report.setPracticeTutorApproved(request.getApproved());
            report.setPracticeReviewedBy(tutor);
            report.setPracticeReviewedAt(LocalDateTime.now());
            applyFinalDecision(report, request.getApproved());
        } else if (hasReviewFeedback(request)) {
            report.setPracticeReviewedBy(tutor);
            report.setPracticeReviewedAt(LocalDateTime.now());
        }

        finalReportRepository.save(report);
        documentVersions.record(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,"REVIEWED",mapToResponse(report),"APPROVED".equals(report.getStatus().name()) ? () -> renderPdf(report.getId(),username,true) : null);

        if (request.getApproved() != null) {
            notificationService.notifyFinalReportReviewedByPracticeTutor(report);
        } else {
            notificationService.notifyFinalReportFeedbackAdded(report, tutor);
        }

        return mapToResponse(report);
    }

    @Transactional
    public FinalReportResponse reviewByDirector(
            Long id,
            String username,
            ReviewFinalReportRequest request) {

        FinalReport report = getReport(id);
        Account director = getAccount(username);

        validateDirectorCanReview(report, director);
        validateReviewable(report);
        documentVersions.baseline(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,mapToResponse(report),"APPROVED".equals(report.getStatus().name()) ? () -> renderPdf(report.getId(),username,true) : null);
        applyDirectorFeedback(report, request);
        saveDirectorFeedbackComments(report, request, director);

        if (request.getApproved() != null) {
            report.setDirectorApproved(request.getApproved());
            report.setDirectorReviewedBy(director);
            report.setDirectorReviewedAt(LocalDateTime.now());
            applyFinalDecision(report, request.getApproved());
        } else if (hasReviewFeedback(request)) {
            report.setDirectorReviewedBy(director);
            report.setDirectorReviewedAt(LocalDateTime.now());
        }

        finalReportRepository.save(report);
        documentVersions.record(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,"REVIEWED",mapToResponse(report),"APPROVED".equals(report.getStatus().name()) ? () -> renderPdf(report.getId(),username,true) : null);

        if (request.getApproved() != null) {
            notificationService.notifyFinalReportReviewedByDirector(report);
        } else {
            notificationService.notifyFinalReportFeedbackAdded(report, director);
        }

        return mapToResponse(report);
    }

    @Transactional
    public FinalReportResponse reviewByInstitutionalTutor(
            Long id,
            String username,
            ReviewFinalReportRequest request) {

        FinalReport report = getReport(id);
        Account tutor = getAccount(username);

        validateInstitutionalTutorCanWork(report, tutor);
        validateReviewable(report);
        documentVersions.baseline(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,mapToResponse(report),"APPROVED".equals(report.getStatus().name()) ? () -> renderPdf(report.getId(),username,true) : null);

        if (Boolean.TRUE.equals(request.getApproved())) {
            validateInstitutionalSectionComplete(report);
        }

        applyInstitutionalFeedback(report, request);
        saveInstitutionalFeedbackComments(report, request, tutor);

        if (request.getApproved() != null) {
            report.setInstitutionalTutorApproved(request.getApproved());
            report.setInstitutionalReviewedBy(tutor);
            report.setInstitutionalReviewedAt(LocalDateTime.now());
            applyFinalDecision(report, request.getApproved());
        } else if (hasReviewFeedback(request)) {
            report.setInstitutionalReviewedBy(tutor);
            report.setInstitutionalReviewedAt(LocalDateTime.now());
        }

        finalReportRepository.save(report);
        documentVersions.record(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L3,report.getId(),report.getEnrollment(),username,"REVIEWED",mapToResponse(report),"APPROVED".equals(report.getStatus().name()) ? () -> renderPdf(report.getId(),username,true) : null);

        if (request.getApproved() != null) {
            notificationService.notifyFinalReportReviewedByInstitutionalTutor(report);
        } else {
            notificationService.notifyFinalReportFeedbackAdded(report, tutor);
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
                        "Inscripcion no encontrada"));
    }

    private Enrollment getDefaultEnrollment(Account student) {
        var choices = enrollmentRepository.findByAccount_UsernameAndStatusAndCourse_ActiveTrueAndCourse_DeletedFalse(
                student.getUsername(), EnrollmentStatus.APPROVED);
        if (choices.isEmpty()) throw new BadRequestException("No tienes ninguna inscripcion aprobada para crear el informe final");
        if (choices.size() > 1) throw new BadRequestException("Tienes varias prácticas activas. Selecciona la práctica correspondiente antes de continuar.");
        return choices.get(0);
    }

    private FinalReport getReport(Long id) {

        return finalReportRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Informe final no encontrado"));
    }

    private Institution getInstitution(Long id) {

        return institutionRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Institucion educativa no encontrada"));
    }

    private void validateStudentOwnsEnrollment(
            Account student,
            Enrollment enrollment) {

        if (!enrollment.getAccount().getId().equals(student.getId())) {
            throw new AccessDeniedException(
                    "No puedes crear informes finales para otra inscripcion");
        }
    }

    private void validateStudentOwnsReport(
            Account student,
            FinalReport report) {

        if (!report.getStudent().getId().equals(student.getId())) {
            throw new AccessDeniedException(
                    "No puedes modificar este informe final");
        }
    }

    private void validateEnrollmentApproved(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException(
                    "Solo se puede crear el informe final de una inscripcion aprobada");
        }
        PracticeAccessService.requireOperationalEnrollment(enrollment);


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

    private void validateEnrollmentHasInstitutionalTutor(Enrollment enrollment) {

        Account tutor = InstitutionalAssignmentResolver.institutionalTutor(enrollment);

        if (tutor == null) {
            throw new BadRequestException(
                    "La inscripción debe estar asignada a un grupo con tutor institucional");
        }

        if (!hasRole(tutor, RoleName.ROLE_TUTOR_INSTITUCIONAL)) {
            throw new BadRequestException(
                    "El tutor institucional asignado no tiene el rol requerido");
        }
    }

    private void validateCanView(
            FinalReport report,
            Account account) {

        if (report.getStudent().getId().equals(account.getId())) {
            return;
        }

        if (isVisibleToReviewers(report.getStatus())
                && (isAssignedPracticeTutor(report, account)
                || isAssignedInstitutionalTutor(report, account)
                || hasRole(account, RoleName.ROLE_ADMIN)
                || isDirectorForCourse(report.getCourse(), account))) {
            return;
        }

        throw new AccessDeniedException(
                "No puedes ver este informe final");
    }

    private boolean isVisibleToReviewers(FinalReportStatus status) {

        return REVIEWER_VISIBLE_STATUSES.contains(status);
    }

    private void validatePracticeTutorCanReview(
            FinalReport report,
            Account tutor) {

        if (!hasRole(tutor, RoleName.ROLE_TUTOR_PRACTICAS)
                || !isAssignedPracticeTutor(report, tutor)) {
            throw new AccessDeniedException(
                    "Solo el tutor de practicas asignado puede revisar este informe final");
        }
    }

    private void validateInstitutionalTutorCanWork(
            FinalReport report,
            Account tutor) {

        if (!hasRole(tutor, RoleName.ROLE_TUTOR_INSTITUCIONAL)
                || !isAssignedInstitutionalTutor(report, tutor)) {
            throw new AccessDeniedException(
                    "Solo el tutor institucional asignado puede trabajar este informe final");
        }
    }

    private void validateDirectorCanReview(
            FinalReport report,
            Account director) {

        if (!isDirectorForCourse(report.getCourse(), director)) {
            throw new AccessDeniedException(
                    "Solo el director de practicas puede revisar este informe final");
        }
    }

    private boolean isAssignedPracticeTutor(
            FinalReport report,
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

    private boolean isAssignedInstitutionalTutor(
            FinalReport report,
            Account account) {

        return InstitutionalAssignmentResolver.isAssignedInstitutionalTutor(
                report.getEnrollment(),
                account);
    }

    private boolean hasRole(
            Account account,
            RoleName roleName) {

        return account.getRoles()
                .stream()
                .anyMatch(role -> roleName.name().equals(role.getName()));
    }

    private void validateEditable(FinalReport report) {
        PracticeAccessService.requireOperationalEnrollment(report.getEnrollment());

        ReviewWorkflowStateMachine.ensureEditable(
                report.getStatus(),
                "No se puede editar un informe final aprobado");
    }

    private void moveToDraftAfterStudentUpdate(FinalReport report) {

        if (report.getStatus() == FinalReportStatus.SUBMITTED) {
            report.setStatus(ReviewWorkflowStateMachine.transition(
                    report.getStatus(),
                    FinalReportStatus.DRAFT,
                    "informe final"));
            report.setSubmittedAt(null);
            resetReviewDecision(report);
        }
    }

    private void validateInstitutionalSectionEditable(FinalReport report) {
        PracticeAccessService.requireOperationalEnrollment(report.getEnrollment());

        ReviewWorkflowStateMachine.ensureEditable(
                report.getStatus(),
                "No se puede editar un informe final aprobado");

        ReviewWorkflowStateMachine.ensureReviewable(
                report.getStatus(),
                "El estudiante debe enviar el informe final antes de completar conclusiones y recomendaciones");
    }

    private void validateReviewable(FinalReport report) {
        PracticeAccessService.requireOperationalEnrollment(report.getEnrollment());

        ReviewWorkflowStateMachine.ensureReviewable(
                report.getStatus(),
                "Solo se pueden revisar informes finales enviados");
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
                    "La institucion educativa no esta activa");
        }

        if (institution.getType() != InstitutionType.ESCUELA
                && institution.getType() != InstitutionType.COLEGIO) {
            throw new BadRequestException(
                    "La institucion educativa debe ser escuela o colegio");
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
                    "La institucion educativa debe coincidir con el tutor institucional del curso");
        }
    }

    private void applyCreateData(
            FinalReport report,
            CreateFinalReportRequest request,
            Account student,
            Institution institution) {

        copyInstitutionSnapshot(report, institution);
        copyStudentSnapshot(report, student);

        report.setAntecedents(request.getAntecedents());
        report.setObjective(request.getObjective());

        replaceActivityWeeks(report, request.getActivityWeeks());
    }

    private void applyUpdateData(
            FinalReport report,
            UpdateFinalReportRequest request) {

        setIfNotNull(request.getAntecedents(), report::setAntecedents);
        setIfNotNull(request.getObjective(), report::setObjective);

        if (request.getActivityWeeks() != null) {
            replaceActivityWeeks(report, request.getActivityWeeks());
        }
    }

    private void copyInstitutionSnapshot(
            FinalReport report,
            Institution institution) {

        report.setEducationalInstitutionName(institution.getName());
        report.setEducationalInstitutionCode(institution.getCode());
        report.setEducationalInstitutionAddress(institution.getAddress());
        report.setEducationalInstitutionPhone(institution.getPhone());
        report.setEducationalInstitutionEmail(institution.getEmail());
    }

    private void copyStudentSnapshot(
            FinalReport report,
            Account student) {

        Person person = student.getPerson();

        if (person == null) {
            return;
        }

        report.setStudentFullName(joinNames(
                person.getNames(),
                person.getLastNames()));
        report.setStudentIdentification(person.getCedula());
        report.setStudentEmail(person.getInstitutionalEmail());
        report.setStudentPhone(person.getPhone());
    }

    private void replaceActivityWeeks(
            FinalReport report,
            List<FinalReportActivityWeekRequest> weeks) {

        report.getActivityWeeks().clear();

        if (weeks == null) {
            return;
        }

        for (FinalReportActivityWeekRequest weekRequest : weeks) {
            FinalReportActivityWeek week = FinalReportActivityWeek.builder()
                    .report(report)
                    .weekNumber(weekRequest.getWeekNumber())
                    .startDate(activityWeekStartDate(report.getEnrollment(), weekRequest.getWeekNumber(), weekRequest.getStartDate()))
                    .endDate(activityWeekEndDate(report.getEnrollment(), weekRequest.getWeekNumber(), weekRequest.getEndDate()))
                    .activities(weekRequest.getActivities())
                    .build();

            report.getActivityWeeks().add(week);
        }
    }

    private LocalDate activityWeekStartDate(
            Enrollment enrollment,
            Integer weekNumber,
            LocalDate providedDate) {

        if (providedDate != null) {
            return providedDate;
        }

        return defaultActivityWeekStartDate(enrollment, weekNumber);
    }

    private LocalDate activityWeekEndDate(
            Enrollment enrollment,
            Integer weekNumber,
            LocalDate providedDate) {

        if (providedDate != null) {
            return providedDate;
        }

        return defaultActivityWeekEndDate(enrollment, weekNumber);
    }

    private LocalDate defaultActivityWeekStartDate(
            Enrollment enrollment,
            Integer weekNumber) {

        if (enrollment == null || PracticePeriod.start(enrollment) == null) {
            return null;
        }

        return PracticePeriod.start(enrollment)
                .toLocalDate()
                .plusDays((long) (weekNumber == null ? 0 : Math.max(weekNumber - 1, 0)) * 7L);
    }

    private LocalDate defaultActivityWeekEndDate(
            Enrollment enrollment,
            Integer weekNumber) {

        LocalDate startDate = defaultActivityWeekStartDate(enrollment, weekNumber);

        if (startDate == null) {
            return null;
        }

        LocalDate endDate = startDate.plusDays(4);

        return PracticePeriod.end(enrollment) != null
                && endDate.isAfter(PracticePeriod.end(enrollment).toLocalDate())
                        ? PracticePeriod.end(enrollment).toLocalDate()
                        : endDate;
    }

    private void validateStudentSectionComplete(FinalReport report) {

        requireText(report.getEducationalInstitutionName(),
                "Datos de la institucion educativa incompletos");
        requireText(report.getStudentFullName(),
                "Datos del estudiante incompletos");
        requireText(report.getAntecedents(),
                "Los antecedentes son obligatorios");
        requireText(report.getObjective(),
                "El objetivo es obligatorio");
        validateActivityWeeks(report);
    }

    private void validateActivityWeeks(FinalReport report) {

        if (report.getActivityWeeks().isEmpty()) {
            throw new BadRequestException(
                    "Debe registrar al menos una semana de actividades");
        }

        for (FinalReportActivityWeek week : report.getActivityWeeks()) {
            if (week.getWeekNumber() == null
                    || week.getStartDate() == null
                    || week.getEndDate() == null
                    || !hasText(week.getActivities())) {
                throw new BadRequestException(
                        "Todas las semanas deben tener numero, fechas y actividades");
            }

            validateDateRange(week.getStartDate(), week.getEndDate());
        }
    }

    private void validateInstitutionalSectionComplete(FinalReport report) {
        if (report.getLetterheadImage() == null)
            throw new BadRequestException("Adjunta el membrete institucional como imagen en el formulario L.3 antes de aprobar");
        if (completedPracticeMinutes(report) == null)
            throw new BadRequestException("Registra las horas y minutos realizados en el formulario L.3 o completa el registro L.6");
        if (report.getCompletedPracticeMinutes() == null) report.setCompletedPracticeMinutes(completedPracticeMinutes(report));


        requireText(report.getConclusion1(),
                "La conclusion 1 es obligatoria");
        requireText(report.getConclusion2(),
                "La conclusion 2 es obligatoria");
        requireText(report.getConclusion3(),
                "La conclusion 3 es obligatoria");
        requireText(report.getRecommendation1(),
                "La recomendacion 1 es obligatoria");
        requireText(report.getRecommendation2(),
                "La recomendacion 2 es obligatoria");
        requireText(report.getRecommendation3(),
                "La recomendacion 3 es obligatoria");
    }

    private void validateDateRange(
            LocalDate startDate,
            LocalDate endDate) {

        if (endDate.isBefore(startDate)) {
            throw new BadRequestException(
                    "La fecha final de una semana no puede ser anterior a la fecha inicial");
        }
    }

    private void applyFinalDecision(
            FinalReport report,
            boolean approved) {

        if (!approved) {
            sendBackForCorrection(report);
            return;
        }

        if (report.isPracticeTutorApproved()
                && report.isInstitutionalTutorApproved()
                && report.isDirectorApproved()) {
            report.setStatus(ReviewWorkflowStateMachine.transition(
                    report.getStatus(),
                    FinalReportStatus.APPROVED,
                    "informe final"));
            report.setApprovedAt(LocalDateTime.now());
            return;
        }

        report.setStatus(ReviewWorkflowStateMachine.transition(
                report.getStatus(),
                FinalReportStatus.SUBMITTED,
                "informe final"));
        report.setApprovedAt(null);
    }

    private void sendBackForCorrection(FinalReport report) {

        report.setStatus(ReviewWorkflowStateMachine.transition(
                report.getStatus(),
                FinalReportStatus.NEEDS_CORRECTION,
                "informe final"));
        report.setPracticeTutorApproved(false);
        report.setInstitutionalTutorApproved(false);
        report.setDirectorApproved(false);
        report.setApprovedAt(null);
    }

    private void resetReviewDecision(FinalReport report) {

        report.setPracticeTutorApproved(false);
        report.setInstitutionalTutorApproved(false);
        report.setDirectorApproved(false);
        report.setPracticeReviewedBy(null);
        report.setInstitutionalReviewedBy(null);
        report.setDirectorReviewedBy(null);
        report.setPracticeReviewedAt(null);
        report.setInstitutionalReviewedAt(null);
        report.setDirectorReviewedAt(null);
        report.setApprovedAt(null);
        clearReviewFeedback(report);
        feedbackCommentService.clearDocumentFeedback(
                FeedbackDocumentType.FINAL_REPORT,
                report.getId());
    }

    private void startNewReviewCycle(FinalReport report) {

        resetReviewDecision(report);
        report.setReviewCycle(ReviewWorkflowStateMachine.nextCycle(report.getReviewCycle()));
    }

    private void clearReviewFeedback(FinalReport report) {

        report.setPracticeGeneralInfoFeedback(null);
        report.setPracticeAntecedentsFeedback(null);
        report.setPracticeObjectiveFeedback(null);
        report.setPracticeActivitiesFeedback(null);
        report.setPracticeConclusionsFeedback(null);
        report.setPracticeRecommendationsFeedback(null);
        report.setPracticeApprovalFeedback(null);
        report.setInstitutionalGeneralInfoFeedback(null);
        report.setInstitutionalAntecedentsFeedback(null);
        report.setInstitutionalObjectiveFeedback(null);
        report.setInstitutionalActivitiesFeedback(null);
        report.setInstitutionalConclusionsFeedback(null);
        report.setInstitutionalRecommendationsFeedback(null);
        report.setInstitutionalApprovalFeedback(null);
        report.setDirectorGeneralInfoFeedback(null);
        report.setDirectorAntecedentsFeedback(null);
        report.setDirectorObjectiveFeedback(null);
        report.setDirectorActivitiesFeedback(null);
        report.setDirectorConclusionsFeedback(null);
        report.setDirectorRecommendationsFeedback(null);
        report.setDirectorApprovalFeedback(null);
    }

    private void applyPracticeFeedback(
            FinalReport report,
            ReviewFinalReportRequest request) {

        setIfNotNull(request.getGeneralInfoFeedback(), report::setPracticeGeneralInfoFeedback);
        setIfNotNull(request.getAntecedentsFeedback(), report::setPracticeAntecedentsFeedback);
        setIfNotNull(request.getObjectiveFeedback(), report::setPracticeObjectiveFeedback);
        setIfNotNull(request.getActivitiesFeedback(), report::setPracticeActivitiesFeedback);
        setIfNotNull(request.getConclusionsFeedback(), report::setPracticeConclusionsFeedback);
        setIfNotNull(request.getRecommendationsFeedback(), report::setPracticeRecommendationsFeedback);
        setIfNotNull(request.getApprovalFeedback(), report::setPracticeApprovalFeedback);
    }

    private boolean hasReviewFeedback(ReviewFinalReportRequest request) {
        return request.getGeneralInfoFeedback() != null
                || request.getAntecedentsFeedback() != null
                || request.getObjectiveFeedback() != null
                || request.getActivitiesFeedback() != null
                || request.getConclusionsFeedback() != null
                || request.getRecommendationsFeedback() != null
                || request.getApprovalFeedback() != null;
    }

    private void savePracticeFeedbackComments(
            FinalReport report,
            ReviewFinalReportRequest request,
            Account reviewer) {

        saveDocumentFeedback(report, "practiceGeneralInfoFeedback", request.getGeneralInfoFeedback(), reviewer);
        saveDocumentFeedback(report, "practiceAntecedentsFeedback", request.getAntecedentsFeedback(), reviewer);
        saveDocumentFeedback(report, "practiceObjectiveFeedback", request.getObjectiveFeedback(), reviewer);
        saveDocumentFeedback(report, "practiceActivitiesFeedback", request.getActivitiesFeedback(), reviewer);
        saveDocumentFeedback(report, "practiceConclusionsFeedback", request.getConclusionsFeedback(), reviewer);
        saveDocumentFeedback(report, "practiceRecommendationsFeedback", request.getRecommendationsFeedback(), reviewer);
        saveDocumentFeedback(report, "practiceApprovalFeedback", request.getApprovalFeedback(), reviewer);
    }

    private void saveInstitutionalFeedbackComments(
            FinalReport report,
            ReviewFinalReportRequest request,
            Account reviewer) {

        saveDocumentFeedback(report, "institutionalGeneralInfoFeedback", request.getGeneralInfoFeedback(), reviewer);
        saveDocumentFeedback(report, "institutionalAntecedentsFeedback", request.getAntecedentsFeedback(), reviewer);
        saveDocumentFeedback(report, "institutionalObjectiveFeedback", request.getObjectiveFeedback(), reviewer);
        saveDocumentFeedback(report, "institutionalActivitiesFeedback", request.getActivitiesFeedback(), reviewer);
        saveDocumentFeedback(report, "institutionalConclusionsFeedback", request.getConclusionsFeedback(), reviewer);
        saveDocumentFeedback(report, "institutionalRecommendationsFeedback", request.getRecommendationsFeedback(), reviewer);
        saveDocumentFeedback(report, "institutionalApprovalFeedback", request.getApprovalFeedback(), reviewer);
    }

    private void saveDirectorFeedbackComments(
            FinalReport report,
            ReviewFinalReportRequest request,
            Account reviewer) {

        saveDocumentFeedback(report, "directorGeneralInfoFeedback", request.getGeneralInfoFeedback(), reviewer);
        saveDocumentFeedback(report, "directorAntecedentsFeedback", request.getAntecedentsFeedback(), reviewer);
        saveDocumentFeedback(report, "directorObjectiveFeedback", request.getObjectiveFeedback(), reviewer);
        saveDocumentFeedback(report, "directorActivitiesFeedback", request.getActivitiesFeedback(), reviewer);
        saveDocumentFeedback(report, "directorConclusionsFeedback", request.getConclusionsFeedback(), reviewer);
        saveDocumentFeedback(report, "directorRecommendationsFeedback", request.getRecommendationsFeedback(), reviewer);
        saveDocumentFeedback(report, "directorApprovalFeedback", request.getApprovalFeedback(), reviewer);
    }

    private void saveDocumentFeedback(
            FinalReport report,
            String sectionKey,
            String message,
            Account reviewer) {

        feedbackCommentService.upsertDocumentFeedback(
                FeedbackDocumentType.FINAL_REPORT,
                report.getId(),
                sectionKey,
                message,
                reviewer,
                report.getReviewCycle());
    }

    private void applyInstitutionalFeedback(
            FinalReport report,
            ReviewFinalReportRequest request) {

        setIfNotNull(request.getGeneralInfoFeedback(), report::setInstitutionalGeneralInfoFeedback);
        setIfNotNull(request.getAntecedentsFeedback(), report::setInstitutionalAntecedentsFeedback);
        setIfNotNull(request.getObjectiveFeedback(), report::setInstitutionalObjectiveFeedback);
        setIfNotNull(request.getActivitiesFeedback(), report::setInstitutionalActivitiesFeedback);
        setIfNotNull(request.getConclusionsFeedback(), report::setInstitutionalConclusionsFeedback);
        setIfNotNull(request.getRecommendationsFeedback(), report::setInstitutionalRecommendationsFeedback);
        setIfNotNull(request.getApprovalFeedback(), report::setInstitutionalApprovalFeedback);
    }

    private void applyDirectorFeedback(
            FinalReport report,
            ReviewFinalReportRequest request) {

        setIfNotNull(request.getGeneralInfoFeedback(), report::setDirectorGeneralInfoFeedback);
        setIfNotNull(request.getAntecedentsFeedback(), report::setDirectorAntecedentsFeedback);
        setIfNotNull(request.getObjectiveFeedback(), report::setDirectorObjectiveFeedback);
        setIfNotNull(request.getActivitiesFeedback(), report::setDirectorActivitiesFeedback);
        setIfNotNull(request.getConclusionsFeedback(), report::setDirectorConclusionsFeedback);
        setIfNotNull(request.getRecommendationsFeedback(), report::setDirectorRecommendationsFeedback);
        setIfNotNull(request.getApprovalFeedback(), report::setDirectorApprovalFeedback);
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
            Consumer<String> setter) {

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

        if (!FinalReportStatus.APPROVED.name().equals(status)) {
            throw new BadRequestException(
                    "Solo se pueden exportar documentos aprobados");
        }
    }

    private PdfExportService.PdfWeekTable activityWeeksTable(List<FinalReportActivityWeekResponse> weeks) {

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

    private List<ReviewableDocumentSummaryResponse> mapReportsToSummaries(List<FinalReport> reports) {

        return reports.stream()
                .map(this::mapToSummary)
                .toList();
    }

    private ReviewableDocumentSummaryResponse mapToSummary(FinalReport report) {

        Course course = report.getCourse();
        Account institutionalTutor = institutionalTutorFor(
                report.getEnrollment(),
                course);

        return ReviewableDocumentSummaryResponse.builder()
                .id(report.getId())
                .documentType("FINAL_REPORT")
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
                .institutionalTutorApproved(report.isInstitutionalTutorApproved())
                .directorApproved(report.isDirectorApproved())
                .practiceReviewedBy(accountUsername(report.getPracticeReviewedBy()))
                .practiceReviewedByName(accountFullName(report.getPracticeReviewedBy()))
                .institutionalReviewedBy(accountUsername(report.getInstitutionalReviewedBy()))
                .institutionalReviewedByName(accountFullName(report.getInstitutionalReviewedBy()))
                .directorReviewedBy(accountUsername(report.getDirectorReviewedBy()))
                .directorReviewedByName(accountFullName(report.getDirectorReviewedBy()))
                .submittedAt(report.getSubmittedAt())
                .practiceReviewedAt(report.getPracticeReviewedAt())
                .institutionalReviewedAt(report.getInstitutionalReviewedAt())
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

    private List<FinalReportResponse> mapReportsToResponses(List<FinalReport> reports) {

        Map<Long, List<FeedbackCommentResponse>> feedbackByDocumentId =
                feedbackCommentService.listResponsesByDocumentId(
                        FeedbackDocumentType.FINAL_REPORT,
                        reports.stream().map(FinalReport::getId).toList());
        Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId =
                feedbackCommentService.listHistoryResponsesByDocumentId(
                        FeedbackDocumentType.FINAL_REPORT,
                        reports.stream().map(FinalReport::getId).toList());

        return reports.stream()
                .map(report -> mapToResponse(
                        report,
                        feedbackByDocumentId,
                        historyByDocumentId))
                .toList();
    }

    private FinalReportResponse mapToResponse(FinalReport report) {
        return mapToResponse(report, null, null);
    }

    private FinalReportResponse mapToResponse(
            FinalReport report,
            Map<Long, List<FeedbackCommentResponse>> feedbackByDocumentId,
            Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId) {

        Integer minutes = completedPracticeMinutes(report);
        return FinalReportResponse.builder()
                .letterheadImageUrl(report.getLetterheadImage() == null ? null : "/api/final-reports/" + report.getId() + "/letterhead")
                .completedHours(minutes == null ? null : minutes / 60)
                .completedMinutes(minutes == null ? null : minutes % 60)
                .reportDate(report.getReportDate())
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
                .studentFullName(report.getStudentFullName())
                .studentIdentification(report.getStudentIdentification())
                .studentEmail(report.getStudentEmail())
                .studentPhone(report.getStudentPhone())
                .antecedents(report.getAntecedents())
                .objective(report.getObjective())
                .activityWeeks(mapWeeks(report))
                .conclusion1(report.getConclusion1())
                .conclusion2(report.getConclusion2())
                .conclusion3(report.getConclusion3())
                .recommendation1(report.getRecommendation1())
                .recommendation2(report.getRecommendation2())
                .recommendation3(report.getRecommendation3())
                .practiceGeneralInfoFeedback(report.getPracticeGeneralInfoFeedback())
                .practiceAntecedentsFeedback(report.getPracticeAntecedentsFeedback())
                .practiceObjectiveFeedback(report.getPracticeObjectiveFeedback())
                .practiceActivitiesFeedback(report.getPracticeActivitiesFeedback())
                .practiceConclusionsFeedback(report.getPracticeConclusionsFeedback())
                .practiceRecommendationsFeedback(report.getPracticeRecommendationsFeedback())
                .practiceApprovalFeedback(report.getPracticeApprovalFeedback())
                .institutionalGeneralInfoFeedback(report.getInstitutionalGeneralInfoFeedback())
                .institutionalAntecedentsFeedback(report.getInstitutionalAntecedentsFeedback())
                .institutionalObjectiveFeedback(report.getInstitutionalObjectiveFeedback())
                .institutionalActivitiesFeedback(report.getInstitutionalActivitiesFeedback())
                .institutionalConclusionsFeedback(report.getInstitutionalConclusionsFeedback())
                .institutionalRecommendationsFeedback(report.getInstitutionalRecommendationsFeedback())
                .institutionalApprovalFeedback(report.getInstitutionalApprovalFeedback())
                .directorGeneralInfoFeedback(report.getDirectorGeneralInfoFeedback())
                .directorAntecedentsFeedback(report.getDirectorAntecedentsFeedback())
                .directorObjectiveFeedback(report.getDirectorObjectiveFeedback())
                .directorActivitiesFeedback(report.getDirectorActivitiesFeedback())
                .directorConclusionsFeedback(report.getDirectorConclusionsFeedback())
                .directorRecommendationsFeedback(report.getDirectorRecommendationsFeedback())
                .directorApprovalFeedback(report.getDirectorApprovalFeedback())
                .feedbackComments(resolveFeedbackComments(
                        report.getId(),
                        feedbackByDocumentId))
                .feedbackHistory(resolveFeedbackHistory(
                        report.getId(),
                        historyByDocumentId))
                .status(report.getStatus().name())
                .reviewCycle(report.getReviewCycle())
                .practiceTutorApproved(report.isPracticeTutorApproved())
                .institutionalTutorApproved(report.isInstitutionalTutorApproved())
                .directorApproved(report.isDirectorApproved())
                .practiceReviewedBy(
                        report.getPracticeReviewedBy() != null
                                ? report.getPracticeReviewedBy().getUsername()
                                : null)
                .practiceReviewedByName(accountFullName(report.getPracticeReviewedBy()))
                .institutionalReviewedBy(
                        report.getInstitutionalReviewedBy() != null
                                ? report.getInstitutionalReviewedBy().getUsername()
                                : null)
                .institutionalReviewedByName(accountFullName(report.getInstitutionalReviewedBy()))
                .directorReviewedBy(
                        report.getDirectorReviewedBy() != null
                                ? report.getDirectorReviewedBy().getUsername()
                                : null)
                .directorReviewedByName(accountFullName(report.getDirectorReviewedBy()))
                .submittedAt(report.getSubmittedAt())
                .practiceReviewedAt(report.getPracticeReviewedAt())
                .institutionalReviewedAt(report.getInstitutionalReviewedAt())
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
                FeedbackDocumentType.FINAL_REPORT,
                documentId);
    }

    private List<FeedbackHistoryResponse> resolveFeedbackHistory(
            Long documentId,
            Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId) {

        if (historyByDocumentId != null) {
            return historyByDocumentId.getOrDefault(documentId, List.of());
        }

        return feedbackCommentService.listHistoryResponses(
                FeedbackDocumentType.FINAL_REPORT,
                documentId);
    }

    private List<FinalReportActivityWeekResponse> mapWeeks(FinalReport report) {

        return report.getActivityWeeks()
                .stream()
                .sorted(Comparator.comparing(
                        FinalReportActivityWeek::getWeekNumber,
                        Comparator.nullsLast(Integer::compareTo)))
                .map(week -> FinalReportActivityWeekResponse.builder()
                        .id(week.getId())
                        .weekNumber(week.getWeekNumber())
                        .startDate(activityWeekStartDate(report.getEnrollment(), week.getWeekNumber(), week.getStartDate()))
                        .endDate(activityWeekEndDate(report.getEnrollment(), week.getWeekNumber(), week.getEndDate()))
                        .activities(week.getActivities())
                        .build())
                .toList();
    }
}
