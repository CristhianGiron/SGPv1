/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          InstitutionController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con las instituciones.
 */

package com.sgp.systemsgp.controller;
import com.sgp.systemsgp.dto.institution.CreateInstitutionRequest;
import com.sgp.systemsgp.dto.institution.InstitutionResponse;
import com.sgp.systemsgp.dto.institution.UpdateInstitutionRequest;

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
    private final com.sgp.systemsgp.service.AcademicCatalogAccess academicAccess;

    /*
     * CREAR INSTITUCIÓN
     */
    @PostMapping(consumes = "application/json")
    @PreAuthorize("@institutionCatalogAccess.canCreate(authentication.name, #request.type)")

    public InstitutionResponse create(
            Authentication authentication,

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
    @PreAuthorize("@institutionCatalogAccess.canRead(authentication.name, #id)")

    public InstitutionResponse getById(
            Authentication authentication,
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
                pageable, visibleUniversity(authentication));
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

                pageable, visibleUniversity(authentication)
        );
    }

    private Long visibleUniversity(Authentication authentication) {
        var scope = academicAccess.scope(authentication.getName());
        return scope.admin() ? null : scope.universityId() != null ? scope.universityId() : -1L;
    }

    private boolean isAdmin(Authentication authentication) {

        return authentication.getAuthorities()
                .stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }

    /*
     * ACTUALIZAR
     */
    @PatchMapping(value = "/{id}", consumes = "application/json")
    @PreAuthorize("@institutionCatalogAccess.canManage(authentication.name, #id, #request.type)")

    public InstitutionResponse update(
            Authentication authentication,

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

    @PreAuthorize("@institutionCatalogAccess.canManage(authentication.name, #id)")

    public void disable(
            Authentication authentication,
            @PathVariable Long id
    ) {

        institutionService.disable(id);
    }

    /*
     * ACTIVAR
     */
    @PatchMapping("/{id}/enable")

    @PreAuthorize("@institutionCatalogAccess.canManage(authentication.name, #id)")

    public void enable(
            Authentication authentication,
            @PathVariable Long id
    ) {

        institutionService.enable(id);
    }

    /*
     * SOFT DELETE
     */
    @DeleteMapping("/{id}")

    @PreAuthorize("@institutionCatalogAccess.canManage(authentication.name, #id)")

    public void delete(
            Authentication authentication,
            @PathVariable Long id
    ) {

        institutionService.softDelete(id);
    }

    /*
     * RESTAURAR
     */
    @PatchMapping("/{id}/restore")

    @PreAuthorize("@institutionCatalogAccess.canManage(authentication.name, #id)")

    public void restore(
            Authentication authentication,
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
