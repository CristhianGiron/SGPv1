package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.practiceform.CreatePracticeFormOptionRequest;
import com.sgp.systemsgp.dto.practiceform.CreatePracticeFormQuestionRequest;
import com.sgp.systemsgp.dto.practiceform.CreatePracticeFormRequest;
import com.sgp.systemsgp.dto.practiceform.PracticeFormAnswerRequest;
import com.sgp.systemsgp.dto.practiceform.PracticeFormAnswerResponse;
import com.sgp.systemsgp.dto.practiceform.PracticeFormOptionResponse;
import com.sgp.systemsgp.dto.practiceform.PracticeFormQuestionResponse;
import com.sgp.systemsgp.dto.practiceform.PracticeFormQuestionTabulationResponse;
import com.sgp.systemsgp.dto.practiceform.PracticeFormResponse;
import com.sgp.systemsgp.dto.practiceform.PracticeFormResponseSummary;
import com.sgp.systemsgp.dto.practiceform.SubmitPracticeFormResponseRequest;
import com.sgp.systemsgp.dto.practiceform.UpdatePracticeFormInterpretationRequest;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.PracticeFormQuestionType;
import com.sgp.systemsgp.enums.PracticeFormStatus;
import com.sgp.systemsgp.enums.PracticeFormTargetRole;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.StudentPracticeForm;
import com.sgp.systemsgp.model.StudentPracticeFormAnswer;
import com.sgp.systemsgp.model.StudentPracticeFormOption;
import com.sgp.systemsgp.model.StudentPracticeFormQuestion;
import com.sgp.systemsgp.model.StudentPracticeFormResponse;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.StudentPracticeFormRepository;
import com.sgp.systemsgp.repository.StudentPracticeFormResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PracticeFormService {

    private static final int MAX_SCALE_RANGE = 20;

    private final StudentPracticeFormRepository practiceFormRepository;
    private final StudentPracticeFormResponseRepository practiceFormResponseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public PracticeFormResponse create(
            String username,
            CreatePracticeFormRequest request) {

        Account student = getAccount(username);
        Enrollment enrollment = getEnrollment(request.getEnrollmentId());

        validateStudentOwnsEnrollment(student, enrollment);
        validateEnrollmentApproved(enrollment);

        Institution institution = resolveEducationalInstitution(enrollment);
        Account target = resolveTarget(enrollment, request.getTargetRole(), institution);

        StudentPracticeForm form = StudentPracticeForm.builder()
                .enrollment(enrollment)
                .student(student)
                .targetAccount(target)
                .educationalInstitution(institution)
                .targetRole(request.getTargetRole())
                .status(PracticeFormStatus.SENT)
                .title(normalizeRequiredText(request.getTitle(), "El título del formulario es obligatorio"))
                .description(normalizeText(request.getDescription()))
                .build();

        replaceQuestions(form, request.getQuestions());

        practiceFormRepository.save(form);

        return mapToResponse(form, true);
    }

    public List<PracticeFormResponse> myForms(String username) {

        return practiceFormRepository
                .findByStudent_UsernameAndDeletedFalseOrderByCreatedAtDesc(username)
                .stream()
                .map(form -> mapToResponse(form, false))
                .toList();
    }

    public List<PracticeFormResponse> assignedForms(String username) {

        return practiceFormRepository
                .findByTargetAccount_UsernameAndDeletedFalseOrderByCreatedAtDesc(username)
                .stream()
                .map(form -> mapToResponse(form, false))
                .toList();
    }

    public PracticeFormResponse getById(
            Long id,
            String username) {

        StudentPracticeForm form = getForm(id);
        Account account = getAccount(username);

        validateCanView(form, account);

        return mapToResponse(form, true);
    }

    @Transactional
    public PracticeFormResponse submitResponse(
            Long id,
            String username,
            SubmitPracticeFormResponseRequest request) {

        StudentPracticeForm form = getForm(id);
        Account respondent = getAccount(username);

        validateCanRespond(form, respondent);
        validateCanReceiveResponse(form);

        Map<Long, PracticeFormAnswerRequest> answersByQuestion = indexAnswerRequests(request.getAnswers());

        StudentPracticeFormResponse response = StudentPracticeFormResponse.builder()
                .form(form)
                .respondent(respondent)
                .submittedAt(LocalDateTime.now())
                .build();

        Set<Long> consumedQuestionIds = new HashSet<>();
        for (StudentPracticeFormQuestion question : sortedQuestions(form)) {
            PracticeFormAnswerRequest answerRequest = answersByQuestion.get(question.getId());
            if (answerRequest != null) {
                consumedQuestionIds.add(question.getId());
            }

            if (!hasMeaningfulAnswer(question, answerRequest)) {
                if (question.isRequired()) {
                    throw new BadRequestException(
                            "La pregunta '" + question.getPrompt() + "' es obligatoria");
                }
                continue;
            }

            response.getAnswers().add(buildAnswer(response, question, answerRequest));
        }

        validateNoUnknownAnswers(answersByQuestion, consumedQuestionIds);

        if (response.getAnswers().isEmpty()) {
            throw new BadRequestException(
                    "Debe responder al menos una pregunta del formulario");
        }

        form.setResponse(response);
        form.setStatus(PracticeFormStatus.ANSWERED);
        form.setAnsweredAt(response.getSubmittedAt());

        practiceFormResponseRepository.save(response);

        return mapToResponse(form, true);
    }

    @Transactional
    public PracticeFormResponse updateInterpretation(
            Long id,
            Long questionId,
            String username,
            UpdatePracticeFormInterpretationRequest request) {

        StudentPracticeForm form = getForm(id);
        Account student = getAccount(username);

        validateStudentOwnsForm(student, form);

        StudentPracticeFormQuestion question = findQuestion(form, questionId);

        if (question.getType() != PracticeFormQuestionType.OPEN_TEXT) {
            throw new BadRequestException(
                    "Solo las preguntas abiertas admiten interpretación manual");
        }

        question.setStudentInterpretation(normalizeText(request.getInterpretation()));

        practiceFormRepository.save(form);

        return mapToResponse(form, true);
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

    private StudentPracticeForm getForm(Long id) {

        return practiceFormRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Formulario de práctica no encontrado"));
    }

    private void validateStudentOwnsEnrollment(
            Account student,
            Enrollment enrollment) {

        if (enrollment.getAccount() == null
                || !Objects.equals(enrollment.getAccount().getId(), student.getId())) {
            throw new AccessDeniedException(
                    "No puedes crear formularios para una inscripción que no te pertenece");
        }
    }

    private void validateStudentOwnsForm(
            Account student,
            StudentPracticeForm form) {

        if (form.getStudent() == null
                || !Objects.equals(form.getStudent().getId(), student.getId())) {
            throw new AccessDeniedException(
                    "Solo el estudiante creador puede interpretar este formulario");
        }
    }

    private void validateEnrollmentApproved(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException(
                    "Solo se pueden crear formularios para inscripciones aprobadas");
        }

        if (!isActiveCourseEnrollment(enrollment)) {
            throw new BadRequestException(
                    "El curso de la inscripción no está activo");
        }
    }

    private boolean isActiveCourseEnrollment(Enrollment enrollment) {

        Course course = enrollment.getCourse();

        return course != null
                && course.isActive()
                && !course.isDeleted();
    }

    private Institution resolveEducationalInstitution(Enrollment enrollment) {

        Institution institution = InstitutionalAssignmentResolver.educationalInstitution(enrollment);

        if (institution == null) {
            throw new BadRequestException(
                    "La inscripción debe tener tutor institucional con institución educativa asignada");
        }

        validateEducationalInstitution(institution);

        return institution;
    }

    private void validateEducationalInstitution(Institution institution) {

        if (!institution.isActive() || institution.isDeleted()) {
            throw new BadRequestException(
                    "La institución educativa receptora no está activa");
        }

        if (institution.getType() != InstitutionType.ESCUELA
                && institution.getType() != InstitutionType.COLEGIO) {
            throw new BadRequestException(
                    "La institución receptora debe ser una escuela o colegio");
        }
    }

    private Account resolveTarget(
            Enrollment enrollment,
            PracticeFormTargetRole targetRole,
            Institution institution) {

        if (targetRole == PracticeFormTargetRole.INSTITUTIONAL_TUTOR) {
            Account tutor = InstitutionalAssignmentResolver.institutionalTutor(enrollment);

            if (tutor == null) {
                throw new BadRequestException(
                        "La inscripción no tiene tutor institucional asignado");
            }

            validateActiveAccount(tutor, "El tutor institucional asignado no está disponible");
            return tutor;
        }

        if (targetRole == PracticeFormTargetRole.INSTITUTION_DIRECTOR) {
            List<Account> directors = accountRepository
                    .findByInstitution_IdAndRoles_NameAndDeletedFalseAndEnabledTrueAndLockedFalse(
                            institution.getId(),
                            RoleName.ROLE_DIRECTORA_INSTITUCION.name());

            return directors
                    .stream()
                    .min(Comparator.comparing(Account::getId))
                    .orElseThrow(() -> new BadRequestException(
                            "La institución educativa no tiene directora activa asignada"));
        }

        throw new BadRequestException(
                "Debe seleccionar quién responderá el formulario");
    }

    private void validateActiveAccount(
            Account account,
            String message) {

        if (account.isDeleted()
                || !account.isEnabled()
                || account.isLocked()) {
            throw new BadRequestException(message);
        }
    }

    private void validateCanView(
            StudentPracticeForm form,
            Account account) {

        if (isStudentOwner(form, account)
                || isTargetAccount(form, account)
                || isAssignedPracticeTutor(form, account)
                || hasRole(account, RoleName.ROLE_ADMIN)
                || hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            return;
        }

        throw new AccessDeniedException(
                "No puedes ver este formulario de práctica");
    }

    private void validateCanRespond(
            StudentPracticeForm form,
            Account respondent) {

        if (!isTargetAccount(form, respondent)) {
            throw new AccessDeniedException(
                    "Solo la persona asignada puede responder este formulario");
        }
    }

    private void validateCanReceiveResponse(StudentPracticeForm form) {

        if (form.getStatus() != PracticeFormStatus.SENT) {
            throw new BadRequestException(
                    "Este formulario ya fue respondido");
        }

        if (form.getResponse() != null
                || practiceFormResponseRepository.existsByForm_Id(form.getId())) {
            throw new BadRequestException(
                    "Este formulario ya tiene una respuesta registrada");
        }
    }

    private boolean isStudentOwner(
            StudentPracticeForm form,
            Account account) {

        return form.getStudent() != null
                && account != null
                && Objects.equals(form.getStudent().getId(), account.getId());
    }

    private boolean isTargetAccount(
            StudentPracticeForm form,
            Account account) {

        return form.getTargetAccount() != null
                && account != null
                && Objects.equals(form.getTargetAccount().getId(), account.getId());
    }

    private boolean isAssignedPracticeTutor(
            StudentPracticeForm form,
            Account account) {

        Course course = form.getEnrollment() != null
                ? form.getEnrollment().getCourse()
                : null;

        return course != null
                && course.getPracticeTutor() != null
                && account != null
                && Objects.equals(course.getPracticeTutor().getId(), account.getId());
    }

    private boolean hasRole(
            Account account,
            RoleName roleName) {

        return account.getRoles() != null
                && account.getRoles()
                        .stream()
                        .anyMatch(role -> roleName.name().equals(role.getName()));
    }

    private void replaceQuestions(
            StudentPracticeForm form,
            List<CreatePracticeFormQuestionRequest> questionRequests) {

        if (questionRequests == null || questionRequests.isEmpty()) {
            throw new BadRequestException(
                    "Debe agregar al menos una pregunta");
        }

        form.getQuestions().clear();

        for (int index = 0; index < questionRequests.size(); index++) {
            CreatePracticeFormQuestionRequest request = questionRequests.get(index);
            int questionOrder = index + 1;
            PracticeFormQuestionType type = request.getType();

            validateQuestionRequest(request, questionOrder);

            StudentPracticeFormQuestion question = StudentPracticeFormQuestion.builder()
                    .form(form)
                    .questionOrder(questionOrder)
                    .type(type)
                    .prompt(normalizeRequiredText(
                            request.getPrompt(),
                            "La pregunta " + questionOrder + " es obligatoria"))
                    .required(request.getRequired() == null || request.getRequired())
                    .scaleMin(type == PracticeFormQuestionType.SCALE ? request.getScaleMin() : null)
                    .scaleMax(type == PracticeFormQuestionType.SCALE ? request.getScaleMax() : null)
                    .build();

            if (requiresOptions(type)) {
                List<String> labels = normalizeOptionLabels(request.getOptions());

                for (int optionIndex = 0; optionIndex < labels.size(); optionIndex++) {
                    question.getOptions().add(StudentPracticeFormOption.builder()
                            .question(question)
                            .label(labels.get(optionIndex))
                            .optionOrder(optionIndex + 1)
                            .build());
                }
            }

            form.getQuestions().add(question);
        }
    }

    private void validateQuestionRequest(
            CreatePracticeFormQuestionRequest request,
            int questionOrder) {

        if (request == null) {
            throw new BadRequestException(
                    "La pregunta " + questionOrder + " no puede estar vacía");
        }

        if (request.getType() == null) {
            throw new BadRequestException(
                    "Debe seleccionar el tipo de la pregunta " + questionOrder);
        }

        normalizeRequiredText(
                request.getPrompt(),
                "La pregunta " + questionOrder + " es obligatoria");

        if (requiresOptions(request.getType())) {
            List<String> labels = normalizeOptionLabels(request.getOptions());

            if (labels.size() < 2) {
                throw new BadRequestException(
                        "La pregunta " + questionOrder + " debe tener al menos dos opciones");
            }

            return;
        }

        if (request.getType() == PracticeFormQuestionType.SCALE) {
            validateScale(request, questionOrder);
        }
    }

    private void validateScale(
            CreatePracticeFormQuestionRequest request,
            int questionOrder) {

        if (request.getScaleMin() == null || request.getScaleMax() == null) {
            throw new BadRequestException(
                    "La pregunta " + questionOrder + " debe indicar mínimo y máximo de escala");
        }

        if (request.getScaleMin() >= request.getScaleMax()) {
            throw new BadRequestException(
                    "La escala de la pregunta " + questionOrder + " debe tener mínimo menor que máximo");
        }

        if (request.getScaleMax() - request.getScaleMin() > MAX_SCALE_RANGE) {
            throw new BadRequestException(
                    "La escala de la pregunta " + questionOrder + " no puede superar "
                            + MAX_SCALE_RANGE + " valores");
        }
    }

    private boolean requiresOptions(PracticeFormQuestionType type) {

        return type == PracticeFormQuestionType.SINGLE_CHOICE
                || type == PracticeFormQuestionType.MULTIPLE_CHOICE;
    }

    private List<String> normalizeOptionLabels(List<CreatePracticeFormOptionRequest> options) {

        if (options == null) {
            return List.of();
        }

        List<String> labels = options
                .stream()
                .map(option -> option != null ? option.getLabel() : null)
                .map(this::normalizeText)
                .filter(StringUtils::hasText)
                .toList();

        Set<String> uniqueLabels = new LinkedHashSet<>(labels);

        if (uniqueLabels.size() != labels.size()) {
            throw new BadRequestException(
                    "Las opciones de una pregunta no pueden repetirse");
        }

        return new ArrayList<>(uniqueLabels);
    }

    private Map<Long, PracticeFormAnswerRequest> indexAnswerRequests(
            List<PracticeFormAnswerRequest> answerRequests) {

        if (answerRequests == null || answerRequests.isEmpty()) {
            throw new BadRequestException(
                    "Debe enviar al menos una respuesta");
        }

        Map<Long, PracticeFormAnswerRequest> answersByQuestion = new LinkedHashMap<>();

        for (PracticeFormAnswerRequest answerRequest : answerRequests) {
            if (answerRequest == null) {
                throw new BadRequestException(
                        "Una respuesta no puede estar vacía");
            }

            Long questionId = answerRequest.getQuestionId();

            if (questionId == null) {
                throw new BadRequestException(
                        "Cada respuesta debe indicar la pregunta");
            }

            if (answersByQuestion.containsKey(questionId)) {
                throw new BadRequestException(
                        "No se puede responder dos veces la misma pregunta");
            }

            answersByQuestion.put(questionId, answerRequest);
        }

        return answersByQuestion;
    }

    private void validateNoUnknownAnswers(
            Map<Long, PracticeFormAnswerRequest> answersByQuestion,
            Set<Long> consumedQuestionIds) {

        for (Long questionId : answersByQuestion.keySet()) {
            if (!consumedQuestionIds.contains(questionId)) {
                throw new BadRequestException(
                        "Una de las respuestas no pertenece a este formulario");
            }
        }
    }

    private StudentPracticeFormAnswer buildAnswer(
            StudentPracticeFormResponse response,
            StudentPracticeFormQuestion question,
            PracticeFormAnswerRequest request) {

        PracticeFormQuestionType type = question.getType();
        StudentPracticeFormAnswer answer = StudentPracticeFormAnswer.builder()
                .response(response)
                .question(question)
                .build();

        if (type == PracticeFormQuestionType.OPEN_TEXT) {
            answer.setTextAnswer(normalizeRequiredAnswerText(question, request.getTextAnswer()));
            return answer;
        }

        if (type == PracticeFormQuestionType.YES_NO) {
            answer.setBooleanAnswer(request.getBooleanAnswer());
            return answer;
        }

        if (type == PracticeFormQuestionType.SCALE) {
            validateNumericAnswer(question, request.getNumberAnswer(), true);
            answer.setNumberAnswer(request.getNumberAnswer());
            return answer;
        }

        if (type == PracticeFormQuestionType.NUMBER) {
            validateNumericAnswer(question, request.getNumberAnswer(), false);
            answer.setNumberAnswer(request.getNumberAnswer());
            return answer;
        }

        List<String> selectedOptions = normalizeSelectedOptions(request.getSelectedOptions());
        validateSelectedOptions(question, selectedOptions);
        answer.setSelectedOptions(selectedOptions);

        return answer;
    }

    private boolean hasMeaningfulAnswer(
            StudentPracticeFormQuestion question,
            PracticeFormAnswerRequest request) {

        if (request == null) {
            return false;
        }

        return switch (question.getType()) {
            case OPEN_TEXT -> StringUtils.hasText(request.getTextAnswer());
            case YES_NO -> request.getBooleanAnswer() != null;
            case SCALE, NUMBER -> request.getNumberAnswer() != null;
            case SINGLE_CHOICE, MULTIPLE_CHOICE -> !normalizeSelectedOptions(request.getSelectedOptions()).isEmpty();
        };
    }

    private String normalizeRequiredAnswerText(
            StudentPracticeFormQuestion question,
            String value) {

        String normalized = normalizeText(value);

        if (question.isRequired() && !StringUtils.hasText(normalized)) {
            throw new BadRequestException(
                    "La pregunta '" + question.getPrompt() + "' es obligatoria");
        }

        return normalized;
    }

    private void validateNumericAnswer(
            StudentPracticeFormQuestion question,
            BigDecimal value,
            boolean scaleAnswer) {

        if (question.isRequired() && value == null) {
            throw new BadRequestException(
                    "La pregunta '" + question.getPrompt() + "' es obligatoria");
        }

        if (value == null) {
            return;
        }

        if (!scaleAnswer) {
            return;
        }

        if (!isWholeNumber(value)) {
            throw new BadRequestException(
                    "La respuesta de escala debe ser un número entero");
        }

        BigDecimal min = BigDecimal.valueOf(question.getScaleMin());
        BigDecimal max = BigDecimal.valueOf(question.getScaleMax());

        if (value.compareTo(min) < 0 || value.compareTo(max) > 0) {
            throw new BadRequestException(
                    "La respuesta de escala debe estar entre "
                            + question.getScaleMin() + " y " + question.getScaleMax());
        }
    }

    private boolean isWholeNumber(BigDecimal value) {

        return value.stripTrailingZeros().scale() <= 0;
    }

    private List<String> normalizeSelectedOptions(List<String> selectedOptions) {

        if (selectedOptions == null) {
            return List.of();
        }

        List<String> normalizedOptions = selectedOptions
                .stream()
                .map(this::normalizeText)
                .filter(StringUtils::hasText)
                .toList();

        Set<String> uniqueOptions = new LinkedHashSet<>(normalizedOptions);

        if (uniqueOptions.size() != normalizedOptions.size()) {
            throw new BadRequestException(
                    "No se puede seleccionar la misma opción más de una vez");
        }

        return new ArrayList<>(uniqueOptions);
    }

    private void validateSelectedOptions(
            StudentPracticeFormQuestion question,
            List<String> selectedOptions) {

        if (selectedOptions.isEmpty()) {
            if (question.isRequired()) {
                throw new BadRequestException(
                        "La pregunta '" + question.getPrompt() + "' es obligatoria");
            }
            return;
        }

        if (question.getType() == PracticeFormQuestionType.SINGLE_CHOICE
                && selectedOptions.size() != 1) {
            throw new BadRequestException(
                    "La pregunta '" + question.getPrompt() + "' permite una sola opción");
        }

        Set<String> validOptions = question.getOptions()
                .stream()
                .map(StudentPracticeFormOption::getLabel)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        for (String selectedOption : selectedOptions) {
            if (!validOptions.contains(selectedOption)) {
                throw new BadRequestException(
                        "La opción '" + selectedOption + "' no pertenece a la pregunta '"
                                + question.getPrompt() + "'");
            }
        }
    }

    private StudentPracticeFormQuestion findQuestion(
            StudentPracticeForm form,
            Long questionId) {

        return form.getQuestions()
                .stream()
                .filter(question -> Objects.equals(question.getId(), questionId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException(
                        "Pregunta no encontrada en este formulario"));
    }

    private List<StudentPracticeFormQuestion> sortedQuestions(StudentPracticeForm form) {

        return form.getQuestions()
                .stream()
                .sorted(Comparator.comparing(StudentPracticeFormQuestion::getQuestionOrder))
                .toList();
    }

    private List<StudentPracticeFormOption> sortedOptions(StudentPracticeFormQuestion question) {

        return question.getOptions()
                .stream()
                .sorted(Comparator.comparing(StudentPracticeFormOption::getOptionOrder))
                .toList();
    }

    private String normalizeRequiredText(
            String value,
            String message) {

        String normalized = normalizeText(value);

        if (!StringUtils.hasText(normalized)) {
            throw new BadRequestException(message);
        }

        return normalized;
    }

    private String normalizeText(String value) {

        return StringUtils.hasText(value)
                ? value.trim()
                : null;
    }

    private PracticeFormResponse mapToResponse(
            StudentPracticeForm form,
            boolean includeQuestions) {

        Enrollment enrollment = form.getEnrollment();
        Course course = enrollment != null
                ? enrollment.getCourse()
                : null;
        Account student = form.getStudent();
        Person person = student != null
                ? student.getPerson()
                : null;

        return PracticeFormResponse.builder()
                .id(form.getId())
                .enrollmentId(enrollment != null ? enrollment.getId() : null)
                .courseId(course != null ? course.getId() : null)
                .courseName(course != null ? course.getName() : null)
                .student(student != null ? student.getUsername() : null)
                .studentFullName(person != null ? joinNames(person.getNames(), person.getLastNames()) : null)
                .educationalInstitutionId(
                        form.getEducationalInstitution() != null
                                ? form.getEducationalInstitution().getId()
                                : null)
                .educationalInstitutionName(
                        form.getEducationalInstitution() != null
                                ? form.getEducationalInstitution().getName()
                                : null)
                .targetRole(form.getTargetRole())
                .target(fullNameOrUsername(form.getTargetAccount()))
                .status(form.getStatus())
                .title(form.getTitle())
                .description(form.getDescription())
                .createdAt(form.getCreatedAt())
                .answeredAt(form.getAnsweredAt())
                .response(mapResponseSummary(form.getResponse()))
                .questions(includeQuestions ? mapQuestions(form) : List.of())
                .build();
    }

    private List<PracticeFormQuestionResponse> mapQuestions(StudentPracticeForm form) {

        Map<Long, StudentPracticeFormAnswer> answerByQuestion = form.getResponse() != null
                ? form.getResponse()
                        .getAnswers()
                        .stream()
                        .collect(Collectors.toMap(
                                answer -> answer.getQuestion().getId(),
                                Function.identity(),
                                (left, right) -> left,
                                LinkedHashMap::new))
                : Map.of();

        return sortedQuestions(form)
                .stream()
                .map(question -> mapQuestion(
                        question,
                        answerByQuestion.get(question.getId()),
                        form.getResponse()))
                .toList();
    }

    private PracticeFormQuestionResponse mapQuestion(
            StudentPracticeFormQuestion question,
            StudentPracticeFormAnswer answer,
            StudentPracticeFormResponse response) {

        return PracticeFormQuestionResponse.builder()
                .id(question.getId())
                .order(question.getQuestionOrder())
                .type(question.getType())
                .prompt(question.getPrompt())
                .required(question.isRequired())
                .tabulable(isTabulable(question.getType()))
                .scaleMin(question.getScaleMin())
                .scaleMax(question.getScaleMax())
                .options(mapOptions(question))
                .answer(mapAnswer(answer))
                .tabulation(mapTabulation(question, response))
                .studentInterpretation(question.getStudentInterpretation())
                .build();
    }

    private List<PracticeFormOptionResponse> mapOptions(StudentPracticeFormQuestion question) {

        return sortedOptions(question)
                .stream()
                .map(option -> PracticeFormOptionResponse.builder()
                        .id(option.getId())
                        .label(option.getLabel())
                        .order(option.getOptionOrder())
                        .build())
                .toList();
    }

    private PracticeFormAnswerResponse mapAnswer(StudentPracticeFormAnswer answer) {

        if (answer == null) {
            return null;
        }

        return PracticeFormAnswerResponse.builder()
                .questionId(answer.getQuestion().getId())
                .textAnswer(answer.getTextAnswer())
                .numberAnswer(answer.getNumberAnswer())
                .booleanAnswer(answer.getBooleanAnswer())
                .selectedOptions(answer.getSelectedOptions())
                .build();
    }

    private PracticeFormResponseSummary mapResponseSummary(StudentPracticeFormResponse response) {

        if (response == null) {
            return null;
        }

        return PracticeFormResponseSummary.builder()
                .id(response.getId())
                .respondent(fullNameOrUsername(response.getRespondent()))
                .submittedAt(response.getSubmittedAt())
                .build();
    }

    private PracticeFormQuestionTabulationResponse mapTabulation(
            StudentPracticeFormQuestion question,
            StudentPracticeFormResponse response) {

        if (!isTabulable(question.getType())) {
            return PracticeFormQuestionTabulationResponse.builder()
                    .questionId(question.getId())
                    .tabulable(false)
                    .counts(Map.of())
                    .numericCount(0L)
                    .build();
        }

        List<StudentPracticeFormAnswer> answers = response == null
                ? List.of()
                : response.getAnswers()
                        .stream()
                        .filter(answer -> Objects.equals(answer.getQuestion().getId(), question.getId()))
                        .toList();

        return switch (question.getType()) {
            case SINGLE_CHOICE, MULTIPLE_CHOICE -> mapChoiceTabulation(question, answers);
            case YES_NO -> mapYesNoTabulation(question, answers);
            case SCALE -> mapNumericTabulation(question, answers, true);
            case NUMBER -> mapNumericTabulation(question, answers, false);
            case OPEN_TEXT -> PracticeFormQuestionTabulationResponse.builder()
                    .questionId(question.getId())
                    .tabulable(false)
                    .counts(Map.of())
                    .numericCount(0L)
                    .build();
        };
    }

    private boolean isTabulable(PracticeFormQuestionType type) {

        return type != PracticeFormQuestionType.OPEN_TEXT;
    }

    private PracticeFormQuestionTabulationResponse mapChoiceTabulation(
            StudentPracticeFormQuestion question,
            List<StudentPracticeFormAnswer> answers) {

        Map<String, Long> counts = sortedOptions(question)
                .stream()
                .collect(Collectors.toMap(
                        StudentPracticeFormOption::getLabel,
                        option -> 0L,
                        (left, right) -> left,
                        LinkedHashMap::new));

        for (StudentPracticeFormAnswer answer : answers) {
            for (String option : answer.getSelectedOptions()) {
                counts.merge(option, 1L, Long::sum);
            }
        }

        return PracticeFormQuestionTabulationResponse.builder()
                .questionId(question.getId())
                .tabulable(true)
                .counts(counts)
                .numericCount(0L)
                .build();
    }

    private PracticeFormQuestionTabulationResponse mapYesNoTabulation(
            StudentPracticeFormQuestion question,
            List<StudentPracticeFormAnswer> answers) {

        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("Sí", 0L);
        counts.put("No", 0L);

        for (StudentPracticeFormAnswer answer : answers) {
            if (answer.getBooleanAnswer() == null) {
                continue;
            }

            counts.merge(Boolean.TRUE.equals(answer.getBooleanAnswer()) ? "Sí" : "No", 1L, Long::sum);
        }

        return PracticeFormQuestionTabulationResponse.builder()
                .questionId(question.getId())
                .tabulable(true)
                .counts(counts)
                .numericCount(0L)
                .build();
    }

    private PracticeFormQuestionTabulationResponse mapNumericTabulation(
            StudentPracticeFormQuestion question,
            List<StudentPracticeFormAnswer> answers,
            boolean includeCounts) {

        List<BigDecimal> values = answers
                .stream()
                .map(StudentPracticeFormAnswer::getNumberAnswer)
                .filter(Objects::nonNull)
                .toList();

        Map<String, Long> counts = includeCounts
                ? initializeScaleCounts(question)
                : Map.of();

        if (includeCounts) {
            for (BigDecimal value : values) {
                counts.merge(formatNumber(value), 1L, Long::sum);
            }
        }

        return PracticeFormQuestionTabulationResponse.builder()
                .questionId(question.getId())
                .tabulable(true)
                .counts(counts)
                .numericCount((long) values.size())
                .numericAverage(average(values))
                .numericMin(values.stream().min(BigDecimal::compareTo).orElse(null))
                .numericMax(values.stream().max(BigDecimal::compareTo).orElse(null))
                .build();
    }

    private Map<String, Long> initializeScaleCounts(StudentPracticeFormQuestion question) {

        Map<String, Long> counts = new LinkedHashMap<>();

        if (question.getScaleMin() == null || question.getScaleMax() == null) {
            return counts;
        }

        for (int value = question.getScaleMin(); value <= question.getScaleMax(); value++) {
            counts.put(String.valueOf(value), 0L);
        }

        return counts;
    }

    private BigDecimal average(List<BigDecimal> values) {

        if (values.isEmpty()) {
            return null;
        }

        BigDecimal sum = values
                .stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return sum.divide(
                BigDecimal.valueOf(values.size()),
                2,
                RoundingMode.HALF_UP)
                .stripTrailingZeros();
    }

    private String formatNumber(BigDecimal value) {

        return value.stripTrailingZeros().toPlainString();
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
