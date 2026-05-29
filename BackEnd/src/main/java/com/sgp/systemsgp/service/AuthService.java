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
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.Role;

import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.AcademicCycleRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
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

        private final InstitutionRepository institutionRepository;

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

                AcademicCycle academicCycle = resolveAcademicCycle(
                                roleName,
                                request.getAcademicCycleId());

                Institution institution = resolveInstitution(
                                roleName,
                                request.getInstitutionId());

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
                                .profileImage(image)
                                .profileImageType(imageType)
                                .build();

                accountRepository.save(account);

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
                        Long academicCycleId) {

                boolean requiresAcademicCycle =
                                RoleName.ROLE_ESTUDIANTE.name().equals(roleName);

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
                        Long institutionId) {

                boolean requiresInstitution =
                                RoleName.ROLE_TUTOR_INSTITUCIONAL.name().equals(roleName)
                                                || RoleName.ROLE_TUTOR_PRACTICAS.name().equals(roleName);

                if (!requiresInstitution) {
                        if (institutionId != null) {
                                throw new BadRequestException(
                                                "Este rol no debe vincularse a una institución");
                        }

                        return null;
                }

                if (institutionId == null) {
                        throw new BadRequestException(
                                        "La institución es obligatoria para este rol");
                }

                Institution institution = institutionRepository
                                .findByIdAndDeletedFalse(institutionId)
                                .orElseThrow(() -> new NotFoundException(
                                                "Institución no encontrada"));

                if (!institution.isActive() || institution.isDeleted()) {
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

                return institution;
        }
}
