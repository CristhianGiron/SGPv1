package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.activityevaluation.ActivityEvaluationAspectRequest;
import com.sgp.systemsgp.dto.activityevaluation.ActivityEvaluationAspectResponse;
import com.sgp.systemsgp.dto.activityevaluation.ActivityEvaluationResponse;
import com.sgp.systemsgp.dto.activityevaluation.CreateActivityEvaluationRequest;
import com.sgp.systemsgp.dto.activityevaluation.UpdateActivityEvaluationRequest;
import com.sgp.systemsgp.enums.ActivityEvaluationAspectType;
import com.sgp.systemsgp.enums.ActivityEvaluationPracticeType;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.ActivityEvaluation;
import com.sgp.systemsgp.model.ActivityEvaluationAspect;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.ActivityEvaluationRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityEvaluationService {

    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final ActivityEvaluationRepository activityEvaluationRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;
    private final InstitutionRepository institutionRepository;
    private final PdfExportService pdfExportService;

    @Transactional
    public ActivityEvaluationResponse create(
            String username,
            CreateActivityEvaluationRequest request) {

        Account tutor = getAccount(username);
        Enrollment enrollment = getEnrollment(request.getEnrollmentId());

        validateEnrollmentApproved(enrollment);
        validatePracticeTutorCanManage(enrollment.getCourse(), tutor);

        if (activityEvaluationRepository.existsByEnrollment_IdAndDeletedFalse(
                enrollment.getId())) {
            throw new BadRequestException(
                    "Ya existe una evaluacion de actividades para esta inscripcion");
        }

        Institution institution = resolveEducationalInstitution(
                enrollment,
                request.getEducationalInstitutionId());

        ActivityEvaluation evaluation = ActivityEvaluation.builder()
                .enrollment(enrollment)
                .student(enrollment.getAccount())
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .evaluatedBy(tutor)
                .build();

        applyCreateData(evaluation, request, institution);
        validateComplete(evaluation);

        activityEvaluationRepository.save(evaluation);

        return mapToResponse(evaluation);
    }

    public List<ActivityEvaluationResponse> myEvaluations(String username) {

        return activityEvaluationRepository
                .findByStudent_UsernameAndDeletedFalse(username)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<ActivityEvaluationResponse> managedEvaluations(String username) {

        return activityEvaluationRepository
                .findByCourse_PracticeTutor_UsernameAndDeletedFalse(username)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public ActivityEvaluationResponse getDefaults(
            String username,
            Long enrollmentId) {

        if (enrollmentId == null) {
            throw new BadRequestException(
                    "Debe seleccionar la inscripcion que se va a evaluar");
        }

        Account tutor = getAccount(username);
        Enrollment enrollment = getEnrollment(enrollmentId);

        validateEnrollmentApproved(enrollment);
        validatePracticeTutorCanManage(enrollment.getCourse(), tutor);

        Institution institution = resolveEducationalInstitution(
                enrollment,
                null);

        ActivityEvaluation evaluation = ActivityEvaluation.builder()
                .enrollment(enrollment)
                .student(enrollment.getAccount())
                .course(enrollment.getCourse())
                .educationalInstitution(institution)
                .evaluatedBy(tutor)
                .build();

        copyInstitutionSnapshot(evaluation, institution);
        copyStudentSnapshot(evaluation, evaluation.getStudent());
        copyCoursePracticeType(evaluation);

        return mapToResponse(evaluation);
    }

    public ActivityEvaluationResponse getById(
            Long id,
            String username) {

        ActivityEvaluation evaluation = getEvaluation(id);
        Account account = getAccount(username);

        validateCanView(evaluation, account);

        return mapToResponse(evaluation);
    }

    public byte[] exportPdf(
            Long id,
            String username) {

        ActivityEvaluation evaluation = getEvaluation(id);
        Account account = getAccount(username);

        validateCanView(evaluation, account);

        ActivityEvaluationResponse response = mapToResponse(evaluation);

        return pdfExportService.createActivityEvaluationPdf(
                new PdfExportService.PdfActivityEvaluation(
                        response.getEducationalInstitutionName(),
                        response.getPracticeType(),
                        response.getStudentFullName(),
                        response.getStudentIdentification(),
                        response.getCourseName(),
                        response.getAcademicPeriod(),
                        response.getDevelopmentMode(),
                        response.getHoursCompleted(),
                        response.getActivitiesCompletionPercentage(),
                        response.getEvaluationDate(),
                        accountFullName(evaluation.getEvaluatedBy()),
                        "DOCENTE TUTOR DE PRACTICAS",
                        evaluationAspects(response.getAspects())));
    }

    @Transactional
    public ActivityEvaluationResponse update(
            Long id,
            String username,
            UpdateActivityEvaluationRequest request) {

        ActivityEvaluation evaluation = getEvaluation(id);
        Account tutor = getAccount(username);

        validatePracticeTutorCanManage(evaluation.getCourse(), tutor);

        if (request.getEducationalInstitutionId() != null) {
            Institution institution = resolveEducationalInstitution(
                    evaluation.getEnrollment(),
                    request.getEducationalInstitutionId());

            evaluation.setEducationalInstitution(institution);
        }

        copyInstitutionSnapshot(evaluation, evaluation.getEducationalInstitution());
        copyStudentSnapshot(evaluation, evaluation.getStudent());
        copyCoursePracticeType(evaluation);
        applyUpdateData(evaluation, request);
        evaluation.setEvaluatedBy(tutor);
        validateComplete(evaluation);

        activityEvaluationRepository.save(evaluation);

        return mapToResponse(evaluation);
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

    private ActivityEvaluation getEvaluation(Long id) {

        return activityEvaluationRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Evaluacion de actividades no encontrada"));
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
                    "Solo se puede evaluar una inscripcion aprobada");
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
                    "Solo el tutor de practicas asignado puede llenar esta evaluacion");
        }
    }

    private void validateCanView(
            ActivityEvaluation evaluation,
            Account account) {

        if (evaluation.getStudent().getId().equals(account.getId())
                || isAssignedPracticeTutor(evaluation, account)
                || hasRole(account, RoleName.ROLE_ADMIN)
                || hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            return;
        }

        throw new AccessDeniedException(
                "No puedes ver esta evaluacion de actividades");
    }

    private boolean isAssignedPracticeTutor(
            ActivityEvaluation evaluation,
            Account account) {

        Course course = evaluation.getCourse();

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
            ActivityEvaluation evaluation,
            CreateActivityEvaluationRequest request,
            Institution institution) {

        copyInstitutionSnapshot(evaluation, institution);
        copyStudentSnapshot(evaluation, evaluation.getStudent());
        copyCoursePracticeType(evaluation);

        evaluation.setDevelopmentMode(request.getDevelopmentMode());
        evaluation.setHoursCompleted(request.getHoursCompleted());
        evaluation.setActivitiesCompletionPercentage(
                request.getActivitiesCompletionPercentage());
        evaluation.setEvaluationDate(request.getEvaluationDate());

        replaceAspects(evaluation, request.getAspects());
    }

    private void applyUpdateData(
            ActivityEvaluation evaluation,
            UpdateActivityEvaluationRequest request) {

        setIfNotNull(request.getDevelopmentMode(), evaluation::setDevelopmentMode);
        setIfNotNull(request.getHoursCompleted(), evaluation::setHoursCompleted);
        setIfNotNull(
                request.getActivitiesCompletionPercentage(),
                evaluation::setActivitiesCompletionPercentage);
        setIfNotNull(request.getEvaluationDate(), evaluation::setEvaluationDate);

        if (request.getAspects() != null) {
            replaceAspects(evaluation, request.getAspects());
        }
    }

    private void copyInstitutionSnapshot(
            ActivityEvaluation evaluation,
            Institution institution) {

        evaluation.setEducationalInstitutionName(institution.getName());
        evaluation.setEducationalInstitutionCode(institution.getCode());
        evaluation.setEducationalInstitutionAddress(institution.getAddress());
        evaluation.setEducationalInstitutionPhone(institution.getPhone());
        evaluation.setEducationalInstitutionEmail(institution.getEmail());
    }

    private void copyStudentSnapshot(
            ActivityEvaluation evaluation,
            Account student) {

        Person person = student.getPerson();

        if (person != null) {
            evaluation.setStudentFullName(joinNames(
                    person.getNames(),
                    person.getLastNames()));
            evaluation.setStudentIdentification(person.getCedula());
            evaluation.setStudentEmail(person.getInstitutionalEmail());
            evaluation.setStudentPhone(person.getPhone());
        }

        if (student.getAcademicCycle() != null) {
            evaluation.setAcademicPeriod(student.getAcademicCycle().getName());
        }
    }

    private void replaceAspects(
            ActivityEvaluation evaluation,
            List<ActivityEvaluationAspectRequest> aspects) {

        evaluation.getAspects().clear();

        if (aspects == null) {
            return;
        }

        for (ActivityEvaluationAspectRequest aspectRequest : aspects) {
            ActivityEvaluationAspect aspect = ActivityEvaluationAspect.builder()
                    .evaluation(evaluation)
                    .aspectType(aspectRequest.getAspectType())
                    .item(aspectRequest.getItem())
                    .level(aspectRequest.getLevel())
                    .build();

            evaluation.getAspects().add(aspect);
        }
    }

    private void copyCoursePracticeType(ActivityEvaluation evaluation) {

        evaluation.setPracticeType(resolveCoursePracticeType(evaluation.getCourse()));
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

    private void validateComplete(ActivityEvaluation evaluation) {

        requireText(evaluation.getEducationalInstitutionName(),
                "La institucion educativa receptora es obligatoria");
        requireText(evaluation.getStudentFullName(),
                "El nombre del estudiante es obligatorio");
        requireText(evaluation.getStudentIdentification(),
                "La cedula del estudiante es obligatoria");
        requireText(evaluation.getAcademicPeriod(),
                "El periodo academico es obligatorio");

        if (evaluation.getPracticeType() == null) {
            throw new BadRequestException(
                    "El tipo de practicas es obligatorio");
        }

        if (evaluation.getDevelopmentMode() == null) {
            throw new BadRequestException(
                    "El desarrollo de actividades es obligatorio");
        }

        validateAspects(evaluation);
        validateAccreditation(evaluation);
    }

    private void validateAspects(ActivityEvaluation evaluation) {

        if (evaluation.getAspects().isEmpty()) {
            throw new BadRequestException(
                    "Debe registrar al menos un aspecto evaluado");
        }

        boolean hasGeneral = false;
        boolean hasSpecific = false;

        for (ActivityEvaluationAspect aspect : evaluation.getAspects()) {
            if (aspect.getAspectType() == null
                    || !hasText(aspect.getItem())
                    || aspect.getLevel() == null) {
                throw new BadRequestException(
                        "Cada aspecto evaluado debe tener tipo, item y nivel alcanzado");
            }

            if (aspect.getAspectType() == ActivityEvaluationAspectType.GENERAL) {
                hasGeneral = true;
            }

            if (aspect.getAspectType() == ActivityEvaluationAspectType.ESPECIFICO) {
                hasSpecific = true;
            }
        }

        if (!hasGeneral || !hasSpecific) {
            throw new BadRequestException(
                    "Debe registrar aspectos generales y aspectos especificos");
        }
    }

    private void validateAccreditation(ActivityEvaluation evaluation) {

        if (evaluation.getHoursCompleted() == null
                || evaluation.getHoursCompleted() < 0) {
            throw new BadRequestException(
                    "El numero de horas cumplidas debe ser mayor o igual a cero");
        }

        BigDecimal percentage = evaluation.getActivitiesCompletionPercentage();

        if (percentage == null
                || percentage.compareTo(BigDecimal.ZERO) < 0
                || percentage.compareTo(ONE_HUNDRED) > 0) {
            throw new BadRequestException(
                    "El porcentaje de actividades cumplidas debe estar entre 0 y 100");
        }

        if (evaluation.getEvaluationDate() == null) {
            throw new BadRequestException(
                    "La fecha de evaluacion es obligatoria");
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

    private List<PdfExportService.PdfActivityEvaluationAspect> evaluationAspects(
            List<ActivityEvaluationAspectResponse> aspects) {

        if (aspects == null) {
            return List.of();
        }

        return aspects.stream()
                .map(aspect -> new PdfExportService.PdfActivityEvaluationAspect(
                        aspect.getAspectType(),
                        aspect.getItem(),
                        aspect.getLevel(),
                        aspect.getScore()))
                .toList();
    }

    private ActivityEvaluationResponse mapToResponse(
            ActivityEvaluation evaluation) {

        int totalScore = evaluation.getAspects()
                .stream()
                .filter(aspect -> aspect.getLevel() != null)
                .mapToInt(aspect -> aspect.getLevel().getScore())
                .sum();

        BigDecimal averageScore = evaluation.getAspects().isEmpty()
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(totalScore)
                        .divide(
                                BigDecimal.valueOf(evaluation.getAspects().size()),
                                2,
                                RoundingMode.HALF_UP);

        return ActivityEvaluationResponse.builder()
                .id(evaluation.getId())
                .enrollmentId(evaluation.getEnrollment().getId())
                .courseId(evaluation.getCourse().getId())
                .courseName(evaluation.getCourse().getName())
                .studentId(evaluation.getStudent().getId())
                .studentUsername(evaluation.getStudent().getUsername())
                .educationalInstitutionId(evaluation.getEducationalInstitution().getId())
                .educationalInstitutionName(evaluation.getEducationalInstitutionName())
                .educationalInstitutionCode(evaluation.getEducationalInstitutionCode())
                .educationalInstitutionAddress(evaluation.getEducationalInstitutionAddress())
                .educationalInstitutionPhone(evaluation.getEducationalInstitutionPhone())
                .educationalInstitutionEmail(evaluation.getEducationalInstitutionEmail())
                .practiceType(
                        evaluation.getPracticeType() != null
                                ? evaluation.getPracticeType().name()
                                : null)
                .studentFullName(evaluation.getStudentFullName())
                .studentIdentification(evaluation.getStudentIdentification())
                .studentEmail(evaluation.getStudentEmail())
                .studentPhone(evaluation.getStudentPhone())
                .academicPeriod(evaluation.getAcademicPeriod())
                .developmentMode(
                        evaluation.getDevelopmentMode() != null
                                ? evaluation.getDevelopmentMode().name()
                                : null)
                .aspects(mapAspects(evaluation))
                .totalScore(totalScore)
                .averageScore(averageScore)
                .hoursCompleted(evaluation.getHoursCompleted())
                .activitiesCompletionPercentage(
                        evaluation.getActivitiesCompletionPercentage())
                .evaluationDate(evaluation.getEvaluationDate())
                .evaluatedBy(evaluation.getEvaluatedBy().getUsername())
                .createdAt(evaluation.getCreatedAt())
                .updatedAt(evaluation.getUpdatedAt())
                .build();
    }

    private List<ActivityEvaluationAspectResponse> mapAspects(
            ActivityEvaluation evaluation) {

        return evaluation.getAspects()
                .stream()
                .sorted(Comparator.comparing(
                        ActivityEvaluationAspect::getAspectType,
                        Comparator.nullsLast(ActivityEvaluationAspectType::compareTo)))
                .map(aspect -> ActivityEvaluationAspectResponse.builder()
                        .id(aspect.getId())
                        .aspectType(
                                aspect.getAspectType() != null
                                        ? aspect.getAspectType().name()
                                        : null)
                        .item(aspect.getItem())
                        .level(
                                aspect.getLevel() != null
                                        ? aspect.getLevel().name()
                                        : null)
                        .score(
                                aspect.getLevel() != null
                                        ? aspect.getLevel().getScore()
                                        : null)
                        .build())
                .toList();
    }
}
