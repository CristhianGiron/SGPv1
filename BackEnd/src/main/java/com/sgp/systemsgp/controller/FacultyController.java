/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FacultyController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con las facultades universitarias.
 */

package com.sgp.systemsgp.controller;
import com.sgp.systemsgp.dto.faculty.CreateFacultyRequest;
import com.sgp.systemsgp.dto.faculty.FacultyResponse;
import com.sgp.systemsgp.dto.faculty.UpdateFacultyRequest;

import com.sgp.systemsgp.dto.faculty.*;
import com.sgp.systemsgp.service.FacultyService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import com.sgp.systemsgp.service.AcademicCatalogAccess;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculties")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")
public class FacultyController {

    private final FacultyService facultyService;
    private final AcademicCatalogAccess catalogAccess;

    /*
     * CREAR
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public FacultyResponse create(

            @Valid

            @RequestBody

            CreateFacultyRequest request) {

        return facultyService.create(request);
    }

    /*
     * LISTAR
     */
    @GetMapping
    public List<FacultyResponse> getAll(Authentication authentication) {

        var scope = catalogAccess.scope(authentication.getName());
        return facultyService.getAll().stream().filter(row -> scope.faculty(row.getId())).toList();
    }

    /*
     * OBTENER
     */
    @GetMapping("/{id}")
    public FacultyResponse getById(
            Authentication authentication,

            @PathVariable Long id) {

        var row = facultyService.getById(id);
        var scope = catalogAccess.scope(authentication.getName());
        scope.require(scope.faculty(row.getId()));
        return row;
    }

    /*
     * UPDATE
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public FacultyResponse update(

            @PathVariable Long id,

            @Valid
            @RequestBody UpdateFacultyRequest request) {

        return facultyService.update(id, request);
    }

    /*
     * DELETE
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(

            @PathVariable Long id) {

        facultyService.delete(id);
    }
}
