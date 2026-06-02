package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.admin.CreateAccountAdminRequest;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Grade;
import com.sgp.systemsgp.model.GradeParallel;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.AcademicCycleRepository;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CareerRepository;
import com.sgp.systemsgp.repository.GradeParallelRepository;
import com.sgp.systemsgp.repository.GradeRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import com.sgp.systemsgp.repository.RoleRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminAccountService {

        private final AccountRepository accountRepository;
        private final RoleRepository roleRepository;
        private final AcademicCycleRepository academicCycleRepository;
        private final CareerRepository careerRepository;
        private final GradeRepository gradeRepository;
        private final GradeParallelRepository gradeParallelRepository;
        private final InstitutionRepository institutionRepository;
        private final PasswordEncoder passwordEncoder;

        @Transactional
        public Long createAccount(CreateAccountAdminRequest request) {

                if (accountRepository.existsByUsername(request.getUsername())) {
                        throw new BadRequestException("El username ya está en uso");
                }

                if (request.getInstitutionalEmail() != null
                                && accountRepository.existsByPersonInstitutionalEmail(
                                                request.getInstitutionalEmail())) {
                        throw new BadRequestException("El correo ya está en uso");
                }

                String roleName = resolveRoleName(request.getRole());

                Role role = roleRepository.findByName(roleName)
                                .orElseThrow(() -> new BadRequestException("Rol inválido"));

                AcademicCycle academicCycle = resolveAcademicCycle(
                                role.getName(),
                                request.getAcademicCycleId());

                Career career = resolveCareer(
                                role.getName(),
                                request.getCareerId());

                Institution institution = resolveInstitution(
                                role.getName(),
                                request.getInstitutionId());

                Grade grade = resolveGrade(
                                role.getName(),
                                request.getGradeId(),
                                institution);

                GradeParallel gradeParallel = resolveGradeParallel(
                                role.getName(),
                                request.getGradeParallelId(),
                                institution);

                Person person = Person.builder()
                                .names(request.getNames())
                                .lastNames(request.getLastNames())
                                .cedula(request.getCedula())
                                .institutionalEmail(request.getInstitutionalEmail())
                                .phone(request.getPhone())
                                .address(request.getAddress())
                                .build();

                Account account = Account.builder()
                                .username(request.getUsername())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .person(person)
                                .roles(Set.of(role))
                                .academicCycle(academicCycle)
                                .career(career)
                                .grade(grade)
                                .gradeParallel(gradeParallel)
                                .institution(institution)
                                .enabled(true)
                                .passwordChangeRequired(requiresInitialPasswordChange(role.getName()))
                                .build();

                Account saved = accountRepository.save(account);

                return saved.getId();
        }

        @Transactional
        public void disable(Long id) {

                Account account = getById(id);

                account.setEnabled(false);

                accountRepository.save(account);
        }

        @Transactional
        public void enable(Long id) {

                Account account = getById(id);

                account.setEnabled(true);

                accountRepository.save(account);
        }

        @Transactional
        public void lock(Long id) {

                Account account = getById(id);

                account.setLocked(true);

                accountRepository.save(account);
        }

        @Transactional
        public void unlock(Long id) {

                Account account = getById(id);

                account.setLocked(false);

                accountRepository.save(account);
        }

        @Transactional
        public void softDelete(Long id) {

                Account account = getById(id);

                account.setDeleted(true);

                account.setDeletedAt(LocalDateTime.now());

                account.setEnabled(false);

                accountRepository.save(account);
        }

        @Transactional
        public void restore(Long id) {

                Account account = getById(id);

                account.setDeleted(false);

                account.setDeletedAt(null);

                account.setEnabled(true);

                accountRepository.save(account);
        }

        @Transactional
        public void assignAcademicCycle(
                        Long id,
                        Long academicCycleId) {

                Account account = getById(id);

                boolean isStudent = account.getRoles()
                                .stream()
                                .anyMatch(role -> role.getName()
                                                .equals(RoleName.ROLE_ESTUDIANTE.name()));

                if (!isStudent) {
                        throw new BadRequestException(
                                        "Solo los estudiantes pueden tener ciclo académico");
                }

                AcademicCycle academicCycle = academicCycleRepository
                                .findByIdAndDeletedFalse(academicCycleId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Ciclo académico no encontrado"));

                account.setAcademicCycle(academicCycle);

                accountRepository.save(account);
        }

        private Account getById(Long id) {

                return accountRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException(
                                                "Cuenta no encontrada"));
        }

        private AcademicCycle resolveAcademicCycle(
                        String roleName,
                        Long academicCycleId) {

                if (!canHaveAcademicCycle(roleName)) {

                        if (academicCycleId != null) {
                                throw new BadRequestException(
                                                "Este rol no puede tener ciclo académico");
                        }

                        return null;
                }

                if (academicCycleId == null) {
                        throw new BadRequestException(
                                        "El ciclo académico es obligatorio para este rol");
                }

                return academicCycleRepository
                                .findByIdAndDeletedFalse(academicCycleId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Ciclo académico no encontrado"));
        }

        private boolean canHaveAcademicCycle(String roleName) {

                return RoleName.ROLE_ESTUDIANTE.name().equals(roleName);
        }

        private Career resolveCareer(
                        String roleName,
                        Long careerId) {

                if (!canHaveCareer(roleName)) {

                        if (careerId != null) {
                                throw new BadRequestException(
                                                "Este rol no puede vincularse a una carrera");
                        }

                        return null;
                }

                if (careerId == null) {
                        throw new BadRequestException(
                                        "La carrera es obligatoria para este rol");
                }

                Career career = careerRepository
                                .findByIdAndDeletedFalse(careerId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Carrera no encontrada"));

                if (!career.isActive() || career.isDeleted()) {
                        throw new BadRequestException(
                                        "La carrera no está activa");
                }

                return career;
        }

        private boolean canHaveCareer(String roleName) {

                return RoleName.ROLE_DIRECTOR_PRACTICAS.name().equals(roleName);
        }

        private Grade resolveGrade(
                        String roleName,
                        Long gradeId,
                        Institution institution) {

                if (!canHaveGrade(roleName)) {

                        if (gradeId != null) {
                                throw new BadRequestException(
                                                "Este rol no puede vincularse a un grado");
                        }

                        return null;
                }

                if (gradeId == null) {
                        throw new BadRequestException(
                                        "El grado es obligatorio para este rol");
                }

                Grade grade = gradeRepository
                                .findByIdAndDeletedFalse(gradeId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Grado no encontrado"));

                validateGradeScope(grade, institution);

                return grade;
        }

        private boolean canHaveGrade(String roleName) {

                return RoleName.ROLE_DIRECTORA_INSTITUCION.name().equals(roleName);
        }

        private GradeParallel resolveGradeParallel(
                        String roleName,
                        Long gradeParallelId,
                        Institution institution) {

                if (!canHaveGradeParallel(roleName)) {

                        if (gradeParallelId != null) {
                                throw new BadRequestException(
                                                "Este rol no puede vincularse a un paralelo");
                        }

                        return null;
                }

                if (gradeParallelId == null) {
                        throw new BadRequestException(
                                        "El paralelo es obligatorio para este rol");
                }

                GradeParallel parallel = gradeParallelRepository
                                .findByIdAndDeletedFalse(gradeParallelId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Paralelo no encontrado"));

                if (!parallel.isActive() || parallel.isDeleted()) {
                        throw new BadRequestException(
                                        "El paralelo no está activo");
                }

                validateGradeScope(parallel.getGrade(), institution);

                return parallel;
        }

        private boolean canHaveGradeParallel(String roleName) {

                return RoleName.ROLE_TUTOR_INSTITUCIONAL.name().equals(roleName);
        }

        private void validateGradeScope(
                        Grade grade,
                        Institution institution) {

                if (grade == null || grade.isDeleted() || !grade.isActive()) {
                        throw new BadRequestException(
                                        "El grado no está activo");
                }

                if (institution == null
                                || grade.getInstitution() == null
                                || !grade.getInstitution().getId().equals(institution.getId())) {
                        throw new BadRequestException(
                                        "El grado debe pertenecer a la institución seleccionada");
                }
        }

        private String resolveRoleName(String requestedRole) {

                if (requestedRole == null || requestedRole.isBlank()) {
                        throw new BadRequestException("Rol inválido");
                }

                try {
                        return RoleName.valueOf(requestedRole).name();
                } catch (IllegalArgumentException exception) {
                        throw new BadRequestException("Rol inválido");
                }
        }

        private Institution resolveInstitution(
                        String roleName,
                        Long institutionId) {

                if (!canHaveInstitution(roleName)) {

                        if (institutionId != null) {
                                throw new BadRequestException(
                                                "Este rol no puede vincularse a una institución");
                        }

                        return null;
                }

                if (institutionId == null) {
                        throw new BadRequestException(
                                        "La institución es obligatoria para este tipo de cuenta");
                }

                Institution institution = institutionRepository
                                .findByIdAndDeletedFalse(institutionId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Institución no encontrada"));

                if (!institution.isActive() || institution.isDeleted()) {
                        throw new BadRequestException(
                                        "La institución no está activa");
                }

                validateInstitutionByRole(roleName, institution);

                return institution;
        }

        private boolean canHaveInstitution(String roleName) {

                return RoleName.ROLE_DIRECTORA_INSTITUCION.name().equals(roleName)
                                || RoleName.ROLE_TUTOR_INSTITUCIONAL.name().equals(roleName)
                                || RoleName.ROLE_ADMIN.name().equals(roleName)
                                || RoleName.ROLE_TUTOR_PRACTICAS.name().equals(roleName);
        }

        private boolean requiresInitialPasswordChange(String roleName) {

                return !RoleName.ROLE_ESTUDIANTE.name().equals(roleName);
        }

        private void validateInstitutionByRole(
                        String roleName,
                        Institution institution) {

                InstitutionType institutionType = institution.getType();

                if (isSchoolOrCollege(institutionType)) {
                        validateSchoolOrCollegeRole(roleName);
                        return;
                }

                if (institutionType == InstitutionType.UNIVERSIDAD) {
                        validateUniversityRole(roleName);
                        return;
                }

                throw new BadRequestException(
                                "Tipo de institución no permitido para vincular cuentas");
        }

        private boolean isSchoolOrCollege(InstitutionType institutionType) {

                return institutionType == InstitutionType.ESCUELA
                                || institutionType == InstitutionType.COLEGIO;
        }

        private void validateSchoolOrCollegeRole(String roleName) {

                if (!RoleName.ROLE_DIRECTORA_INSTITUCION.name().equals(roleName)
                                && !RoleName.ROLE_TUTOR_INSTITUCIONAL.name().equals(roleName)) {

                        throw new BadRequestException(
                                        "Solo el tutor institucional o la directora de institución pueden vincularse a una escuela o colegio");
                }
        }

        private void validateUniversityRole(String roleName) {

                if (!RoleName.ROLE_ADMIN.name().equals(roleName)
                                && !RoleName.ROLE_TUTOR_PRACTICAS.name().equals(roleName)) {

                        throw new BadRequestException(
                                        "Solo administradores o tutores de prácticas pueden vincularse a una universidad");
                }
        }
}
