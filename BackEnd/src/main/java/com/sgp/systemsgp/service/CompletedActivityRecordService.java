package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.completedactivity.CompletedActivityRecordEntryFeedbackRequest;
import com.sgp.systemsgp.dto.completedactivity.CompletedActivityRecordEntryRequest;
import com.sgp.systemsgp.dto.completedactivity.CompletedActivityRecordEntryResponse;
import com.sgp.systemsgp.dto.completedactivity.CompletedActivityRecordResponse;
import com.sgp.systemsgp.dto.completedactivity.CreateCompletedActivityRecordRequest;
import com.sgp.systemsgp.dto.completedactivity.ReviewCompletedActivityRecordRequest;
import com.sgp.systemsgp.dto.completedactivity.UpdateCompletedActivityRecordRequest;
import com.sgp.systemsgp.dto.document.ReviewableDocumentSummaryResponse;
import com.sgp.systemsgp.dto.feedback.FeedbackCommentResponse;
import com.sgp.systemsgp.dto.feedback.FeedbackHistoryResponse;
import com.sgp.systemsgp.enums.ActivityEvaluationPracticeType;
import com.sgp.systemsgp.enums.CompletedActivityRecordStatus;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.CompletedActivityRecord;
import com.sgp.systemsgp.model.CompletedActivityRecordEntry;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CompletedActivityRecordRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import com.sgp.systemsgp.repository.PracticePhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompletedActivityRecordService {

    private static final List<CompletedActivityRecordStatus> REVIEWER_VISIBLE_STATUSES =
            List.of(CompletedActivityRecordStatus.SUBMITTED, CompletedActivityRecordStatus.APPROVED);
    private static final Pattern PRIVATE_PHOTO_CONTENT_PATTERN =
            Pattern.compile("/api/practice-photos/(\\d+)/content");

    private final CompletedActivityRecordRepository completedActivityRecordRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;
    private final InstitutionRepository institutionRepository;
    private final PracticePhotoRepository practicePhotoRepository;
    private final NotificationService notificationService;
    private final FeedbackCommentService feedbackCommentService;
    private final PdfExportService pdfExportService;

    @Transactional
    public CompletedActivityRecordResponse create(
            String username,
            CreateCompletedActivityRecordRequest request) {

        Account student = getAccount(username);
        Enrollment enrollment = request.getEnrollmentId() != null
                ? getEnrollment(request.getEnrollmentId())
                : getDefaultEnrollment(student);

        validateStudentOwnsEnrollment(student, enrollment);
        validateEnrollmentApproved(enrollment);

        if (completedActivityRecordRepository.existsByEnrollment_IdAndDeletedFalse(
                enrollment.getId())) {
            throw new BadRequestException(
                    "Ya existe un registro de actividades cumplidas para este curso");
        }

        Institution institution = resolveEducationalInstitution(
                enrollment,
                request.getEducationalInstitutionId());

        CompletedActivityRecord record = CompletedActivityRecord.builder()
                .enrollment(enrollment)
                .student(student)
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .status(CompletedActivityRecordStatus.DRAFT)
                .build();

        applyCreateData(record, request, student, institution);

        completedActivityRecordRepository.save(record);

        return mapToResponse(record);
    }

    public List<CompletedActivityRecordResponse> myRecords(String username) {

        List<CompletedActivityRecord> records = completedActivityRecordRepository
                .findByStudent_UsernameAndDeletedFalse(username);

        return mapRecordsToResponses(records);
    }

    public List<ReviewableDocumentSummaryResponse> myRecordSummaries(String username) {

        List<CompletedActivityRecord> records = completedActivityRecordRepository
                .findByStudent_UsernameAndDeletedFalse(username);

        return mapRecordsToSummaries(records);
    }

    public List<CompletedActivityRecordResponse> reviewQueue(String username) {

        List<CompletedActivityRecord> records = completedActivityRecordRepository
                .findByCourse_PracticeTutor_UsernameAndDeletedFalse(username)
                .stream()
                .filter(record -> isVisibleToReviewers(record.getStatus()))
                .toList();

        return mapRecordsToResponses(records);
    }

    public List<ReviewableDocumentSummaryResponse> reviewQueueSummaries(String username) {

        List<CompletedActivityRecord> records = completedActivityRecordRepository
                .findByCourse_PracticeTutor_UsernameAndDeletedFalse(username)
                .stream()
                .filter(record -> isVisibleToReviewers(record.getStatus()))
                .toList();

        return mapRecordsToSummaries(records);
    }

    public List<CompletedActivityRecordResponse> submittedDocuments(String username) {

        Account account = getAccount(username);
        List<CompletedActivityRecord> records = completedActivityRecordRepository
                .findByStatusInAndDeletedFalse(REVIEWER_VISIBLE_STATUSES)
                .stream()
                .filter(record -> canViewDirectorQueue(record.getCourse(), account))
                .toList();

        return mapRecordsToResponses(records);
    }

    public List<ReviewableDocumentSummaryResponse> submittedDocumentSummaries(String username) {

        Account account = getAccount(username);
        List<CompletedActivityRecord> records = completedActivityRecordRepository
                .findByStatusInAndDeletedFalse(REVIEWER_VISIBLE_STATUSES)
                .stream()
                .filter(record -> canViewDirectorQueue(record.getCourse(), account))
                .toList();

        return mapRecordsToSummaries(records);
    }

    public CompletedActivityRecordResponse getDefaults(
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

        CompletedActivityRecord record = CompletedActivityRecord.builder()
                .enrollment(enrollment)
                .student(student)
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .status(CompletedActivityRecordStatus.DRAFT)
                .build();

        copyInstitutionSnapshot(record, institution);
        copyStudentSnapshot(record, student);
        copyCoursePracticeType(record);

        return mapToResponse(record);
    }

    public CompletedActivityRecordResponse getById(
            Long id,
            String username) {

        CompletedActivityRecord record = getRecord(id);
        Account account = getAccount(username);

        validateCanView(record, account);

        return mapToResponse(record);
    }

    @Transactional
    public byte[] exportApprovedPdf(
            Long id,
            String username) {

        CompletedActivityRecord entity = getRecord(id);
        Account account = getAccount(username);

        validateCanView(entity, account);

        CompletedActivityRecordResponse record = mapToResponse(entity);
        validateApprovedForExport(record.getStatus());

        Account institutionalTutor = institutionalTutorFor(
                entity.getEnrollment(),
                entity.getCourse());

        return pdfExportService.createCompletedActivityRecordPdf(
                new PdfExportService.PdfCompletedActivityRecord(
                        record.getEducationalInstitutionName(),
                        record.getPracticeType(),
                        record.getStudentFullName(),
                        record.getStudentIdentification(),
                        record.getCourseName(),
                        record.getAcademicPeriod(),
                        record.getDevelopmentMode(),
                        record.getTotalMinutes(),
                        record.getDeliveryDate(),
                        record.getStudentFullName(),
                        accountFullName(institutionalTutor),
                        completedActivityEntries(record.getEntries())));
    }

    @Transactional
    public CompletedActivityRecordResponse update(
            Long id,
            String username,
            UpdateCompletedActivityRecordRequest request) {

        CompletedActivityRecord record = getRecord(id);
        Account student = getAccount(username);

        validateStudentOwnsRecord(student, record);
        validateEditable(record);

        if (request.getEducationalInstitutionId() != null) {
            Institution institution = resolveEducationalInstitution(
                    record.getEnrollment(),
                    request.getEducationalInstitutionId());

            record.setEducationalInstitution(institution);
        }

        copyInstitutionSnapshot(record, record.getEducationalInstitution());
        copyStudentSnapshot(record, student);
        copyCoursePracticeType(record);
        applyUpdateData(record, request);
        moveToDraftAfterStudentUpdate(record);

        completedActivityRecordRepository.save(record);

        return mapToResponse(record);
    }

    @Transactional
    public CompletedActivityRecordResponse submit(
            Long id,
            String username) {

        CompletedActivityRecord record = getRecord(id);
        Account student = getAccount(username);

        validateStudentOwnsRecord(student, record);
        validateEditable(record);

        if (record.getStatus() != CompletedActivityRecordStatus.SUBMITTED) {
            startNewReviewCycle(record);
        }
        record.setStatus(ReviewWorkflowStateMachine.transition(
                record.getStatus(),
                CompletedActivityRecordStatus.SUBMITTED,
                "registro de actividades"));
        record.setSubmittedAt(LocalDateTime.now());

        completedActivityRecordRepository.save(record);
        notificationService.notifyCompletedActivityRecordSubmitted(record);

        return mapToResponse(record);
    }

    @Transactional
    public CompletedActivityRecordResponse review(
            Long id,
            String username,
            ReviewCompletedActivityRecordRequest request) {

        CompletedActivityRecord record = getRecord(id);
        Account tutor = getAccount(username);

        validateCanReview(record, tutor);

        ReviewWorkflowStateMachine.ensureReviewable(
                record.getStatus(),
                "Solo se pueden revisar registros enviados");

        applyReviewFeedback(record, request);
        saveReviewFeedbackComments(record, request, tutor);
        applyEntryFeedback(record, request.getEntryFeedback(), tutor);

        if (request.getApproved() != null) {
            applyReviewDecision(record, tutor, request.getApproved());
        } else if (hasReviewFeedback(request)) {
            touchReviewAuthor(record, tutor);
        }

        completedActivityRecordRepository.save(record);

        if (request.getApproved() != null) {
            notificationService.notifyCompletedActivityRecordReviewed(record);
        } else {
            notificationService.notifyCompletedActivityRecordFeedbackAdded(record, tutor);
        }

        return mapToResponse(record);
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

        return enrollmentRepository
                .findByAccount_UsernameAndStatusAndCourse_ActiveTrueAndCourse_DeletedFalse(
                        student.getUsername(),
                        EnrollmentStatus.APPROVED)
                .stream()
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "No tienes ninguna inscripcion aprobada para crear el registro de actividades cumplidas"));
    }

    private CompletedActivityRecord getRecord(Long id) {

        return completedActivityRecordRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Registro de actividades cumplidas no encontrado"));
    }

    private Institution getInstitution(Long id) {

        return institutionRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Institucion educativa receptora no encontrada"));
    }

    private void validateStudentOwnsEnrollment(
            Account student,
            Enrollment enrollment) {

        if (!enrollment.getAccount().getId().equals(student.getId())) {
            throw new AccessDeniedException(
                    "No puedes crear registros para otra inscripcion");
        }
    }

    private void validateStudentOwnsRecord(
            Account student,
            CompletedActivityRecord record) {

        if (!record.getStudent().getId().equals(student.getId())) {
            throw new AccessDeniedException(
                    "No puedes modificar este registro");
        }
    }

    private void validateEnrollmentApproved(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException(
                    "Solo se puede crear el registro de una inscripcion aprobada");
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
            CompletedActivityRecord record,
            Account account) {

        if (record.getStudent().getId().equals(account.getId())) {
            return;
        }

        if (isVisibleToReviewers(record.getStatus())
                && (isAssignedPracticeTutor(record, account)
                || hasRole(account, RoleName.ROLE_ADMIN)
                || isDirectorForCourse(record.getCourse(), account))) {
            return;
        }

        throw new AccessDeniedException(
                "No puedes ver este registro");
    }

    private boolean isVisibleToReviewers(CompletedActivityRecordStatus status) {

        return REVIEWER_VISIBLE_STATUSES.contains(status);
    }

    private void validateCanReview(
            CompletedActivityRecord record,
            Account reviewer) {

        if (isDirectorForCourse(record.getCourse(), reviewer)) {
            return;
        }

        if (hasRole(reviewer, RoleName.ROLE_TUTOR_PRACTICAS)
                && isAssignedPracticeTutor(record, reviewer)) {
            return;
        }

        throw new AccessDeniedException(
                "Solo el tutor de practicas asignado o el director de practicas puede revisar este registro");
    }

    private boolean isAssignedPracticeTutor(
            CompletedActivityRecord record,
            Account account) {

        Course course = record.getCourse();

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

    private void validateEditable(CompletedActivityRecord record) {

        ReviewWorkflowStateMachine.ensureEditable(
                record.getStatus(),
                "No se puede editar un registro aprobado");
    }

    private void moveToDraftAfterStudentUpdate(CompletedActivityRecord record) {

        if (record.getStatus() == CompletedActivityRecordStatus.SUBMITTED) {
            record.setStatus(ReviewWorkflowStateMachine.transition(
                    record.getStatus(),
                    CompletedActivityRecordStatus.DRAFT,
                    "registro de actividades"));
            record.setSubmittedAt(null);
            resetReviewDecision(record);
        }
    }

    private void resetReviewDecision(CompletedActivityRecord record) {

        record.setPracticeTutorApproved(false);
        record.setDirectorApproved(false);
        record.setReviewedBy(null);
        record.setDirectorReviewedBy(null);
        record.setReviewedAt(null);
        record.setDirectorReviewedAt(null);
        record.setApprovedAt(null);
        clearReviewFeedback(record);
        feedbackCommentService.clearDocumentFeedback(
                FeedbackDocumentType.COMPLETED_ACTIVITY_RECORD,
                record.getId());
    }

    private void startNewReviewCycle(CompletedActivityRecord record) {

        resetReviewDecision(record);
        record.setReviewCycle(ReviewWorkflowStateMachine.nextCycle(record.getReviewCycle()));
    }

    private void clearReviewFeedback(CompletedActivityRecord record) {

        record.setGeneralInfoFeedback(null);
        record.setActivitiesFeedback(null);
        record.setAccreditationFeedback(null);

        record.getEntries().forEach((entry) -> {
            entry.setFeedback(null);
            entry.setSuggestions(null);
        });
    }

    private void applyReviewFeedback(
            CompletedActivityRecord record,
            ReviewCompletedActivityRecordRequest request) {

        setIfNotNull(request.getGeneralInfoFeedback(), record::setGeneralInfoFeedback);
        setIfNotNull(request.getActivitiesFeedback(), record::setActivitiesFeedback);
        setIfNotNull(request.getAccreditationFeedback(), record::setAccreditationFeedback);
    }

    private boolean hasReviewFeedback(ReviewCompletedActivityRecordRequest request) {
        return request.getGeneralInfoFeedback() != null
                || request.getActivitiesFeedback() != null
                || request.getAccreditationFeedback() != null
                || hasEntryFeedback(request.getEntryFeedback());
    }

    private void saveReviewFeedbackComments(
            CompletedActivityRecord record,
            ReviewCompletedActivityRecordRequest request,
            Account reviewer) {

        saveDocumentFeedback(record, "generalInfoFeedback", request.getGeneralInfoFeedback(), reviewer);
        saveDocumentFeedback(record, "activitiesFeedback", request.getActivitiesFeedback(), reviewer);
        saveDocumentFeedback(record, "accreditationFeedback", request.getAccreditationFeedback(), reviewer);
    }

    private void saveDocumentFeedback(
            CompletedActivityRecord record,
            String sectionKey,
            String message,
            Account reviewer) {

        feedbackCommentService.upsertDocumentFeedback(
                FeedbackDocumentType.COMPLETED_ACTIVITY_RECORD,
                record.getId(),
                sectionKey,
                message,
                reviewer,
                record.getReviewCycle());
    }

    private boolean hasEntryFeedback(List<CompletedActivityRecordEntryFeedbackRequest> entryFeedback) {
        return entryFeedback != null
                && entryFeedback.stream().anyMatch((feedback) ->
                        feedback != null
                                && (feedback.getFeedback() != null
                                || feedback.getSuggestions() != null));
    }

    private void touchReviewAuthor(
            CompletedActivityRecord record,
            Account reviewer) {

        if (hasRole(reviewer, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            record.setDirectorReviewedBy(reviewer);
            record.setDirectorReviewedAt(LocalDateTime.now());
            return;
        }

        record.setReviewedBy(reviewer);
        record.setReviewedAt(LocalDateTime.now());
    }

    private void applyReviewDecision(
            CompletedActivityRecord record,
            Account reviewer,
            boolean approved) {

        if (hasRole(reviewer, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            record.setDirectorApproved(approved);
            record.setDirectorReviewedBy(reviewer);
            record.setDirectorReviewedAt(LocalDateTime.now());
        } else {
            record.setPracticeTutorApproved(approved);
            record.setReviewedBy(reviewer);
            record.setReviewedAt(LocalDateTime.now());
        }

        if (!approved) {
            record.setStatus(ReviewWorkflowStateMachine.transition(
                    record.getStatus(),
                    CompletedActivityRecordStatus.NEEDS_CORRECTION,
                    "registro de actividades"));
            record.setApprovedAt(null);
            return;
        }

        if (record.isPracticeTutorApproved() && record.isDirectorApproved()) {
            record.setStatus(ReviewWorkflowStateMachine.transition(
                    record.getStatus(),
                    CompletedActivityRecordStatus.APPROVED,
                    "registro de actividades"));
            record.setApprovedAt(LocalDateTime.now());
            return;
        }

        record.setStatus(ReviewWorkflowStateMachine.transition(
                record.getStatus(),
                CompletedActivityRecordStatus.SUBMITTED,
                "registro de actividades"));
        record.setApprovedAt(null);
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
            CompletedActivityRecord record,
            CreateCompletedActivityRecordRequest request,
            Account student,
            Institution institution) {

        copyInstitutionSnapshot(record, institution);
        copyStudentSnapshot(record, student);
        copyCoursePracticeType(record);

        record.setDevelopmentMode(request.getDevelopmentMode());
        record.setDeliveryDate(request.getDeliveryDate());

        replaceEntries(record, request.getEntries());
        record.setTotalMinutes(resolveRecordTotalMinutes(
                request.getTotalMinutes(),
                record));
    }

    private void applyUpdateData(
            CompletedActivityRecord record,
            UpdateCompletedActivityRecordRequest request) {

        setIfNotNull(request.getDevelopmentMode(), record::setDevelopmentMode);
        setIfNotNull(request.getDeliveryDate(), record::setDeliveryDate);

        if (request.getEntries() != null) {
            replaceEntries(record, request.getEntries());
        }

        record.setTotalMinutes(resolveRecordTotalMinutes(
                request.getTotalMinutes(),
                record));
    }

    private void copyInstitutionSnapshot(
            CompletedActivityRecord record,
            Institution institution) {

        record.setEducationalInstitutionName(institution.getName());
        record.setEducationalInstitutionCode(institution.getCode());
        record.setEducationalInstitutionAddress(institution.getAddress());
        record.setEducationalInstitutionPhone(institution.getPhone());
        record.setEducationalInstitutionEmail(institution.getEmail());
    }

    private void copyStudentSnapshot(
            CompletedActivityRecord record,
            Account student) {

        Person person = student.getPerson();

        if (person != null) {
            record.setStudentFullName(joinNames(
                    person.getNames(),
                    person.getLastNames()));
            record.setStudentIdentification(person.getCedula());
            record.setStudentEmail(person.getInstitutionalEmail());
            record.setStudentPhone(person.getPhone());
        }

        if (student.getAcademicCycle() != null) {
            record.setAcademicPeriod(student.getAcademicCycle().getName());
        }
    }

    private void replaceEntries(
            CompletedActivityRecord record,
            List<CompletedActivityRecordEntryRequest> entries) {

        record.getEntries().clear();

        if (entries == null) {
            return;
        }

        for (CompletedActivityRecordEntryRequest entryRequest : entries) {
            Integer totalMinutes = resolveEntryTotalMinutes(
                    entryRequest.getStartTime(),
                    entryRequest.getEndTime(),
                    entryRequest.getTotalMinutes());

            CompletedActivityRecordEntry entry = CompletedActivityRecordEntry.builder()
                    .record(record)
                    .activityDate(entryRequest.getActivityDate())
                    .startTime(entryRequest.getStartTime())
                    .endTime(entryRequest.getEndTime())
                    .totalMinutes(totalMinutes)
                    .developedActivities(entryRequest.getDevelopedActivities())
                    .evidenceLink(entryRequest.getEvidenceLink())
                    .build();

            record.getEntries().add(entry);
        }
    }

    private Integer resolveEntryTotalMinutes(
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

    private Integer resolveRecordTotalMinutes(
            Integer requestedTotalMinutes,
            CompletedActivityRecord record) {

        if (requestedTotalMinutes != null) {
            return requestedTotalMinutes;
        }

        return record.getEntries()
                .stream()
                .filter(entry -> entry.getTotalMinutes() != null)
                .mapToInt(CompletedActivityRecordEntry::getTotalMinutes)
                .sum();
    }

    private void copyCoursePracticeType(CompletedActivityRecord record) {

        record.setPracticeType(resolveCoursePracticeType(record.getCourse()));
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

    private void validateComplete(CompletedActivityRecord record) {

        requireText(record.getEducationalInstitutionName(),
                "La institucion educativa receptora es obligatoria");
        requireText(record.getStudentFullName(),
                "El nombre del estudiante es obligatorio");
        requireText(record.getStudentIdentification(),
                "La cedula del estudiante es obligatoria");
        requireText(record.getAcademicPeriod(),
                "El periodo academico es obligatorio");

        if (record.getPracticeType() == null) {
            throw new BadRequestException(
                    "El tipo de practicas es obligatorio");
        }

        if (record.getDevelopmentMode() == null) {
            throw new BadRequestException(
                    "El desarrollo de actividades es obligatorio");
        }

        validateEntries(record);

        if (record.getTotalMinutes() == null || record.getTotalMinutes() < 0) {
            throw new BadRequestException(
                    "El total de horas ejecutadas debe ser mayor o igual a cero");
        }

        if (record.getDeliveryDate() == null) {
            throw new BadRequestException(
                    "La fecha de entrega es obligatoria");
        }
    }

    private void validateEntries(CompletedActivityRecord record) {

        if (record.getEntries().isEmpty()) {
            throw new BadRequestException(
                    "Debe registrar al menos una actividad cumplida");
        }

        for (CompletedActivityRecordEntry entry : record.getEntries()) {
            if (entry.getActivityDate() == null
                    || entry.getStartTime() == null
                    || entry.getEndTime() == null
                    || !hasText(entry.getDevelopedActivities())
                    || !hasText(entry.getEvidenceLink())) {
                throw new BadRequestException(
                        "Cada actividad debe tener fecha, horas, descripcion y evidencia");
            }

            if (!entry.getEndTime().isAfter(entry.getStartTime())) {
                throw new BadRequestException(
                        "La hora de fin debe ser posterior a la hora de inicio");
            }

            if (entry.getTotalMinutes() == null || entry.getTotalMinutes() <= 0) {
                throw new BadRequestException(
                        "El total de minutos de cada actividad debe ser mayor a cero");
            }
        }
    }

    private void applyEntryFeedback(
            CompletedActivityRecord record,
            List<CompletedActivityRecordEntryFeedbackRequest> feedbackList,
            Account reviewer) {

        if (feedbackList == null) {
            return;
        }

        for (CompletedActivityRecordEntryFeedbackRequest feedbackRequest : feedbackList) {
            CompletedActivityRecordEntry entry = findEntry(
                    record,
                    feedbackRequest.getEntryId());

            setIfNotNull(feedbackRequest.getFeedback(), entry::setFeedback);
            setIfNotNull(feedbackRequest.getSuggestions(), entry::setSuggestions);
            saveEntryFeedback(record, entry, "feedback", feedbackRequest.getFeedback(), reviewer);
            saveEntryFeedback(record, entry, "suggestions", feedbackRequest.getSuggestions(), reviewer);
        }
    }

    private void saveEntryFeedback(
            CompletedActivityRecord record,
            CompletedActivityRecordEntry entry,
            String sectionKey,
            String message,
            Account reviewer) {

        feedbackCommentService.upsertEntryFeedback(
                FeedbackDocumentType.COMPLETED_ACTIVITY_RECORD,
                record.getId(),
                sectionKey,
                entry.getId(),
                message,
                reviewer,
                record.getReviewCycle());
    }

    private CompletedActivityRecordEntry findEntry(
            CompletedActivityRecord record,
            Long entryId) {

        return record.getEntries()
                .stream()
                .filter(entry -> Objects.equals(entry.getId(), entryId))
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "La fila de actividad no pertenece a este registro"));
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

    private void validateApprovedForExport(String status) {

        if (!CompletedActivityRecordStatus.APPROVED.name().equals(status)) {
            throw new BadRequestException(
                    "Solo se pueden exportar documentos aprobados");
        }
    }

    private String entriesText(List<CompletedActivityRecordEntryResponse> entries) {

        if (entries == null || entries.isEmpty()) {
            return null;
        }

        return entries.stream()
                .map(entry -> nullSafe(entry.getActivityDate())
                        + " "
                        + nullSafe(entry.getStartTime())
                        + "-"
                        + nullSafe(entry.getEndTime())
                        + " ("
                        + nullSafe(entry.getTotalTime())
                        + "): "
                        + nullSafe(entry.getDevelopedActivities())
                        + evidenceText(entry.getEvidenceLink()))
                .collect(Collectors.joining("\n"));
    }

    private List<PdfExportService.PdfCompletedActivityEntry> completedActivityEntries(
            List<CompletedActivityRecordEntryResponse> entries) {

        if (entries == null) {
            return List.of();
        }

        return entries.stream()
                .map(entry -> new PdfExportService.PdfCompletedActivityEntry(
                        entry.getActivityDate(),
                        entry.getStartTime(),
                        entry.getEndTime(),
                        entry.getTotalMinutes(),
                        entry.getDevelopedActivities(),
                        publicEvidenceLink(entry.getEvidenceLink())))
                .toList();
    }

    private String publicEvidenceLink(String evidenceLink) {

        if (evidenceLink == null || evidenceLink.isBlank()) {
            return evidenceLink;
        }

        if (evidenceLink.contains("/api/public/practice-photos/")) {
            return evidenceLink;
        }

        String decodedLink = URLDecoder.decode(
                evidenceLink,
                StandardCharsets.UTF_8);
        Matcher matcher = PRIVATE_PHOTO_CONTENT_PATTERN.matcher(decodedLink);

        if (!matcher.find()) {
            return evidenceLink;
        }

        Long photoId;
        try {
            photoId = Long.valueOf(matcher.group(1));
        } catch (NumberFormatException exception) {
            return evidenceLink;
        }

        return practicePhotoRepository
                .findByIdAndDeletedFalse(photoId)
                .map(photo -> {
                    photo.ensurePublicToken();
                    String publicPath = "/api/public/practice-photos/"
                            + photo.getPublicToken()
                            + "/content";
                    String origin = linkOrigin(decodedLink);
                    return origin != null ? origin + publicPath : publicPath;
                })
                .orElse(evidenceLink);
    }

    private String linkOrigin(String url) {

        if (url == null || !url.startsWith("http")) {
            return null;
        }

        try {
            URI uri = URI.create(url);
            String host = uri.getHost();

            if (host == null) {
                return null;
            }

            int port = uri.getPort();

            if (("localhost".equals(host) || "127.0.0.1".equals(host)) && port == 3000) {
                port = 8080;
            }

            StringBuilder origin = new StringBuilder()
                    .append(uri.getScheme())
                    .append("://")
                    .append(host);

            if (port > -1) {
                origin.append(":").append(port);
            }

            return origin.toString();
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private String evidenceText(String evidenceLink) {

        return evidenceLink != null && !evidenceLink.isBlank()
                ? " Evidencia: " + evidenceLink
                : "";
    }

    private String nullSafe(Object value) {

        return value != null ? String.valueOf(value) : "";
    }

    private List<ReviewableDocumentSummaryResponse> mapRecordsToSummaries(
            List<CompletedActivityRecord> records) {

        return records.stream()
                .map(this::mapToSummary)
                .toList();
    }

    private ReviewableDocumentSummaryResponse mapToSummary(CompletedActivityRecord record) {

        Course course = record.getCourse();
        Account institutionalTutor = institutionalTutorFor(
                record.getEnrollment(),
                course);

        return ReviewableDocumentSummaryResponse.builder()
                .id(record.getId())
                .documentType("COMPLETED_ACTIVITY_RECORD")
                .status(record.getStatus().name())
                .reviewCycle(record.getReviewCycle())
                .enrollmentId(record.getEnrollment().getId())
                .courseId(course.getId())
                .courseName(course.getName())
                .courseCode(course.getCode())
                .courseActive(course.isActive())
                .studentId(record.getStudent().getId())
                .studentUsername(record.getStudent().getUsername())
                .studentFullName(record.getStudentFullName())
                .studentIdentification(record.getStudentIdentification())
                .academicCycleName(academicCycleName(record.getStudent()))
                .educationalInstitutionId(record.getEducationalInstitution().getId())
                .educationalInstitutionName(record.getEducationalInstitutionName())
                .academicPeriod(record.getAcademicPeriod())
                .practiceTutorUsername(accountUsername(course.getPracticeTutor()))
                .practiceTutorName(accountFullName(course.getPracticeTutor()))
                .institutionalTutorUsername(accountUsername(institutionalTutor))
                .institutionalTutorName(accountFullName(institutionalTutor))
                .practiceTutorApproved(record.isPracticeTutorApproved())
                .directorApproved(record.isDirectorApproved())
                .reviewedBy(accountUsername(record.getReviewedBy()))
                .reviewedByName(accountFullName(record.getReviewedBy()))
                .directorReviewedBy(accountUsername(record.getDirectorReviewedBy()))
                .directorReviewedByName(accountFullName(record.getDirectorReviewedBy()))
                .totalMinutes(record.getTotalMinutes())
                .totalTime(formatMinutes(record.getTotalMinutes()))
                .deliveryDate(record.getDeliveryDate())
                .submittedAt(record.getSubmittedAt())
                .reviewedAt(record.getReviewedAt())
                .directorReviewedAt(record.getDirectorReviewedAt())
                .approvedAt(record.getApprovedAt())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
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

    private List<CompletedActivityRecordResponse> mapRecordsToResponses(
            List<CompletedActivityRecord> records) {

        Map<Long, List<FeedbackCommentResponse>> feedbackByDocumentId =
                feedbackCommentService.listResponsesByDocumentId(
                        FeedbackDocumentType.COMPLETED_ACTIVITY_RECORD,
                        records.stream().map(CompletedActivityRecord::getId).toList());
        Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId =
                feedbackCommentService.listHistoryResponsesByDocumentId(
                        FeedbackDocumentType.COMPLETED_ACTIVITY_RECORD,
                        records.stream().map(CompletedActivityRecord::getId).toList());

        return records.stream()
                .map(record -> mapToResponse(
                        record,
                        feedbackByDocumentId,
                        historyByDocumentId))
                .toList();
    }

    private CompletedActivityRecordResponse mapToResponse(
            CompletedActivityRecord record) {
        return mapToResponse(record, null, null);
    }

    private CompletedActivityRecordResponse mapToResponse(
            CompletedActivityRecord record,
            Map<Long, List<FeedbackCommentResponse>> feedbackByDocumentId,
            Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId) {

        return CompletedActivityRecordResponse.builder()
                .id(record.getId())
                .enrollmentId(record.getEnrollment().getId())
                .courseId(record.getCourse().getId())
                .courseName(record.getCourse().getName())
                .studentId(record.getStudent().getId())
                .studentUsername(record.getStudent().getUsername())
                .educationalInstitutionId(record.getEducationalInstitution().getId())
                .educationalInstitutionName(record.getEducationalInstitutionName())
                .educationalInstitutionCode(record.getEducationalInstitutionCode())
                .educationalInstitutionAddress(record.getEducationalInstitutionAddress())
                .educationalInstitutionPhone(record.getEducationalInstitutionPhone())
                .educationalInstitutionEmail(record.getEducationalInstitutionEmail())
                .practiceType(
                        record.getPracticeType() != null
                                ? record.getPracticeType().name()
                                : null)
                .studentFullName(record.getStudentFullName())
                .studentIdentification(record.getStudentIdentification())
                .studentEmail(record.getStudentEmail())
                .studentPhone(record.getStudentPhone())
                .academicPeriod(record.getAcademicPeriod())
                .developmentMode(
                        record.getDevelopmentMode() != null
                                ? record.getDevelopmentMode().name()
                                : null)
                .entries(mapEntries(record))
                .totalMinutes(record.getTotalMinutes())
                .totalTime(formatMinutes(record.getTotalMinutes()))
                .deliveryDate(record.getDeliveryDate())
                .generalInfoFeedback(record.getGeneralInfoFeedback())
                .activitiesFeedback(record.getActivitiesFeedback())
                .accreditationFeedback(record.getAccreditationFeedback())
                .feedbackComments(resolveFeedbackComments(
                        record.getId(),
                        feedbackByDocumentId))
                .feedbackHistory(resolveFeedbackHistory(
                        record.getId(),
                        historyByDocumentId))
                .status(record.getStatus().name())
                .reviewCycle(record.getReviewCycle())
                .practiceTutorApproved(record.isPracticeTutorApproved())
                .directorApproved(record.isDirectorApproved())
                .reviewedBy(
                        record.getReviewedBy() != null
                                ? record.getReviewedBy().getUsername()
                                : null)
                .directorReviewedBy(
                        record.getDirectorReviewedBy() != null
                                ? record.getDirectorReviewedBy().getUsername()
                                : null)
                .submittedAt(record.getSubmittedAt())
                .reviewedAt(record.getReviewedAt())
                .directorReviewedAt(record.getDirectorReviewedAt())
                .approvedAt(record.getApprovedAt())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }

    private List<FeedbackCommentResponse> resolveFeedbackComments(
            Long documentId,
            Map<Long, List<FeedbackCommentResponse>> feedbackByDocumentId) {

        if (feedbackByDocumentId != null) {
            return feedbackByDocumentId.getOrDefault(documentId, List.of());
        }

        return feedbackCommentService.listResponses(
                FeedbackDocumentType.COMPLETED_ACTIVITY_RECORD,
                documentId);
    }

    private List<FeedbackHistoryResponse> resolveFeedbackHistory(
            Long documentId,
            Map<Long, List<FeedbackHistoryResponse>> historyByDocumentId) {

        if (historyByDocumentId != null) {
            return historyByDocumentId.getOrDefault(documentId, List.of());
        }

        return feedbackCommentService.listHistoryResponses(
                FeedbackDocumentType.COMPLETED_ACTIVITY_RECORD,
                documentId);
    }

    private List<CompletedActivityRecordEntryResponse> mapEntries(
            CompletedActivityRecord record) {

        return record.getEntries()
                .stream()
                .sorted(Comparator
                        .comparing(
                                CompletedActivityRecordEntry::getActivityDate,
                                Comparator.nullsLast(java.time.LocalDate::compareTo))
                        .thenComparing(
                                CompletedActivityRecordEntry::getStartTime,
                                Comparator.nullsLast(LocalTime::compareTo)))
                .map(entry -> CompletedActivityRecordEntryResponse.builder()
                        .id(entry.getId())
                        .activityDate(entry.getActivityDate())
                        .startTime(entry.getStartTime())
                        .endTime(entry.getEndTime())
                        .totalMinutes(entry.getTotalMinutes())
                        .totalTime(formatMinutes(entry.getTotalMinutes()))
                        .developedActivities(entry.getDevelopedActivities())
                        .evidenceLink(entry.getEvidenceLink())
                        .feedback(entry.getFeedback())
                        .suggestions(entry.getSuggestions())
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
