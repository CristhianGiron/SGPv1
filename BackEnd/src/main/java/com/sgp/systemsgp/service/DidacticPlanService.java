package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.didacticplan.DidacticPlanRecommendationRequest;
import com.sgp.systemsgp.dto.didacticplan.DidacticPlanRequest;
import com.sgp.systemsgp.dto.didacticplan.DidacticPlanResponse;
import com.sgp.systemsgp.dto.didacticplan.DidacticPlanWeekRequest;
import com.sgp.systemsgp.dto.didacticplan.DidacticPlanWeekResponse;
import com.sgp.systemsgp.enums.DidacticPlanAuthorType;
import com.sgp.systemsgp.enums.DidacticPlanStatus;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.DidacticPlan;
import com.sgp.systemsgp.model.DidacticPlanWeek;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.DidacticPlanRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
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
public class DidacticPlanService {

    private static final long MAX_PDF_SIZE = 10L * 1024L * 1024L;

    private final DidacticPlanRepository didacticPlanRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;
    private final PracticeAccessService practiceAccessService;

    @Transactional
    public DidacticPlanResponse create(
            String username,
            DidacticPlanRequest request) {

        Account author = getAccount(username);
        Enrollment enrollment = getEnrollment(request.getEnrollmentId());
        validateEnrollmentApproved(enrollment);

        DidacticPlanAuthorType authorType = resolveAuthorType(author);
        validateCanCreateForEnrollment(author, authorType, enrollment);

        DidacticPlan sourcePlan = resolveSourcePlan(request.getSourcePlanId(), author, enrollment);
        DidacticPlan plan = DidacticPlan.builder()
                .enrollment(enrollment)
                .student(enrollment.getAccount())
                .course(enrollment.getCourse())
                .educationalInstitution(InstitutionalAssignmentResolver.educationalInstitution(enrollment))
                .author(author)
                .authorType(authorType)
                .sourcePlan(sourcePlan)
                .build();

        applyData(plan, request);
        applyStatus(plan, request);
        didacticPlanRepository.save(plan);

        return mapToResponse(plan);
    }

    public List<DidacticPlanResponse> myPlans(String username) {

        Account account = getAccount(username);

        return didacticPlanRepository.findByStudent_UsernameAndDeletedFalse(username)
                .stream()
                .filter(plan -> canView(plan, account))
                .sorted(planComparator())
                .map(this::mapToResponse)
                .toList();
    }

    public List<DidacticPlanResponse> managedPlans(String username) {

        Account account = getAccount(username);
        List<DidacticPlan> plans = new ArrayList<>();

        if (hasRole(account, RoleName.ROLE_ADMIN)
                || hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            plans.addAll(didacticPlanRepository.findByDeletedFalse());
        } else {
            if (hasRole(account, RoleName.ROLE_TUTOR_INSTITUCIONAL)) {
                plans.addAll(didacticPlanRepository
                        .findByEnrollment_Group_InstitutionalTutor_UsernameAndDeletedFalse(username));
                plans.addAll(didacticPlanRepository
                        .findByCourse_InstitutionalTutor_UsernameAndDeletedFalse(username));
            }

            if (hasRole(account, RoleName.ROLE_TUTOR_PRACTICAS)) {
                plans.addAll(didacticPlanRepository
                        .findByCourse_PracticeTutor_UsernameAndDeletedFalse(username));
            }
        }

        Map<Long, DidacticPlan> uniquePlans = new LinkedHashMap<>();
        plans.forEach(plan -> uniquePlans.putIfAbsent(plan.getId(), plan));

        return uniquePlans.values()
                .stream()
                .filter(plan -> canView(plan, account))
                .sorted(planComparator())
                .map(this::mapToResponse)
                .toList();
    }

    public DidacticPlanResponse getById(Long id, String username) {

        DidacticPlan plan = getPlan(id);
        Account account = getAccount(username);
        validateCanView(plan, account);

        return mapToResponse(plan);
    }

    @Transactional
    public DidacticPlanResponse update(
            Long id,
            String username,
            DidacticPlanRequest request) {

        DidacticPlan plan = getPlan(id);
        Account account = getAccount(username);
        validateCanEdit(plan, account);
        applyData(plan, request);

        if (Boolean.FALSE.equals(request.getDraft())) {
            submitPlan(plan);
        } else if (plan.getStatus() == DidacticPlanStatus.NEEDS_CORRECTION) {
            plan.setStatus(DidacticPlanStatus.DRAFT);
        }

        didacticPlanRepository.save(plan);
        return mapToResponse(plan);
    }

    @Transactional
    public DidacticPlanResponse submit(Long id, String username) {

        DidacticPlan plan = getPlan(id);
        Account account = getAccount(username);
        validateCanEdit(plan, account);
        submitPlan(plan);
        didacticPlanRepository.save(plan);

        return mapToResponse(plan);
    }

