/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          SubjectController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con las asignaturas.
 */

package com.sgp.systemsgp.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.sgp.systemsgp.dto.subject.CreateSubjectRequest;
import com.sgp.systemsgp.dto.subject.SubjectResponse;
import com.sgp.systemsgp.dto.subject.UpdateSubjectRequest;
import com.sgp.systemsgp.service.SubjectService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import com.sgp.systemsgp.service.AcademicCatalogAccess;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")
public class SubjectController {

    private final SubjectService subjectService;
    private final AcademicCatalogAccess catalogAccess;

    /*
     * CREAR
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SubjectResponse create(

            @Valid

            @RequestBody

            CreateSubjectRequest request) {

        return subjectService.create(request);
    }

    /*
     * LISTAR
     */
    @GetMapping
    public List<SubjectResponse> getAll(Authentication authentication) {

        var scope = catalogAccess.scope(authentication.getName());
        return subjectService.getAll().stream().filter(row -> scope.career(row.getCareerId())).toList();
    }

    /*
     * OBTENER
     */
    @GetMapping("/{id}")
    public SubjectResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        var row = subjectService.getById(id);
        var scope = catalogAccess.scope(authentication.getName());
        scope.require(scope.career(row.getCareerId()));
        return row;
    }

    /*
     * ACTUALIZAR
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public SubjectResponse update(

            @PathVariable Long id,

            @Valid
            @RequestBody UpdateSubjectRequest request) {

        return subjectService.update(id, request);
    }

    /*
     * ELIMINAR
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(
            @PathVariable Long id) {

        subjectService.delete(id);
    }
}
