package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.account.AccountResponse;
import com.sgp.systemsgp.dto.account.ChangePasswordRequest;
import com.sgp.systemsgp.dto.account.UpdateAccountRequest;

import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;

import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Person;

import com.sgp.systemsgp.repository.AccountRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountService {

        private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

        private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
                        "image/jpeg",
                        "image/png",
                        "image/webp");

        private final AccountRepository accountRepository;
        private final PasswordEncoder passwordEncoder;

        /*
         * Buscar cuenta por username
         */
        private Account getByUsername(String username) {

                return accountRepository.findByUsernameAndDeletedFalse(username)
                                .orElseThrow(() -> new NotFoundException(
                                                "Cuenta no encontrada"));
        }

        /*
         * PERFIL ACTUAL
         */
        public AccountResponse getMyAccount(
                        String username) {

                Account account = getByUsername(username);

                return mapToResponse(account);
        }

        /*
         * Listar todos los usuarios
         */

        public Page<AccountResponse> getAll(
                        Pageable pageable) {

                return accountRepository
                                .findByDeletedFalse(pageable)

                                .map(this::mapToResponse);
        }

        /*
         * ACTUALIZAR PERFIL + IMAGEN OPCIONAL
         */
        public AccountResponse updateMyAccount(
                        String username,
                        UpdateAccountRequest request,
                        MultipartFile file) {

                Account account = getByUsername(username);

                Person person = account.getPerson();

                /*
                 * ACTUALIZAR SOLO CAMPOS ENVIADOS
                 */

                if (request.getNames() != null) {

                        person.setNames(
                                        request.getNames());
                }

                if (request.getLastNames() != null) {

                        person.setLastNames(
                                        request.getLastNames());
                }

                if (request.getPhone() != null) {

                        person.setPhone(
                                        request.getPhone());
                }

                if (request.getAddress() != null) {

                        person.setAddress(
                                        request.getAddress());
                }

                /*
                 * VALIDAR Y GUARDAR IMAGEN
                 */
                if (file != null && !file.isEmpty()) {

                        validateProfileImage(file);

                        try {

                                account.setProfileImage(
                                                file.getBytes());

                                account.setProfileImageType(
                                                file.getContentType());

                        } catch (Exception e) {

                                throw new BadRequestException(
                                                "Error al procesar imagen");
                        }
                }

                accountRepository.save(account);

                return mapToResponse(account);
        }

        /*
         * OBTENER IMAGEN PERFIL
         */
        public ResponseEntity<byte[]> getProfileImage(
                        Long id,
                        String requesterUsername,
                        boolean requesterAdmin) {

                Account account = accountRepository.findByIdAndDeletedFalse(id)
                                .orElseThrow(() -> new NotFoundException(
                                                "Cuenta no encontrada"));

                if (!requesterAdmin
                                && !account.getUsername().equals(requesterUsername)) {

                        throw new AccessDeniedException(
                                        "No puedes acceder a esta imagen");
                }

                if (account.getProfileImage() == null) {

                        throw new NotFoundException(
                                        "La cuenta no tiene imagen");
                }

                MediaType mediaType = account.getProfileImageType() != null
                                ? MediaType.parseMediaType(
                                                account.getProfileImageType())
                                : MediaType.APPLICATION_OCTET_STREAM;

                return ResponseEntity.ok()

                                .contentType(mediaType)

                                .body(
                                                account.getProfileImage());
        }

        /*
         * VALIDAR IMAGEN
         */
        private void validateProfileImage(
                        MultipartFile file) {

                /*
                 * Tamaño máximo
                 */
                if (file.getSize() > MAX_IMAGE_SIZE) {

                        throw new BadRequestException(
                                        "La imagen supera el límite de 5MB");
                }

                /*
                 * Tipo permitido
                 */
                String type = file.getContentType();

                if (type == null
                                || !ALLOWED_IMAGE_TYPES.contains(type)) {

                        throw new BadRequestException(
                                        "Formato de imagen no permitido");
                }
        }

        /*
         * MAPPER
         */
        private AccountResponse mapToResponse(
                        Account account) {

                Person person = account.getPerson();

                String imageUrl = null;

                if (account.getProfileImage() != null) {

                        imageUrl = "/api/account/"
                                        + account.getId()
                                        + "/image";
                }

                return AccountResponse.builder()

                                .id(account.getId())

                                .username(account.getUsername())

                                .names(person.getNames())

                                .lastNames(person.getLastNames())

                                .cedula(person.getCedula())

                                .institutionalEmail(
                                                person.getInstitutionalEmail())

                                .phone(person.getPhone())

                                .address(person.getAddress())

                                .profileImageUrl(imageUrl)

                                .academicCycleId(
                                                account.getAcademicCycle() != null
                                                                ? account.getAcademicCycle().getId()
                                                                : null)

                                .academicCycle(
                                                account.getAcademicCycle() != null
                                                                ? account.getAcademicCycle().getName()
                                                                : null)

                                .institutionId(
                                                account.getInstitution() != null
                                                                ? account.getInstitution().getId()
                                                                : null)

                                .institution(
                                                account.getInstitution() != null
                                                                ? account.getInstitution().getName()
                                                                : null)

                                .enabled(account.isEnabled())

                                .locked(account.isLocked())

                                .deleted(account.isDeleted())

                                .passwordChangeRequired(account.isPasswordChangeRequired())

                                .createdAt(account.getCreatedAt())

                                .updatedAt(account.getUpdatedAt())

                                .roles(
                                                account.getRoles()
                                                                .stream()
                                                                .map(role -> role.getName())
                                                                .collect(Collectors.toSet()))

                                .build();
        }

        // CAMBIO DE CONTRASEÑA

        public void changePassword(
                        String username,
                        ChangePasswordRequest request) {

                Account account = getByUsername(username);

                /*
                 * VALIDAR PASSWORD ACTUAL
                 */
                boolean matches = passwordEncoder.matches(
                                request.getCurrentPassword(),
                                account.getPassword());

                if (!matches) {

                        throw new BadRequestException(
                                        "La contraseña actual es incorrecta");
                }

                /*
                 * VALIDAR CONFIRMACIÓN
                 */
                if (!request.getNewPassword()
                                .equals(request.getConfirmPassword())) {

                        throw new BadRequestException(
                                        "Las contraseñas no coinciden");
                }

                /*
                 * EVITAR MISMA PASSWORD
                 */
                boolean samePassword = passwordEncoder.matches(
                                request.getNewPassword(),
                                account.getPassword());

                if (samePassword) {

                        throw new BadRequestException(
                                        "La nueva contraseña no puede ser igual a la actual");
                }

                /*
                 * ACTUALIZAR PASSWORD
                 */
                account.setPassword(

                                passwordEncoder.encode(
                                                request.getNewPassword()));

                account.setPasswordChangeRequired(false);

                accountRepository.save(account);
        }

        public Page<AccountResponse> search(

                        String username,

                        String email,

                        String names,

                        String lastNames,

                        String cedula,

                        String role,

                        Boolean enabled,

                        Pageable pageable) {

                return accountRepository
                                .search(
                                                username,
                                                email,
                                                names,
                                                lastNames,
                                                cedula,
                                                role,
                                                enabled,
                                                pageable)

                                .map(this::mapToResponse);
        }
}