    @Transactional
    public DidacticPlanResponse addRecommendations(
            Long id,
            String username,
            DidacticPlanRecommendationRequest request) {

        DidacticPlan plan = getPlan(id);
        Account reviewer = getAccount(username);
        validateCanRecommend(plan, reviewer);

        plan.setRecommendations(trimToNull(request.getRecommendations()));
        plan.setRecommendedBy(reviewer);
        plan.setRecommendedAt(LocalDateTime.now());
        plan.setStatus(DidacticPlanStatus.NEEDS_CORRECTION);
        didacticPlanRepository.save(plan);

        return mapToResponse(plan);
    }

    @Transactional
    public DidacticPlanResponse uploadPdf(
            Long id,
            String username,
            MultipartFile file) {

        DidacticPlan plan = getPlan(id);
        Account account = getAccount(username);
        validateCanEdit(plan, account);
        validatePdf(file);

        try {
            plan.setUploadedPdf(file.getBytes());
        } catch (IOException exception) {
            throw new BadRequestException("No se pudo leer el PDF cargado");
        }

        plan.setUploadedPdfFilename(file.getOriginalFilename());
        plan.setUploadedPdfContentType(file.getContentType());
        plan.setUploadedPdfSize(file.getSize());
        didacticPlanRepository.save(plan);

        return mapToResponse(plan);
    }

    public UploadedPdf uploadedPdf(Long id, String username) {

        DidacticPlan plan = getPlan(id);
        Account account = getAccount(username);
        validateCanView(plan, account);

        if (plan.getUploadedPdf() == null || plan.getUploadedPdf().length == 0) {
            throw new NotFoundException("La planificacion no tiene PDF cargado");
        }

        return new UploadedPdf(
                plan.getUploadedPdf(),
                plan.getUploadedPdfFilename() != null
                        ? plan.getUploadedPdfFilename()
                        : "planificacion-didactica.pdf",
                plan.getUploadedPdfContentType() != null
                        ? plan.getUploadedPdfContentType()
                        : "application/pdf");
    }

    @Transactional
    public void delete(Long id, String username) {

        DidacticPlan plan = getPlan(id);
        Account account = getAccount(username);
        validateCanEdit(plan, account);
        plan.setDeleted(true);
        plan.setDeletedAt(LocalDateTime.now());
        didacticPlanRepository.save(plan);
    }

