/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AcademicCycleController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con los ciclos académicos.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.academiccycle.*;
import com.sgp.systemsgp.service.AcademicCycleService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import com.sgp.systemsgp.service.AcademicCatalogAccess;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academic-cycles")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")
public class AcademicCycleController {

    private final AcademicCycleService academicCycleService;
    private final AcademicCatalogAccess catalogAccess;

    /*
     * CREAR
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AcademicCycleResponse create(

            @Valid

            @RequestBody

            CreateAcademicCycleRequest request) {

        return academicCycleService.create(request);
    }

    /*
     * LISTAR
     */
    @GetMapping
    public List<AcademicCycleResponse> getAll(Authentication authentication) {

        var scope = catalogAccess.scope(authentication.getName());
        return academicCycleService.getAll().stream().filter(row -> scope.career(row.getCareerId())).toList();
    }

    /*
     * OBTENER
     */
    @GetMapping("/{id}")
    public AcademicCycleResponse getById(
            Authentication authentication,

            @PathVariable Long id) {

        var row = academicCycleService.getById(id);
        var scope = catalogAccess.scope(authentication.getName());
        scope.require(scope.career(row.getCareerId()));
        return row;
    }

    /*
     * UPDATE
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AcademicCycleResponse update(

            @PathVariable Long id,

            @Valid
            @RequestBody UpdateAcademicCycleRequest request) {

        return academicCycleService.update(id, request);
    }

    /*
     * DESACTIVAR
     */
    @PatchMapping("/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public void disable(

            @PathVariable Long id) {

        academicCycleService.disable(id);
    }

    /*
     * ACTIVAR
     */
    @PatchMapping("/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public void enable(

            @PathVariable Long id) {

        academicCycleService.enable(id);
    }

    /*
     * SOFT DELETE
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void softDelete(

            @PathVariable Long id) {

        academicCycleService.softDelete(id);
    }

    /*
     * RESTORE
     */
    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public void restore(

            @PathVariable Long id) {

        academicCycleService.restore(id);
    }

    /*
     * DELETE REAL
     */
    @DeleteMapping("/{id}/force")
    @PreAuthorize("hasRole('ADMIN')")
    public void forceDelete(

            @PathVariable Long id) {

        academicCycleService.forceDelete(id);
    }
}
