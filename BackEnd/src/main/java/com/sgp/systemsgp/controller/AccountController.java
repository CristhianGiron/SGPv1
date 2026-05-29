package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.account.AccountResponse;
import com.sgp.systemsgp.dto.account.ChangePasswordRequest;
import com.sgp.systemsgp.dto.account.UpdateAccountRequest;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.service.AccountService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    /*
     * Obtener cuenta autenticada
     */
    @GetMapping("/me")
    public AccountResponse me(Authentication authentication) {

        return accountService.getMyAccount(authentication.getName());
    }

    @GetMapping("/{id}/image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> getProfileImage(
            Authentication authentication,
            @PathVariable Long id) {

        boolean admin = authentication.getAuthorities()
                .stream()
                .anyMatch(authority -> authority.getAuthority()
                        .equals("ROLE_ADMIN"));

        return accountService.getProfileImage(
                id,
                authentication.getName(),
                admin);
    }

    /*
     * Actualizar cuenta autenticada + imagen opcional
     */
    @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AccountResponse update(
            Authentication authentication,
            @Valid @RequestPart("data") UpdateAccountRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {

        return accountService.updateMyAccount(
                authentication.getName(),
                request,
                file);
    }

    /*
     * Actualizar contraseña
     */
    @PatchMapping("/me/password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,

            @Valid @RequestBody ChangePasswordRequest request) {

        accountService.changePassword(
                authentication.getName(),
                request);

        return ResponseEntity.ok(
                "Contraseña actualizada correctamente");
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AccountResponse> getAll(

            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)

            Pageable pageable) {

        return accountService.getAll(pageable);
    }

    @GetMapping("/search")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS', 'TUTOR_PRACTICAS')")

    public Page<AccountResponse> search(

            Authentication authentication,

            @RequestParam(required = false) String username,

            @RequestParam(required = false) String email,

            @RequestParam(required = false) String names,

            @RequestParam(required = false) String lastNames,

            @RequestParam(required = false) String cedula,

            @RequestParam(required = false) String role,

            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)

            Pageable pageable) {

        validateAccountSearchAccess(authentication, role);

        return accountService.search(
                username,
                email,
                names,
                lastNames,
                cedula,
                role,
                hasAuthority(authentication, RoleName.ROLE_ADMIN) ? null : true,
                pageable);
    }

    private void validateAccountSearchAccess(
            Authentication authentication,
            String role) {

        if (hasAuthority(authentication, RoleName.ROLE_ADMIN)) {
            return;
        }

        if (hasAuthority(authentication, RoleName.ROLE_DIRECTOR_PRACTICAS)
                && RoleName.ROLE_TUTOR_PRACTICAS.name().equals(role)) {
            return;
        }

        if (hasAuthority(authentication, RoleName.ROLE_TUTOR_PRACTICAS)
                && RoleName.ROLE_TUTOR_INSTITUCIONAL.name().equals(role)) {
            return;
        }

        throw new AccessDeniedException(
                "No puedes consultar cuentas fuera de tu flujo de gestion");
    }

    private boolean hasAuthority(
            Authentication authentication,
            RoleName roleName) {

        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority -> authority.getAuthority().equals(roleName.name()));
    }
}