    private Account getAccount(String username) {

        return accountRepository.findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new NotFoundException("Cuenta no encontrada"));
    }

    private Enrollment getEnrollment(Long id) {

        return enrollmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Inscripcion no encontrada"));
    }

    private DidacticPlan getPlan(Long id) {

        return didacticPlanRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException("Planificacion no encontrada"));
    }

    private void validateEnrollmentApproved(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException("Solo se puede trabajar sobre inscripciones aprobadas");
        }
    }

    private DidacticPlanAuthorType resolveAuthorType(Account account) {

        if (hasRole(account, RoleName.ROLE_TUTOR_INSTITUCIONAL)) {
            return DidacticPlanAuthorType.INSTITUTIONAL_TUTOR;
        }

        if (hasRole(account, RoleName.ROLE_ESTUDIANTE)) {
            return DidacticPlanAuthorType.STUDENT;
        }

        throw new AccessDeniedException("No puedes crear planificaciones didacticas");
    }

    private void validateCanCreateForEnrollment(
            Account author,
            DidacticPlanAuthorType authorType,
            Enrollment enrollment) {

        if (authorType == DidacticPlanAuthorType.STUDENT
                && enrollment.getAccount().getId().equals(author.getId())) {
            return;
        }

        if (authorType == DidacticPlanAuthorType.INSTITUTIONAL_TUTOR
                && InstitutionalAssignmentResolver.isAssignedInstitutionalTutor(enrollment, author)) {
            return;
        }

        throw new AccessDeniedException("No puedes crear planificaciones para esta inscripcion");
    }

    private DidacticPlan resolveSourcePlan(
            Long sourcePlanId,
            Account author,
            Enrollment enrollment) {

        if (sourcePlanId == null) {
            return null;
        }

        DidacticPlan sourcePlan = getPlan(sourcePlanId);
        validateCanView(sourcePlan, author);

        if (!Objects.equals(sourcePlan.getEnrollment().getId(), enrollment.getId())) {
            throw new BadRequestException("La planificacion base debe pertenecer a la misma inscripcion");
        }

        return sourcePlan;
    }

    private void validateCanView(DidacticPlan plan, Account account) {

        if (!canView(plan, account)) {
            throw new AccessDeniedException("No puedes ver esta planificacion");
        }
    }

    private boolean canView(DidacticPlan plan, Account account) {

        if (plan.getAuthor().getId().equals(account.getId())) {
            return true;
        }

        if (plan.getAuthorType() == DidacticPlanAuthorType.INSTITUTIONAL_TUTOR) {
            return plan.getStudent().getId().equals(account.getId());
        }

        if (plan.getStatus() == DidacticPlanStatus.DRAFT) {
            return false;
        }

        if (plan.getStudent().getId().equals(account.getId())) {
            return true;
        }

        return isUpperRoleForStudentPlan(plan, account);
    }

    private void validateCanEdit(DidacticPlan plan, Account account) {

        if (!plan.getAuthor().getId().equals(account.getId())) {
            throw new AccessDeniedException("Solo el autor puede editar esta planificacion");
        }

        if (plan.getStatus() == DidacticPlanStatus.SUBMITTED) {
            throw new BadRequestException("La planificacion enviada no se puede editar hasta recibir recomendaciones");
        }
    }

    private void validateCanRecommend(DidacticPlan plan, Account account) {

        if (plan.getAuthorType() != DidacticPlanAuthorType.STUDENT) {
            throw new AccessDeniedException("Solo se recomiendan correcciones sobre planificaciones del estudiante");
        }

        if (plan.getStatus() == DidacticPlanStatus.DRAFT) {
            throw new BadRequestException("No se puede recomendar sobre un borrador");
        }

        if (!isUpperRoleForStudentPlan(plan, account)) {
            throw new AccessDeniedException("No puedes recomendar correcciones sobre esta planificacion");
        }
    }

    private boolean isUpperRoleForStudentPlan(DidacticPlan plan, Account account) {

        if (practiceAccessService.isAdmin(account)) {
            return true;
        }

        if (practiceAccessService.isDirectorForCourse(plan.getCourse(), account)) {
            return true;
        }

        Course course = plan.getCourse();

        if (practiceAccessService.isPracticeTutorForCourse(course, account)) {
            return true;
        }

        return practiceAccessService.isInstitutionalTutorForEnrollment(plan.getEnrollment(), account);
    }

    private void applyData(DidacticPlan plan, DidacticPlanRequest request) {

        setIfNotNull(request.getTitle(), plan::setTitle);
        setIfNotNull(request.getTeacherName(), plan::setTeacherName);
        setIfNotNull(request.getAreaSubject(), plan::setAreaSubject);
        setIfNotNull(request.getPeriods(), plan::setPeriods);
        setIfNotNull(request.getWeeks(), plan::setWeeks);
        setIfNotNull(request.getStartWeek(), plan::setStartWeek);
        setIfNotNull(request.getEndWeek(), plan::setEndWeek);
        setIfNotNull(request.getGradeCourse(), plan::setGradeCourse);
        setIfNotNull(request.getParallel(), plan::setParallel);
        setIfNotNull(request.getPlanningUnitTitle(), plan::setPlanningUnitTitle);
        setIfNotNull(request.getCurricularInsertions(), plan::setCurricularInsertions);
        setIfNotNull(request.getLearningObjectives(), plan::setLearningObjectives);
        setIfNotNull(request.getEvaluationCriteria(), plan::setEvaluationCriteria);
        setIfNotNull(request.getDuaPrinciples(), plan::setDuaPrinciples);

        if (request.getWeekPlans() != null) {
            replaceWeeks(plan, request.getWeekPlans());
        }
    }

    private void replaceWeeks(DidacticPlan plan, List<DidacticPlanWeekRequest> weeks) {

        plan.getWeekPlans().clear();

        for (DidacticPlanWeekRequest request : weeks) {
            DidacticPlanWeek week = DidacticPlanWeek.builder()
                    .plan(plan)
                    .weekNumber(request.getWeekNumber())
                    .startDate(request.getStartDate())
                    .endDate(request.getEndDate())
                    .contents(request.getContents())
                    .skill(request.getSkill())
                    .methodologyActivities(request.getMethodologyActivities())
                    .resources(request.getResources())
                    .evaluationIndicators(request.getEvaluationIndicators())
                    .evaluationActivities(request.getEvaluationActivities())
                    .build();
            plan.getWeekPlans().add(week);
        }
    }

    private void applyStatus(DidacticPlan plan, DidacticPlanRequest request) {

        if (Boolean.FALSE.equals(request.getDraft())) {
            submitPlan(plan);
        } else {
            plan.setStatus(DidacticPlanStatus.DRAFT);
        }
    }

    private void submitPlan(DidacticPlan plan) {

        if (!hasStructuredContent(plan) && (plan.getUploadedPdf() == null || plan.getUploadedPdf().length == 0)) {
            throw new BadRequestException("Completa la planificacion o carga un PDF antes de enviar");
        }

        plan.setStatus(DidacticPlanStatus.SUBMITTED);
        plan.setSubmittedAt(LocalDateTime.now());
    }

    private boolean hasStructuredContent(DidacticPlan plan) {

        return hasText(plan.getPlanningUnitTitle())
                || hasText(plan.getLearningObjectives())
                || hasText(plan.getEvaluationCriteria())
                || !plan.getWeekPlans().isEmpty();
    }

    private void validatePdf(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Selecciona un archivo PDF");
        }

        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();
        boolean looksLikePdf = "application/pdf".equalsIgnoreCase(contentType)
                || (filename != null && filename.toLowerCase().endsWith(".pdf"));

        if (!looksLikePdf) {
            throw new BadRequestException("Solo se permite cargar archivos PDF");
        }

        if (file.getSize() > MAX_PDF_SIZE) {
            throw new BadRequestException("El PDF no puede superar 10 MB");
        }
    }

    private Comparator<DidacticPlan> planComparator() {

        return Comparator
                .comparing(DidacticPlan::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(DidacticPlan::getId, Comparator.reverseOrder());
    }

    private DidacticPlanResponse mapToResponse(DidacticPlan plan) {

        return DidacticPlanResponse.builder()
                .id(plan.getId())
                .enrollmentId(plan.getEnrollment().getId())
                .studentId(plan.getStudent().getId())
                .studentName(accountName(plan.getStudent()))
                .authorId(plan.getAuthor().getId())
                .authorName(accountName(plan.getAuthor()))
                .authorType(plan.getAuthorType())
                .sourcePlanId(plan.getSourcePlan() != null ? plan.getSourcePlan().getId() : null)
                .status(plan.getStatus())
                .courseName(plan.getCourse().getName())
                .educationalInstitutionName(plan.getEducationalInstitution() != null
                        ? plan.getEducationalInstitution().getName()
                        : null)
                .title(plan.getTitle())
                .teacherName(plan.getTeacherName())
                .areaSubject(plan.getAreaSubject())
                .periods(plan.getPeriods())
                .weeks(plan.getWeeks())
                .startWeek(plan.getStartWeek())
                .endWeek(plan.getEndWeek())
                .gradeCourse(plan.getGradeCourse())
                .parallel(plan.getParallel())
                .planningUnitTitle(plan.getPlanningUnitTitle())
                .curricularInsertions(plan.getCurricularInsertions())
                .learningObjectives(plan.getLearningObjectives())
                .evaluationCriteria(plan.getEvaluationCriteria())
                .duaPrinciples(plan.getDuaPrinciples())
                .weekPlans(mapWeeks(plan))
                .hasUploadedPdf(plan.getUploadedPdf() != null && plan.getUploadedPdf().length > 0)
                .uploadedPdfFilename(plan.getUploadedPdfFilename())
                .uploadedPdfSize(plan.getUploadedPdfSize())
                .recommendations(plan.getRecommendations())
                .recommendedByName(plan.getRecommendedBy() != null ? accountName(plan.getRecommendedBy()) : null)
                .recommendedAt(plan.getRecommendedAt())
                .submittedAt(plan.getSubmittedAt())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .build();
    }

    private List<DidacticPlanWeekResponse> mapWeeks(DidacticPlan plan) {

        return plan.getWeekPlans()
                .stream()
                .sorted(Comparator.comparing(DidacticPlanWeek::getWeekNumber, Comparator.nullsLast(Integer::compareTo)))
                .map(week -> DidacticPlanWeekResponse.builder()
                        .id(week.getId())
                        .weekNumber(week.getWeekNumber())
                        .startDate(week.getStartDate())
                        .endDate(week.getEndDate())
                        .contents(week.getContents())
                        .skill(week.getSkill())
                        .methodologyActivities(week.getMethodologyActivities())
                        .resources(week.getResources())
                        .evaluationIndicators(week.getEvaluationIndicators())
                        .evaluationActivities(week.getEvaluationActivities())
                        .build())
                .toList();
    }

    private String accountName(Account account) {

        Person person = account.getPerson();
        String fullName = person != null
                ? String.join(" ",
                        List.of(nullToEmpty(person.getNames()), nullToEmpty(person.getLastNames())))
                        .trim()
                : "";

        return fullName.isBlank() ? account.getUsername() : fullName;
    }

    private boolean hasRole(Account account, RoleName roleName) {

        return account.getRoles() != null
                && account.getRoles().stream().anyMatch(role -> roleName.name().equals(role.getName()));
    }

    private boolean hasText(String value) {

        return value != null && !value.trim().isEmpty();
    }

    private String trimToNull(String value) {

        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private String nullToEmpty(String value) {

        return value == null ? "" : value;
    }

    private <T> void setIfNotNull(T value, Consumer<T> setter) {

        if (value != null) {
            setter.accept(value);
        }
    }

    public record UploadedPdf(
            byte[] content,
            String filename,
            String contentType) {
    }
}
