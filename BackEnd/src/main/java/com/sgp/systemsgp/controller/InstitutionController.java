package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.institution.*;

import com.sgp.systemsgp.service.InstitutionService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/institutions")
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionService institutionService;

    /*
     * CREAR INSTITUCIÓN
     */
    @PostMapping

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public InstitutionResponse create(

            @Valid
            @RequestBody
            CreateInstitutionRequest request
    ) {

        return institutionService.create(request);
    }

    /*
     * OBTENER POR ID
     */
    @GetMapping("/{id}")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public InstitutionResponse getById(
            @PathVariable Long id
    ) {

        return institutionService.getById(id);
    }

    /*
     * LISTAR
     */
    @GetMapping

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public Page<InstitutionResponse> getAll(
            Authentication authentication,
            Pageable pageable
    ) {

        return institutionService.getAll(
                isAdmin(authentication),
                pageable);
    }

    /*
     * BÚSQUEDA + FILTROS
     */
    @GetMapping("/search")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public Page<InstitutionResponse> search(

            Authentication authentication,

            @RequestParam(required = false)
            String name,

            @RequestParam(required = false)
            String code,

            @RequestParam(required = false)
            String type,

            @RequestParam(required = false)
            String support,

            @RequestParam(required = false)
            Boolean active,

            @RequestParam(required = false)
            Boolean agreementActive,

            @RequestParam(required = false)
            Boolean acceptsInterns,

            Pageable pageable
    ) {

        return institutionService.search(

                name,

                code,

                type,

                support,

                active,

                isAdmin(authentication),

                agreementActive,

                acceptsInterns,

                pageable
        );
    }

    private boolean isAdmin(Authentication authentication) {

        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    /*
     * ACTUALIZAR
     */
    @PatchMapping("/{id}")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public InstitutionResponse update(

            @PathVariable Long id,

            @Valid
            @RequestBody
            UpdateInstitutionRequest request
    ) {

        return institutionService.update(id, request);
    }

    /*
     * DESACTIVAR
     */
    @PatchMapping("/{id}/disable")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public void disable(
            @PathVariable Long id
    ) {

        institutionService.disable(id);
    }

    /*
     * ACTIVAR
     */
    @PatchMapping("/{id}/enable")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public void enable(
            @PathVariable Long id
    ) {

        institutionService.enable(id);
    }

    /*
     * SOFT DELETE
     */
    @DeleteMapping("/{id}")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public void delete(
            @PathVariable Long id
    ) {

        institutionService.softDelete(id);
    }

    /*
     * RESTAURAR
     */
    @PatchMapping("/{id}/restore")

    @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

    public void restore(
            @PathVariable Long id
    ) {

        institutionService.restore(id);
    }

    /*
     * DELETE REAL
     */
    @DeleteMapping("/{id}/force")

    @PreAuthorize("hasRole('ADMIN')")

    public void forceDelete(
            @PathVariable Long id
    ) {

        institutionService.forceDelete(id);
    }
}
