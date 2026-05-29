package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.course.CourseResponse;
import com.sgp.systemsgp.dto.course.CreateCourseRequest;
import com.sgp.systemsgp.dto.course.UpdateCoursePracticeProfileRequest;
import com.sgp.systemsgp.dto.coursegroup.CourseGroupResponse;
import com.sgp.systemsgp.dto.coursegroup.CreateCourseGroupRequest;
import com.sgp.systemsgp.dto.coursegroup.UpdateCourseGroupRequest;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.CourseGroup;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.Subject;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CourseGroupRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.SubjectRepository;
import com.sgp.systemsgp.specification.CourseSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseService {

    private static final String UNL_CODE = "UNL";

    private final CourseRepository courseRepository;
    private final CourseGroupRepository courseGroupRepository;
    private final AccountRepository accountRepository;
    private final SubjectRepository subjectRepository;

    @Transactional
    public CourseResponse createCourse(
            String username,
            CreateCourseRequest request) {

        Account creator = accountRepository
                .findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new NotFoundException(
                        "Cuenta no encontrada"));

        Subject subject = null;

        if (request.getSubjectId() != null) {
            subject = subjectRepository
                    .findByIdAndDeletedFalse(request.getSubjectId())
                    .orElseThrow(() -> new NotFoundException(
                            "Asignatura no encontrada"));
        }

        Course course = Course.builder()
                .name(request.getName())
                .description(request.getDescription())
                .code(generateCode())
                .capacity(request.getCapacity())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .subject(subject)
                .createdBy(creator)
                .active(true)
                .build();

        courseRepository.save(course);

        return mapToResponse(course);
    }

    public List<CourseResponse> getAll(boolean includeInactive) {

        return courseRepository.findByDeletedFalse()
                .stream()
                .filter(course -> includeInactive || course.isActive())
                .map(this::mapToResponse)
                .toList();
    }

    public CourseResponse getById(Long id) {

        return mapToResponse(getCourse(id));
    }

    @Transactional
    public CourseResponse updatePracticeProfile(
            String username,
            Long courseId,
            UpdateCoursePracticeProfileRequest request) {

        Account tutor = getAccount(username);
        Course course = getCourse(courseId);

        validatePracticeTutorCanManage(course, tutor);

        // Cambio solicitado: estos datos comunes se guardan en el curso.
        course.setCurricularOrganizationUnit(request.getCurricularOrganizationUnit());
        course.setIntegrativeKnowledgeProject(request.getIntegrativeKnowledgeProject());
        course.setPracticeType(request.getPracticeType());
        course.setGeneralObjective(request.getGeneralObjective());
        course.setSpecificObjective1(request.getSpecificObjective1());
        course.setSpecificObjective2(request.getSpecificObjective2());
        course.setSpecificObjective3(request.getSpecificObjective3());

        courseRepository.save(course);

        return mapToResponse(course);
    }

    public List<CourseGroupResponse> getGroups(
            String username,
            Long courseId) {

        Account account = getAccount(username);
        Course course = getCourse(courseId);

        if (!hasRole(account, RoleName.ROLE_ADMIN)
                && !hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            validatePracticeTutorCanManage(course, account);
        }

        return courseGroupRepository
                .findByCourse_IdAndDeletedFalse(courseId)
                .stream()
                .filter(group -> hasRole(account, RoleName.ROLE_ADMIN) || group.isActive())
                .map(this::mapGroupToResponse)
                .toList();
    }

    @Transactional
    public CourseGroupResponse createGroup(
            String username,
            Long courseId,
            CreateCourseGroupRequest request) {

        Account creator = accountRepository
                .findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new NotFoundException(
                        "Cuenta no encontrada"));
        Course course = getCourse(courseId);

        validateGroupManagerCanManage(course, creator);
        validateGroupNameAvailable(course.getId(), request.getName());

        CourseGroup group = CourseGroup.builder()
                .course(course)
                .name(request.getName().trim())
                .description(request.getDescription())
                .capacity(request.getCapacity())
                .createdBy(creator)
                .active(true)
                .build();

        if (request.getInstitutionalTutorId() != null) {
            group.setInstitutionalTutor(resolveInstitutionalTutor(request.getInstitutionalTutorId()));
        }

        courseGroupRepository.save(group);

        return mapGroupToResponse(group);
    }

    @Transactional
    public CourseGroupResponse updateGroup(
            String username,
            Long groupId,
            UpdateCourseGroupRequest request) {

        Account tutor = getAccount(username);
        CourseGroup group = getGroup(groupId);

        validateGroupManagerCanManage(group.getCourse(), tutor);

        if (hasText(request.getName())
                && !group.getName().equalsIgnoreCase(request.getName().trim())) {
            validateGroupNameAvailable(group.getCourse().getId(), request.getName());
            group.setName(request.getName().trim());
        }

        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }

        if (request.getCapacity() != null) {
            group.setCapacity(request.getCapacity());
        }

        if (request.getInstitutionalTutorId() != null) {
            group.setInstitutionalTutor(resolveInstitutionalTutor(request.getInstitutionalTutorId()));
        }

        if (request.getActive() != null) {
            group.setActive(request.getActive());
        }

        courseGroupRepository.save(group);

        return mapGroupToResponse(group);
    }

    @Transactional
    public CourseGroupResponse assignGroupInstitutionalTutor(
            String username,
            Long groupId,
            Long accountId) {

        Account practiceTutor = getAccount(username);
        CourseGroup group = getGroup(groupId);
        validateGroupManagerCanManage(group.getCourse(), practiceTutor);
        group.setInstitutionalTutor(resolveInstitutionalTutor(accountId));

        courseGroupRepository.save(group);

        return mapGroupToResponse(group);
    }

    @Transactional
    public CourseGroupResponse disableGroup(
            String username,
            Long groupId) {

        Account tutor = getAccount(username);
        CourseGroup group = getGroup(groupId);
        validateGroupManagerCanManage(group.getCourse(), tutor);
        group.setActive(false);
        courseGroupRepository.save(group);

        return mapGroupToResponse(group);
    }

    @Transactional
    public CourseGroupResponse enableGroup(
            String username,
            Long groupId) {

        Account tutor = getAccount(username);
        CourseGroup group = getGroup(groupId);
        validateGroupManagerCanManage(group.getCourse(), tutor);
        group.setActive(true);
        courseGroupRepository.save(group);

        return mapGroupToResponse(group);
    }

    @Transactional
    public CourseResponse assignInstitutionalTutor(
            Long courseId,
            Long accountId) {

        Course course = getCourse(courseId);
        Account tutor = getAccount(accountId);

        validateAssignableAccount(tutor);
        validateRole(tutor, RoleName.ROLE_TUTOR_INSTITUCIONAL);
        validateInstitutionalTutor(tutor);

        course.setInstitutionalTutor(tutor);
        courseRepository.save(course);

        return mapToResponse(course);
    }

    @Transactional
    public CourseResponse assignPracticeTutor(
            Long courseId,
            Long accountId) {

        Course course = getCourse(courseId);
        Account tutor = getAccount(accountId);

        validateAssignableAccount(tutor);
        validateRole(tutor, RoleName.ROLE_TUTOR_PRACTICAS);
        validatePracticeTutor(tutor);

        course.setPracticeTutor(tutor);
        courseRepository.save(course);

        return mapToResponse(course);
    }

    @Transactional
    public void disable(Long id) {

        Course course = getCourse(id);
        course.setActive(false);
        courseRepository.save(course);
    }

    @Transactional
    public void enable(Long id) {

        Course course = getCourse(id);
        course.setActive(true);
        courseRepository.save(course);
    }

    @Transactional
    public void lock(Long id) {

        Course course = getCourse(id);
        course.setLocked(true);
        courseRepository.save(course);
    }

    @Transactional
    public void unlock(Long id) {

        Course course = getCourse(id);
        course.setLocked(false);
        courseRepository.save(course);
    }

    @Transactional
    public void softDelete(Long id) {

        Course course = getCourse(id);
        course.setDeleted(true);
        course.setActive(false);
        courseRepository.save(course);
    }

    @Transactional
    public void restore(Long id) {

        Course course = getExistingCourse(id);
        course.setDeleted(false);
        course.setDeletedAt(null);
        course.setActive(true);
        courseRepository.save(course);
    }

    @Transactional
    public void forceDelete(Long id) {

        Course course = getExistingCourse(id);
        courseRepository.delete(course);
    }

    public Page<CourseResponse> search(
            String name,
            Boolean active,
            Boolean locked,
            String institutionalTutor,
            String practiceTutor,
            Pageable pageable) {

        return courseRepository
                .findAll(
                        CourseSpecification.search(
                                name,
                                active,
                                locked,
                                institutionalTutor,
                                practiceTutor),
                        pageable)
                .map(this::mapToResponse);
    }

    private Course getCourse(Long id) {

        return courseRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Curso no encontrado"));
    }

    private Course getExistingCourse(Long id) {

        return courseRepository
                .findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Curso no encontrado"));
    }

    private CourseGroup getGroup(Long id) {

        return courseGroupRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Grupo no encontrado"));
    }

    private Account getAccount(Long id) {

        return accountRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Cuenta no encontrada"));
    }

    private Account getAccount(String username) {

        return accountRepository
                .findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new NotFoundException(
                        "Cuenta no encontrada"));
    }

    private Account resolveInstitutionalTutor(Long accountId) {

        Account tutor = getAccount(accountId);

        validateAssignableAccount(tutor);
        validateRole(tutor, RoleName.ROLE_TUTOR_INSTITUCIONAL);
        validateInstitutionalTutor(tutor);

        return tutor;
    }

    private void validateAssignableAccount(Account account) {

        if (!account.isEnabled()) {
            throw new BadRequestException(
                    "La cuenta del tutor está desactivada");
        }

        if (account.isLocked()) {
            throw new BadRequestException(
                    "La cuenta del tutor está bloqueada");
        }
    }

    private void validateRole(
            Account account,
            RoleName roleName) {

        boolean hasRole = account.getRoles()
                .stream()
                .anyMatch(role -> roleName.name().equals(role.getName()));

        if (!hasRole) {
            throw new BadRequestException(
                    "La cuenta no tiene el rol requerido");
        }
    }

    private boolean hasRole(
            Account account,
            RoleName roleName) {

        return account.getRoles() != null
                && account.getRoles()
                .stream()
                .anyMatch(role -> roleName.name().equals(role.getName()));
    }

    private void validateInstitutionalTutor(Account tutor) {

        Institution institution = requireInstitution(tutor);

        validateActiveInstitution(institution);

        if (!institution.isAgreementActive()) {
            throw new BadRequestException(
                    "La institución no tiene convenio activo");
        }

        if (!institution.isAcceptsInterns()) {
            throw new BadRequestException(
                    "La institución no acepta practicantes");
        }

        InstitutionType type = institution.getType();

        if (type != InstitutionType.ESCUELA
                && type != InstitutionType.COLEGIO) {
            throw new BadRequestException(
                    "El tutor institucional debe pertenecer a una escuela o colegio");
        }
    }

    private void validatePracticeTutor(Account tutor) {

        validateUnlTutorInstitution(
                tutor,
                "El tutor de prácticas debe pertenecer a la UNL");
    }

    private void validatePracticeTutorCanManage(
            Course course,
            Account tutor) {

        if (!hasRole(tutor, RoleName.ROLE_TUTOR_PRACTICAS)
                || course.getPracticeTutor() == null
                || !course.getPracticeTutor().getId().equals(tutor.getId())) {
            throw new BadRequestException(
                    "Solo el tutor de practicas asignado puede gestionar estos datos del curso");
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

    private void validateUnlTutorInstitution(
            Account tutor,
            String message) {

        Institution institution = requireInstitution(tutor);

        validateActiveInstitution(institution);

        if (institution.getType() != InstitutionType.UNIVERSIDAD) {
            throw new BadRequestException(
                    "La institución del tutor debe ser una universidad");
        }

        if (institution.getCode() == null
                || !institution.getCode().equalsIgnoreCase(UNL_CODE)) {
            throw new BadRequestException(message);
        }
    }

    private Institution requireInstitution(Account tutor) {

        Institution institution = tutor.getInstitution();

        if (institution == null) {
            throw new BadRequestException(
                    "El tutor no tiene institución");
        }

        return institution;
    }

    private void validateActiveInstitution(Institution institution) {

        if (institution.isDeleted()) {
            throw new BadRequestException(
                    "La institución fue eliminada");
        }

        if (!institution.isActive()) {
            throw new BadRequestException(
                    "La institución está inactiva");
        }
    }

    private String generateCode() {

        long sequence = courseRepository.count() + 1;
        String code = buildCode(sequence);

        while (courseRepository.existsByCode(code)) {
            sequence++;
            code = buildCode(sequence);
        }

        return code;
    }

    private String buildCode(long sequence) {

        return "CUR-"
                + LocalDate.now().getYear()
                + "-"
                + String.format("%03d", sequence);
    }

    private void validateGroupNameAvailable(
            Long courseId,
            String name) {

        if (!hasText(name)) {
            throw new BadRequestException(
                    "El nombre del grupo es obligatorio");
        }

        if (courseGroupRepository.existsByCourse_IdAndNameIgnoreCaseAndDeletedFalse(
                courseId,
                name.trim())) {
            throw new BadRequestException(
                    "Ya existe un grupo con ese nombre en el curso");
        }
    }

    private boolean hasText(String value) {

        return value != null && !value.isBlank();
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

    private CourseGroupResponse mapGroupToResponse(CourseGroup group) {

        Account institutionalTutor = group.getInstitutionalTutor();
        Institution institution = institutionalTutor != null
                ? institutionalTutor.getInstitution()
                : null;

        return CourseGroupResponse.builder()
                .id(group.getId())
                .courseId(group.getCourse().getId())
                .courseName(group.getCourse().getName())
                .name(group.getName())
                .description(group.getDescription())
                .capacity(group.getCapacity())
                .institutionalTutorId(
                        institutionalTutor != null
                                ? institutionalTutor.getId()
                                : null)
                .institutionalTutor(fullNameOrUsername(institutionalTutor))
                .educationalInstitutionId(
                        institution != null
                                ? institution.getId()
                                : null)
                .educationalInstitutionName(
                        institution != null
                                ? institution.getName()
                                : null)
                .active(group.isActive())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }

    private CourseResponse mapToResponse(Course course) {

        return CourseResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .description(course.getDescription())
                .curricularOrganizationUnit(course.getCurricularOrganizationUnit())
                .integrativeKnowledgeProject(course.getIntegrativeKnowledgeProject())
                .practiceType(course.getPracticeType())
                .generalObjective(course.getGeneralObjective())
                .specificObjective1(course.getSpecificObjective1())
                .specificObjective2(course.getSpecificObjective2())
                .specificObjective3(course.getSpecificObjective3())
                .code(course.getCode())
                .capacity(course.getCapacity())
                .startDate(course.getStartDate())
                .endDate(course.getEndDate())
                .active(course.isActive())
                .locked(course.isLocked())
                .createdBy(
                        course.getCreatedBy() != null
                                ? course.getCreatedBy().getUsername()
                                : null)
                .institutionalTutor(
                        course.getInstitutionalTutor() != null
                                ? course.getInstitutionalTutor().getUsername()
                                : null)
                .practiceTutor(
                        course.getPracticeTutor() != null
                                ? course.getPracticeTutor().getUsername()
                                : null)
                .subjectId(
                        course.getSubject() != null
                                ? course.getSubject().getId()
                                : null)
                .subject(
                        course.getSubject() != null
                                ? course.getSubject().getName()
                                : null)
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}
