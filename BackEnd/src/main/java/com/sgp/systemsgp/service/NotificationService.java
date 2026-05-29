package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.notification.CreateAnnouncementRequest;
import com.sgp.systemsgp.dto.notification.NotificationResponse;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.ActivityPlan;
import com.sgp.systemsgp.model.CompletedActivityRecord;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.FinalReport;
import com.sgp.systemsgp.model.Notification;
import com.sgp.systemsgp.model.PracticeReport;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.NotificationRepository;
import com.sgp.systemsgp.websocket.NotificationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private static final List<String> DOCUMENT_MANAGER_ROLES =
            List.of("ROLE_ADMIN", "ROLE_DIRECTOR_PRACTICAS");

    private final NotificationRepository notificationRepository;
    private final AccountRepository accountRepository;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    public List<NotificationResponse> getMyNotifications(String username) {
        return notificationRepository
                .findTop20ByRecipient_UsernameAndRecipient_DeletedFalseOrderByCreatedAtDesc(username)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(String username) {
        return notificationRepository.countByRecipient_UsernameAndReadFalseAndRecipient_DeletedFalse(username);
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, String username) {
        Notification notification = notificationRepository
                .findByIdAndRecipient_Username(id, username)
                .orElseThrow(() -> new NotFoundException("Notificación no encontrada"));

        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }

        return mapToResponse(notification);
    }

    @Transactional
    public void markAllAsRead(String username) {
        notificationRepository.markAllAsRead(username);
    }

    @Transactional
    public int sendAnnouncement(CreateAnnouncementRequest request) {
        List<String> roles = normalizeRoles(request.getRoles());
        List<Account> recipients = roles.isEmpty()
                ? accountRepository.findByDeletedFalseAndEnabledTrueAndLockedFalse()
                : accountRepository.findActiveAnnouncementRecipientsByRoleNames(roles);

        String title = request.getTitle().trim();
        String message = request.getMessage().trim();
        String link = normalizeLink(request.getLink());

        recipients.forEach(recipient -> createNotification(
                recipient,
                title,
                message,
                link,
                "ADMIN_ANNOUNCEMENT"));

        return recipients.size();
    }

    @Transactional
    public void createNotification(
            Account recipient,
            String title,
            String message,
            String link,
            String type) {

        if (recipient == null
                || recipient.isDeleted()
                || !recipient.isEnabled()
                || recipient.isLocked()) {
            return;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .link(link)
                .type(type)
                .read(false)
                .build();

        notificationRepository.save(notification);
        notificationWebSocketHandler.sendNotification(recipient.getUsername(), mapToResponse(notification));
    }

    @Transactional
    public void notifyActivityPlanSubmitted(ActivityPlan plan) {
        if (plan == null) {
            return;
        }

        notifyDocumentSubmitted(
                plan.getStudent(),
                plan.getStudentFullName(),
                plan.getCourse(),
                "plan de actividades",
                documentLink("activity-plans", plan.getId()),
                "ACTIVITY_PLAN_SUBMITTED");
    }

    @Transactional
    public void notifyPracticeReportSubmitted(PracticeReport report) {
        if (report == null) {
            return;
        }

        notifyDocumentSubmitted(
                report.getStudent(),
                report.getStudentFullName(),
                report.getCourse(),
                "informe de prácticas",
                documentLink("practice-reports", report.getId()),
                "PRACTICE_REPORT_SUBMITTED");
    }

    @Transactional
    public void notifyFinalReportSubmitted(FinalReport report) {
        if (report == null) {
            return;
        }

        notifyDocumentSubmitted(
                report.getStudent(),
                report.getStudentFullName(),
                report.getCourse(),
                "informe final",
                documentLink("final-reports", report.getId()),
                "FINAL_REPORT_SUBMITTED");
    }

    @Transactional
    public void notifyCompletedActivityRecordSubmitted(CompletedActivityRecord record) {
        if (record == null) {
            return;
        }

        notifyDocumentSubmitted(
                record.getStudent(),
                record.getStudentFullName(),
                record.getCourse(),
                "registro de actividades cumplidas",
                documentLink("completed-records", record.getId()),
                "COMPLETED_ACTIVITY_RECORD_SUBMITTED");
    }

    private void notifyDocumentSubmitted(
            Account student,
            String studentFullName,
            Course course,
            String documentName,
            String link,
            String type) {

        if (course == null) {
            return;
        }

        List<Account> recipients = getDocumentSubmissionRecipients(course);
        if (recipients.isEmpty()) {
            return;
        }

        String studentName = StringUtils.hasText(studentFullName)
                ? studentFullName
                : student != null ? student.getUsername() : "Un estudiante";
        String courseName = StringUtils.hasText(course.getName())
                ? course.getName()
                : "sin nombre";
        String title = "Nuevo " + documentName + " enviado";
        String message = String.format(
                "El estudiante %s ha enviado el %s del curso %s para revisión.",
                studentName,
                documentName,
                courseName);

        recipients.forEach(recipient -> createNotification(
                recipient,
                title,
                message,
                link,
                type));
    }

    @Transactional
    public void notifyActivityPlanReviewed(ActivityPlan plan) {
        if (plan == null) {
            return;
        }

        notifyDocumentReviewed(
                plan.getStudent(),
                latestReviewer(
                        plan.getReviewedBy(),
                        plan.getReviewedAt(),
                        plan.getDirectorReviewedBy(),
                        plan.getDirectorReviewedAt()),
                "plan de actividades",
                dualApprovalStatusLabel(
                        plan.getStatus(),
                        plan.isPracticeTutorApproved(),
                        plan.isDirectorApproved()),
                documentLink("activity-plans", plan.getId()),
                "ACTIVITY_PLAN_REVIEWED",
                activityPlanFeedbackSections(plan));
    }

    @Transactional
    public void notifyActivityPlanFeedbackAdded(
            ActivityPlan plan,
            Account reviewer) {

        if (plan == null) {
            return;
        }

        notifyDocumentFeedbackAdded(
                plan.getStudent(),
                reviewer,
                "plan de actividades",
                documentLink("activity-plans", plan.getId()),
                "ACTIVITY_PLAN_FEEDBACK_ADDED",
                activityPlanFeedbackSections(plan));
    }

    @Transactional
    public void notifyPracticeReportReviewed(PracticeReport report) {
        if (report == null || report.getStudent() == null) {
            return;
        }

        notifyDocumentReviewed(
                report.getStudent(),
                latestReviewer(
                        report.getReviewedBy(),
                        report.getReviewedAt(),
                        report.getDirectorReviewedBy(),
                        report.getDirectorReviewedAt()),
                "informe de prácticas",
                dualApprovalStatusLabel(
                        report.getStatus(),
                        report.isPracticeTutorApproved(),
                        report.isDirectorApproved()),
                documentLink("practice-reports", report.getId()),
                "PRACTICE_REPORT_REVIEWED",
                practiceReportFeedbackSections(report));
    }

    @Transactional
    public void notifyPracticeReportFeedbackAdded(
            PracticeReport report,
            Account reviewer) {

        if (report == null) {
            return;
        }

        notifyDocumentFeedbackAdded(
                report.getStudent(),
                reviewer,
                "informe de prácticas",
                documentLink("practice-reports", report.getId()),
                "PRACTICE_REPORT_FEEDBACK_ADDED",
                practiceReportFeedbackSections(report));
    }

    @Transactional
    public void notifyFinalReportReviewedByPracticeTutor(FinalReport report) {
        if (report == null) {
            return;
        }

        notifyDocumentReviewed(
                report.getStudent(),
                report.getPracticeReviewedBy(),
                "informe final",
                finalReportStatusLabel(
                        report,
                        "tutor de prácticas",
                        report.isPracticeTutorApproved()),
                documentLink("final-reports", report.getId()),
                "FINAL_REPORT_PRACTICE_REVIEWED",
                finalReportFeedbackSections(report, report.getPracticeReviewedBy()));
    }

    @Transactional
    public void notifyFinalReportReviewedByDirector(FinalReport report) {
        if (report == null) {
            return;
        }

        notifyDocumentReviewed(
                report.getStudent(),
                report.getDirectorReviewedBy(),
                "informe final",
                finalReportStatusLabel(
                        report,
                        "director de prácticas",
                        report.isDirectorApproved()),
                documentLink("final-reports", report.getId()),
                "FINAL_REPORT_DIRECTOR_REVIEWED",
                finalReportFeedbackSections(report, report.getDirectorReviewedBy()));
    }

    @Transactional
    public void notifyFinalReportReviewedByInstitutionalTutor(FinalReport report) {
        if (report == null) {
            return;
        }

        notifyDocumentReviewed(
                report.getStudent(),
                report.getInstitutionalReviewedBy(),
                "informe final",
                finalReportStatusLabel(
                        report,
                        "tutor institucional",
                        report.isInstitutionalTutorApproved()),
                documentLink("final-reports", report.getId()),
                "FINAL_REPORT_INSTITUTIONAL_REVIEWED",
                finalReportFeedbackSections(report, report.getInstitutionalReviewedBy()));
    }

    @Transactional
    public void notifyFinalReportFeedbackAdded(
            FinalReport report,
            Account reviewer) {

        if (report == null) {
            return;
        }

        notifyDocumentFeedbackAdded(
                report.getStudent(),
                reviewer,
                "informe final",
                documentLink("final-reports", report.getId()),
                "FINAL_REPORT_FEEDBACK_ADDED",
                finalReportFeedbackSections(report, reviewer));
    }

    @Transactional
    public void notifyCompletedActivityRecordReviewed(CompletedActivityRecord record) {
        if (record == null) {
            return;
        }

        notifyDocumentReviewed(
                record.getStudent(),
                latestReviewer(
                        record.getReviewedBy(),
                        record.getReviewedAt(),
                        record.getDirectorReviewedBy(),
                        record.getDirectorReviewedAt()),
                "registro de actividades cumplidas",
                dualApprovalStatusLabel(
                        record.getStatus(),
                        record.isPracticeTutorApproved(),
                        record.isDirectorApproved()),
                documentLink("completed-records", record.getId()),
                "COMPLETED_ACTIVITY_RECORD_REVIEWED",
                completedActivityRecordFeedbackSections(record));
    }

    @Transactional
    public void notifyCompletedActivityRecordFeedbackAdded(
            CompletedActivityRecord record,
            Account reviewer) {

        if (record == null) {
            return;
        }

        notifyDocumentFeedbackAdded(
                record.getStudent(),
                reviewer,
                "registro de actividades cumplidas",
                documentLink("completed-records", record.getId()),
                "COMPLETED_ACTIVITY_RECORD_FEEDBACK_ADDED",
                completedActivityRecordFeedbackSections(record));
    }

    @Transactional
    public void notifyEnrollmentPending(Enrollment enrollment) {
        if (enrollment == null || enrollment.getCourse() == null) {
            return;
        }

        Course course = enrollment.getCourse();
        List<Account> recipients = getDocumentSubmissionRecipients(course);
        String studentName = accountLabel(enrollment.getAccount(), "Un estudiante");
        String courseName = courseLabel(course);

        recipients.forEach(recipient -> createNotification(
                recipient,
                "Inscripción pendiente de aprobación",
                String.format(
                        "%s está en espera de aprobación para el curso %s.",
                        studentName,
                        courseName),
                enrollmentManagementLink(course.getId()),
                "ENROLLMENT_PENDING"));
    }

    @Transactional
    public void notifyEnrollmentApproved(Enrollment enrollment) {
        notifyEnrollmentDecision(
                enrollment,
                "Inscripción aprobada",
                "Tu inscripción al curso %s fue aprobada.",
                "ENROLLMENT_APPROVED");
    }

    @Transactional
    public void notifyEnrollmentRejected(Enrollment enrollment) {
        notifyEnrollmentDecision(
                enrollment,
                "Inscripción rechazada",
                "Tu inscripción al curso %s fue rechazada.",
                "ENROLLMENT_REJECTED");
    }

    private void notifyDocumentReviewed(
            Account student,
            Account reviewer,
            String documentName,
            String statusLabel,
            String link,
            String type,
            List<String> observedSections) {

        if (student == null) {
            return;
        }

        String reviewerName = accountLabel(reviewer, "el tutor");

        createNotification(
                student,
                capitalize(documentName) + " revisado",
                String.format(
                        "Tu %s fue revisado por %s y ahora %s.%s",
                        documentName,
                        reviewerName,
                        statusLabel,
                        reviewActionSuffix(statusLabel, observedSections)),
                link,
                type);
    }

    private void notifyDocumentFeedbackAdded(
            Account student,
            Account reviewer,
            String documentName,
            String link,
            String type,
            List<String> observedSections) {

        if (student == null) {
            return;
        }

        String reviewerName = accountLabel(reviewer, "un revisor");

        createNotification(
                student,
                "Nueva retroalimentación",
                String.format(
                        "Tu %s recibió retroalimentación de %s%s. %s",
                        documentName,
                        reviewerName,
                        observedSectionsSuffix(observedSections),
                        correctionInstruction(observedSections)),
                link,
                type);
    }

    private List<String> activityPlanFeedbackSections(ActivityPlan plan) {
        if (plan == null) {
            return List.of();
        }

        LinkedHashSet<String> sections = new LinkedHashSet<>();
        addSectionIfFeedback(sections, "Datos generales", plan.getGeneralInfoFeedback());
        addSectionIfFeedback(sections, "Presentación", plan.getPresentationFeedback());
        addSectionIfFeedback(sections, "Objetivos", plan.getObjectivesFeedback());
        addSectionIfFeedback(sections, "Actividades", plan.getActivitiesFeedback());
        addSectionIfFeedback(sections, "Cronograma", plan.getScheduleFeedback());
        addSectionIfFeedback(sections, "Recursos", plan.getResourcesFeedback());
        addSectionIfFeedback(sections, "Aprobación", plan.getApprovalFeedback());

        return new ArrayList<>(sections);
    }

    private List<String> practiceReportFeedbackSections(PracticeReport report) {
        if (report == null) {
            return List.of();
        }

        LinkedHashSet<String> sections = new LinkedHashSet<>();
        addSectionIfFeedback(sections, "Datos generales", report.getGeneralInfoFeedback());
        addSectionIfFeedback(sections, "Presentación", report.getPresentationFeedback());
        addSectionIfFeedback(sections, "Objetivos", report.getObjectivesFeedback());
        addSectionIfFeedback(sections, "Metodología", report.getMethodologyFeedback());
        addSectionIfFeedback(sections, "Actividades", report.getActivitiesFeedback());
        addSectionIfFeedback(sections, "Conclusiones", report.getConclusionsFeedback());
        addSectionIfFeedback(sections, "Recomendaciones", report.getRecommendationsFeedback());
        addSectionIfFeedback(sections, "Aprobación", report.getApprovalFeedback());

        return new ArrayList<>(sections);
    }

    private List<String> completedActivityRecordFeedbackSections(CompletedActivityRecord record) {
        if (record == null) {
            return List.of();
        }

        LinkedHashSet<String> sections = new LinkedHashSet<>();
        addSectionIfFeedback(sections, "Datos generales", record.getGeneralInfoFeedback());
        addSectionIfFeedback(sections, "Actividades", record.getActivitiesFeedback());
        addSectionIfFeedback(sections, "Acreditación", record.getAccreditationFeedback());

        if (record.getEntries() != null
                && record.getEntries().stream().anyMatch(entry ->
                StringUtils.hasText(entry.getFeedback()) || StringUtils.hasText(entry.getSuggestions()))) {
            sections.add("Actividades");
        }

        return new ArrayList<>(sections);
    }

    private List<String> finalReportFeedbackSections(
            FinalReport report,
            Account reviewer) {

        if (report == null) {
            return List.of();
        }

        LinkedHashSet<String> sections = new LinkedHashSet<>();

        if (sameAccount(reviewer, report.getPracticeReviewedBy())) {
            addPracticeFinalReportSections(sections, report);
        } else if (sameAccount(reviewer, report.getInstitutionalReviewedBy())) {
            addInstitutionalFinalReportSections(sections, report);
        } else if (sameAccount(reviewer, report.getDirectorReviewedBy())) {
            addDirectorFinalReportSections(sections, report);
        } else {
            addPracticeFinalReportSections(sections, report);
            addInstitutionalFinalReportSections(sections, report);
            addDirectorFinalReportSections(sections, report);
        }

        return new ArrayList<>(sections);
    }

    private void addPracticeFinalReportSections(
            LinkedHashSet<String> sections,
            FinalReport report) {

        addFinalReportSections(
                sections,
                report.getPracticeGeneralInfoFeedback(),
                report.getPracticeAntecedentsFeedback(),
                report.getPracticeObjectiveFeedback(),
                report.getPracticeActivitiesFeedback(),
                report.getPracticeConclusionsFeedback(),
                report.getPracticeRecommendationsFeedback(),
                report.getPracticeApprovalFeedback());
    }

    private void addInstitutionalFinalReportSections(
            LinkedHashSet<String> sections,
            FinalReport report) {

        addFinalReportSections(
                sections,
                report.getInstitutionalGeneralInfoFeedback(),
                report.getInstitutionalAntecedentsFeedback(),
                report.getInstitutionalObjectiveFeedback(),
                report.getInstitutionalActivitiesFeedback(),
                report.getInstitutionalConclusionsFeedback(),
                report.getInstitutionalRecommendationsFeedback(),
                report.getInstitutionalApprovalFeedback());
    }

    private void addDirectorFinalReportSections(
            LinkedHashSet<String> sections,
            FinalReport report) {

        addFinalReportSections(
                sections,
                report.getDirectorGeneralInfoFeedback(),
                report.getDirectorAntecedentsFeedback(),
                report.getDirectorObjectiveFeedback(),
                report.getDirectorActivitiesFeedback(),
                report.getDirectorConclusionsFeedback(),
                report.getDirectorRecommendationsFeedback(),
                report.getDirectorApprovalFeedback());
    }

    private void addFinalReportSections(
            LinkedHashSet<String> sections,
            String generalInfoFeedback,
            String antecedentsFeedback,
            String objectiveFeedback,
            String activitiesFeedback,
            String conclusionsFeedback,
            String recommendationsFeedback,
            String approvalFeedback) {

        addSectionIfFeedback(sections, "Datos generales", generalInfoFeedback);
        addSectionIfFeedback(sections, "Antecedentes", antecedentsFeedback);
        addSectionIfFeedback(sections, "Objetivo", objectiveFeedback);
        addSectionIfFeedback(sections, "Actividades", activitiesFeedback);
        addSectionIfFeedback(sections, "Conclusiones", conclusionsFeedback);
        addSectionIfFeedback(sections, "Recomendaciones", recommendationsFeedback);
        addSectionIfFeedback(sections, "Aprobación", approvalFeedback);
    }

    private void addSectionIfFeedback(
            LinkedHashSet<String> sections,
            String section,
            String feedback) {

        if (StringUtils.hasText(feedback)) {
            sections.add(section);
        }
    }

    private String observedSectionsSuffix(List<String> observedSections) {
        List<String> sections = normalizeSections(observedSections);

        if (sections.isEmpty()) {
            return "";
        }

        String sectionLabel = sections.size() == 1 ? " la sección " : " las secciones ";
        return " en" + sectionLabel + humanList(sections);
    }

    private String reviewActionSuffix(
            String statusLabel,
            List<String> observedSections) {

        if (!StringUtils.hasText(statusLabel)
                || !statusLabel.toLowerCase().contains("correcciones")) {
            return "";
        }

        return " " + correctionInstruction(observedSections);
    }

    private String correctionInstruction(List<String> observedSections) {
        List<String> sections = normalizeSections(observedSections);
        String target = sections.isEmpty()
                ? "el detalle del documento"
                : sections.size() == 1
                ? "la sección " + sections.get(0)
                : "las secciones " + humanList(sections);

        return "Revisa " + target
                + ", corrige el contenido y vuelve a enviarlo para continuar la revisión.";
    }

    private List<String> normalizeSections(List<String> sections) {
        if (sections == null) {
            return List.of();
        }

        return sections.stream()
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());
    }

    private String humanList(List<String> values) {
        if (values.isEmpty()) {
            return "";
        }

        if (values.size() == 1) {
            return values.get(0);
        }

        return String.join(", ", values.subList(0, values.size() - 1))
                + " y "
                + values.get(values.size() - 1);
    }

    private boolean sameAccount(
            Account first,
            Account second) {

        if (first == null || second == null) {
            return false;
        }

        if (first.getId() != null && second.getId() != null) {
            return first.getId().equals(second.getId());
        }

        return StringUtils.hasText(first.getUsername())
                && first.getUsername().equals(second.getUsername());
    }

    private void notifyEnrollmentDecision(
            Enrollment enrollment,
            String title,
            String messageTemplate,
            String type) {

        if (enrollment == null || enrollment.getAccount() == null || enrollment.getCourse() == null) {
            return;
        }

        createNotification(
                enrollment.getAccount(),
                title,
                String.format(messageTemplate, courseLabel(enrollment.getCourse())),
                enrollmentStudentLink(enrollment.getCourse().getId()),
                type);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .link(notification.getLink())
                .type(notification.getType())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .build();
    }

    private List<Account> getDocumentSubmissionRecipients(Course course) {
        Map<String, Account> recipients = new LinkedHashMap<>();
        addRecipient(recipients, course.getPracticeTutor());

        accountRepository
                .findActiveAnnouncementRecipientsByRoleNames(DOCUMENT_MANAGER_ROLES)
                .forEach(recipient -> addRecipient(recipients, recipient));

        return new ArrayList<>(recipients.values());
    }

    private void addRecipient(
            Map<String, Account> recipients,
            Account recipient) {

        if (recipient == null
                || recipient.isDeleted()
                || !recipient.isEnabled()
                || recipient.isLocked()) {
            return;
        }

        String key = StringUtils.hasText(recipient.getUsername())
                ? recipient.getUsername()
                : String.valueOf(recipient.getId());

        recipients.putIfAbsent(key, recipient);
    }

    private String documentLink(
            String moduleId,
            Long recordId) {

        if (recordId == null) {
            return "#/documents/" + moduleId;
        }

        return "#/documents/" + moduleId + "?recordId=" + recordId + "&operation=detail";
    }

    private String enrollmentManagementLink(Long courseId) {
        if (courseId == null) {
            return "#/courses";
        }

        return "#/courses?courseId=" + courseId + "&view=enrollments";
    }

    private String enrollmentStudentLink(Long courseId) {
        if (courseId == null) {
            return "#/courses";
        }

        return "#/courses?courseId=" + courseId + "&view=enrollments";
    }

    private String dualApprovalStatusLabel(
            Object status,
            boolean practiceTutorApproved,
            boolean directorApproved) {

        String statusValue = String.valueOf(status);

        if (statusValue.contains("APPROVED")) {
            return "aprobado";
        }

        if (statusValue.contains("NEEDS_CORRECTION")) {
            return "requiere correcciones";
        }

        if (practiceTutorApproved && !directorApproved) {
            return "aprobado por el tutor de prácticas y queda pendiente la aprobación del director de prácticas";
        }

        if (!practiceTutorApproved && directorApproved) {
            return "aprobado por el director de prácticas y queda pendiente la aprobación del tutor de prácticas";
        }

        return "sigue en revisión";
    }

    private String finalReportStatusLabel(
            FinalReport report,
            String reviewerRole,
            boolean reviewerApproved) {

        String statusValue = String.valueOf(report.getStatus());

        if (statusValue.contains("APPROVED")) {
            return "aprobado completamente";
        }

        if (statusValue.contains("NEEDS_CORRECTION")) {
            return "requiere correcciones";
        }

        if (reviewerApproved) {
            return "aprobado por el " + reviewerRole + " y sigue pendiente de las demás aprobaciones";
        }

        return "sigue en revisión";
    }

    private Account latestReviewer(
            Account practiceReviewer,
            LocalDateTime practiceReviewedAt,
            Account directorReviewer,
            LocalDateTime directorReviewedAt) {

        if (directorReviewer == null) {
            return practiceReviewer;
        }

        if (practiceReviewer == null) {
            return directorReviewer;
        }

        if (directorReviewedAt == null) {
            return practiceReviewer;
        }

        if (practiceReviewedAt == null) {
            return directorReviewer;
        }

        return directorReviewedAt.isAfter(practiceReviewedAt)
                ? directorReviewer
                : practiceReviewer;
    }

    private String accountLabel(
            Account account,
            String fallback) {

        if (account == null) {
            return fallback;
        }

        if (account.getPerson() != null) {
            String names = account.getPerson().getNames();
            String lastNames = account.getPerson().getLastNames();
            String fullName = java.util.stream.Stream.of(names, lastNames)
                    .filter(StringUtils::hasText)
                    .collect(Collectors.joining(" "));

            if (StringUtils.hasText(fullName)) {
                return fullName;
            }
        }

        return StringUtils.hasText(account.getUsername())
                ? account.getUsername()
                : fallback;
    }

    private String courseLabel(Course course) {
        return course != null && StringUtils.hasText(course.getName())
                ? course.getName()
                : "sin nombre";
    }

    private String capitalize(String value) {
        if (!StringUtils.hasText(value)) {
            return "Documento";
        }

        return value.substring(0, 1).toUpperCase() + value.substring(1);
    }

    private List<String> normalizeRoles(Collection<String> roles) {
        if (roles == null) {
            return List.of();
        }

        return roles.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .map(String::toUpperCase)
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .collect(Collectors.collectingAndThen(
                        Collectors.toCollection(LinkedHashSet::new),
                        List::copyOf));
    }

    private String normalizeLink(String link) {
        if (!StringUtils.hasText(link)) {
            return null;
        }

        return link.trim();
    }
}
