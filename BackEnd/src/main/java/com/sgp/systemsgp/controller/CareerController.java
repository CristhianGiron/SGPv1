/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CareerController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con las carreras universitarias.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.career.CreateCareerRequest;
import com.sgp.systemsgp.dto.career.CareerResponse;
import com.sgp.systemsgp.dto.career.UpdateCareerRequest;
import com.sgp.systemsgp.service.CareerService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import com.sgp.systemsgp.service.AcademicCatalogAccess;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/careers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")
public class CareerController {

    private final CareerService careerService;
    private final AcademicCatalogAccess catalogAccess;

    /*
     * CREAR
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CareerResponse create(

            @Valid

            @RequestBody

            CreateCareerRequest request) {

        return careerService.create(request);
    }

    /*
     * LISTAR
     */
    @GetMapping
    public List<CareerResponse> getAll(Authentication authentication) {

        var scope = catalogAccess.scope(authentication.getName());
        return careerService.getAll().stream().filter(row -> scope.career(row.getId())).toList();
    }

    /*
     * OBTENER
     */
    @GetMapping("/{id}")
    public CareerResponse getById(
            Authentication authentication,

            @PathVariable Long id) {

        var row = careerService.getById(id);
        var scope = catalogAccess.scope(authentication.getName());
        scope.require(scope.career(row.getId()));
        return row;
    }

    /*
     * ACTUALIZAR
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CareerResponse update(

            @PathVariable Long id,

            @Valid

            @RequestBody UpdateCareerRequest request) {

        return careerService.update(id, request);
    }

    /*
     * DESACTIVAR
     */
    @PatchMapping("/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public void disable(

            @PathVariable Long id) {

        careerService.disable(id);
    }

    /*
     * ACTIVAR
     */
    @PatchMapping("/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public void enable(

            @PathVariable Long id) {

        careerService.enable(id);
    }

    /*
     * SOFT DELETE
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void softDelete(

            @PathVariable Long id) {

        careerService.softDelete(id);
    }

    /*
     * RESTORE
     */
    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public void restore(

            @PathVariable Long id) {

        careerService.restore(id);
    }

    /*
     * DELETE REAL
     */
    @DeleteMapping("/{id}/force")
    @PreAuthorize("hasRole('ADMIN')")
    public void forceDelete(

            @PathVariable Long id) {

        careerService.forceDelete(id);
    }
}
