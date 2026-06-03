package com.sgp.systemsgp.service;

import com.sgp.systemsgp.config.JwtService;

import com.sgp.systemsgp.dto.auth.AuthResponse;
import com.sgp.systemsgp.dto.auth.LoginRequest;
import com.sgp.systemsgp.dto.auth.RegisterRequest;

import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;

import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Grade;
import com.sgp.systemsgp.model.GradeParallel;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.Role;

import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.AcademicCycleRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.GradeParallelRepository;
import com.sgp.systemsgp.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

        private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;

        private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
                        "image/jpeg",
                        "image/png",
                        "image/webp");

        private static final Set<String> PUBLIC_REGISTRATION_ROLES = Set.of(
                        RoleName.ROLE_ESTUDIANTE.name(),
                        RoleName.ROLE_TUTOR_INSTITUCIONAL.name(),
                        RoleName.ROLE_TUTOR_PRACTICAS.name());

        private final AccountRepository accountRepository;

        private final RoleRepository roleRepository;

        private final AcademicCycleRepository academicCycleRepository;

        private final CourseRepository courseRepository;

        private final GradeParallelRepository gradeParallelRepository;

        private final AuthenticationManager authenticationManager;

        private final PasswordEncoder passwordEncoder;

        private final JwtService jwtService;

        private final CustomUserDetailsService userDetailsService;

        /*
         * REGISTRO PUBLICO
         */
        @Transactional
        public AuthResponse register(RegisterRequest request, MultipartFile file) {

                if (accountRepository.existsByUsername(request.getUsername())) {
                        throw new BadRequestException("El username ya está en uso");
                }

                if (request.getInstitutionalEmail() != null
                                && accountRepository.existsByPersonInstitutionalEmail(
                                                request.getInstitutionalEmail())) {
                        throw new BadRequestException("El correo ya está en uso");
                }

                String roleName = resolvePublicRoleName(request.getRole());

                Role role = roleRepository.findByName(roleName)
                                .orElseThrow(() -> new NotFoundException("Rol no configurado"));

                Course practiceTutorCourse = resolvePracticeTutorCourse(
                                roleName,
                                request.getCourseId());

                GradeParallel gradeParallel = resolveInstitutionalTutorParallel(
                                roleName,
                                request.getGradeParallelId());

                AcademicCycle academicCycle = resolveAcademicCycle(
                                roleName,
                                request.getAcademicCycleId(),
                                practiceTutorCourse);

                Institution institution = resolveInstitution(
                                roleName,
                                request.getInstitutionId(),
                                practiceTutorCourse,
                                gradeParallel);

                byte[] image = null;
                String imageType = null;

                if (file != null && !file.isEmpty()) {
                        validateProfileImage(file);

                        try {
                                image = file.getBytes();
                                imageType = file.getContentType();
                        } catch (Exception e) {
                                throw new BadRequestException("Error procesando imagen");
                        }
                }

                Person person = Person.builder()
                                .names(request.getNames())
                                .lastNames(request.getLastNames())
                                .phone(request.getPhone())
                                .cedula(request.getCedula())
                                .address(request.getAddress())
                                .institutionalEmail(request.getInstitutionalEmail())
                                .build();

                Account account = Account.builder()
                                .username(request.getUsername())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .person(person)
                                .roles(Set.of(role))
                                .enabled(true)
                                .academicCycle(academicCycle)
                                .institution(institution)
                                .grade(gradeParallel != null ? gradeParallel.getGrade() : null)
                                .gradeParallel(gradeParallel)
                                .profileImage(image)
                                .profileImageType(imageType)
                                .build();

                accountRepository.save(account);

                if (practiceTutorCourse != null) {
                        practiceTutorCourse.setPracticeTutor(account);
                        courseRepository.save(practiceTutorCourse);
                }

                UserDetails user = userDetailsService
                                .loadUserByUsername(account.getUsername());

                String token = jwtService.generateToken(user);

                return AuthResponse.builder()
                                .accessToken(token)
                                .refreshToken(jwtService.generateRefreshToken(user))
                                .username(account.getUsername())
                                .passwordChangeRequired(account.isPasswordChangeRequired())
                                .build();
        }

        /*
         * LOGIN
         */
        public AuthResponse login(LoginRequest request) {

                // 1. Autenticación (Spring Security valida password)
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getUsername(),
                                                request.getPassword()));

                // 2. Cargar usuario
                UserDetails user = userDetailsService
                                .loadUserByUsername(request.getUsername());

                Account account = accountRepository
                                .findByUsernameAndDeletedFalse(user.getUsername())
                                .orElseThrow(() -> new NotFoundException("Cuenta no encontrada"));

                // 3. Generar tokens
                String accessToken = jwtService.generateToken(user);
                String refreshToken = jwtService.generateRefreshToken(user);

                return AuthResponse.builder()
                                .accessToken(accessToken)
                                .refreshToken(refreshToken)
                                .username(account.getUsername())
                                .passwordChangeRequired(account.isPasswordChangeRequired())
                                .build();
        }

        private void validateProfileImage(MultipartFile file) {

                if (file.getSize() > MAX_IMAGE_SIZE) {

                        throw new BadRequestException("La imagen supera el límite de 5MB");
                }

                String type = file.getContentType();

                if (type == null || !ALLOWED_IMAGE_TYPES.contains(type)) {

                        throw new BadRequestException("Formato de imagen no permitido");
                }
        }

        private String resolvePublicRoleName(String requestedRole) {

                String roleName = requestedRole == null || requestedRole.isBlank()
                                ? RoleName.ROLE_ESTUDIANTE.name()
                                : requestedRole;

                if (!PUBLIC_REGISTRATION_ROLES.contains(roleName)) {
                        throw new BadRequestException(
                                        "Este rol no está habilitado para registro público");
                }

                return roleName;
        }

        private AcademicCycle resolveAcademicCycle(
                        String roleName,
                        Long academicCycleId,
                        Course practiceTutorCourse) {

                boolean requiresAcademicCycle =
                                RoleName.ROLE_ESTUDIANTE.name().equals(roleName);

                if (RoleName.ROLE_TUTOR_PRACTICAS.name().equals(roleName)) {
                        if (academicCycleId != null) {
                                throw new BadRequestException(
                                                "El ciclo académico se obtiene desde el paralelo seleccionado");
                        }

                        return practiceTutorCourse != null
                                        ? practiceTutorCourse.getAcademicCycle()
                                        : null;
                }

                if (!requiresAcademicCycle) {
                        if (academicCycleId != null) {
                                throw new BadRequestException(
                                                "Este rol no debe vincularse a un ciclo académico");
                        }

                        return null;
                }

                if (academicCycleId == null) {

                        throw new BadRequestException(
                                        "El ciclo académico es obligatorio para este rol");
                }

                AcademicCycle academicCycle = academicCycleRepository.findByIdAndDeletedFalse(academicCycleId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Ciclo académico no encontrado"));

                if (!academicCycle.isActive()) {
                        throw new BadRequestException(
                                        "El ciclo académico no está activo");
                }

                return academicCycle;
        }

        private Institution resolveInstitution(
                        String roleName,
                        Long institutionId,
                        Course practiceTutorCourse,
                        GradeParallel gradeParallel) {

                if (RoleName.ROLE_TUTOR_PRACTICAS.name().equals(roleName)) {
                        Institution institution = resolveUniversityFromCourse(practiceTutorCourse);

                        if (institutionId != null && institution != null
                                        && !institution.getId().equals(institutionId)) {
                                throw new BadRequestException(
                                                "La universidad debe coincidir con el paralelo seleccionado");
                        }

                        return institution;
                }

                if (RoleName.ROLE_TUTOR_INSTITUCIONAL.name().equals(roleName)) {
                        Institution institution = resolveEducationalInstitutionFromParallel(gradeParallel);

                        if (institutionId != null && institution != null
                                        && !institution.getId().equals(institutionId)) {
                                throw new BadRequestException(
                                                "La institución debe coincidir con el paralelo seleccionado");
                        }

                        validateInstitutionForRole(roleName, institution);

                        return institution;
                }

                if (institutionId != null) {
                        throw new BadRequestException(
                                        "Este rol no debe vincularse a una institución");
                }

                return null;
        }

        private Course resolvePracticeTutorCourse(
                        String roleName,
                        Long courseId) {

                if (!RoleName.ROLE_TUTOR_PRACTICAS.name().equals(roleName)) {
                        if (courseId != null) {
                                throw new BadRequestException(
                                                "Este rol no debe vincularse a un paralelo universitario");
                        }

                        return null;
                }

                if (courseId == null) {
                        throw new BadRequestException(
                                        "El paralelo universitario es obligatorio para este rol");
                }

                Course course = courseRepository
                                .findByIdAndDeletedFalse(courseId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Paralelo universitario no encontrado"));

                if (!course.isActive() || course.isLocked() || course.getAcademicCycle() == null
                                || !course.getAcademicCycle().isActive()
                                || course.getAcademicCycle().isDeleted()) {
                        throw new BadRequestException(
                                        "El paralelo universitario no está activo");
                }

                if (course.getPracticeTutor() != null) {
                        throw new BadRequestException(
                                        "El paralelo universitario ya tiene tutor de prácticas asignado");
                }

                return course;
        }

        private GradeParallel resolveInstitutionalTutorParallel(
                        String roleName,
                        Long gradeParallelId) {

                if (!RoleName.ROLE_TUTOR_INSTITUCIONAL.name().equals(roleName)) {
                        if (gradeParallelId != null) {
                                throw new BadRequestException(
                                                "Este rol no debe vincularse a un paralelo institucional");
                        }

                        return null;
                }

                if (gradeParallelId == null) {
                        throw new BadRequestException(
                                        "El paralelo institucional es obligatorio para este rol");
                }

                GradeParallel parallel = gradeParallelRepository
                                .findByIdAndDeletedFalse(gradeParallelId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Paralelo institucional no encontrado"));

                Grade grade = parallel.getGrade();

                if (!parallel.isActive() || grade == null || !grade.isActive()
                                || grade.isDeleted()) {
                        throw new BadRequestException(
                                        "El paralelo institucional no está activo");
                }

                return parallel;
        }

        private Institution resolveUniversityFromCourse(Course course) {

                if (course == null
                                || course.getAcademicCycle() == null
                                || course.getAcademicCycle().getCareer() == null
                                || course.getAcademicCycle().getCareer().getFaculty() == null) {
                        throw new BadRequestException(
                                        "El paralelo universitario no tiene una universidad asociada");
                }

                Institution institution = course.getAcademicCycle()
                                .getCareer()
                                .getFaculty()
                                .getInstitution();

                validateInstitutionForRole(RoleName.ROLE_TUTOR_PRACTICAS.name(), institution);

                return institution;
        }

        private Institution resolveEducationalInstitutionFromParallel(GradeParallel parallel) {

                if (parallel == null || parallel.getGrade() == null) {
                        throw new BadRequestException(
                                        "El paralelo institucional no tiene institución asociada");
                }

                return parallel.getGrade().getInstitution();
        }

        private void validateInstitutionForRole(String roleName, Institution institution) {

                if (institution == null || !institution.isActive() || institution.isDeleted()) {
                        throw new BadRequestException(
                                        "La institución no está activa");
                }

                if (RoleName.ROLE_TUTOR_PRACTICAS.name().equals(roleName)
                                && institution.getType() != InstitutionType.UNIVERSIDAD) {
                        throw new BadRequestException(
                                        "El tutor de prácticas debe vincularse a una universidad");
                }

                if (RoleName.ROLE_TUTOR_INSTITUCIONAL.name().equals(roleName)
                                && institution.getType() != InstitutionType.ESCUELA
                                && institution.getType() != InstitutionType.COLEGIO) {
                        throw new BadRequestException(
                                        "El tutor institucional debe vincularse a una escuela o colegio");
                }

                if (RoleName.ROLE_TUTOR_INSTITUCIONAL.name().equals(roleName)
                                && (!institution.isAgreementActive()
                                                || !institution.isAcceptsInterns())) {
                        throw new BadRequestException(
                                        "La institución educativa debe tener convenio activo y aceptar practicantes");
                }
        }
}
