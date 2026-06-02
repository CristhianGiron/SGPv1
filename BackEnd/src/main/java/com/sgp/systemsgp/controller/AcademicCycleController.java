package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.academiccycle.*;
import com.sgp.systemsgp.service.AcademicCycleService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academic-cycles")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")
public class AcademicCycleController {

    private final AcademicCycleService academicCycleService;

    /*
     * CREAR
     */
    @PostMapping
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
    public List<AcademicCycleResponse> getAll() {

        return academicCycleService.getAll();
    }

    /*
     * OBTENER
     */
    @GetMapping("/{id}")
    public AcademicCycleResponse getById(

            @PathVariable Long id) {

        return academicCycleService.getById(id);
    }

    /*
     * UPDATE
     */
    @PutMapping("/{id}")
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
    public void disable(

            @PathVariable Long id) {

        academicCycleService.disable(id);
    }

    /*
     * ACTIVAR
     */
    @PatchMapping("/{id}/enable")
    public void enable(

            @PathVariable Long id) {

        academicCycleService.enable(id);
    }

    /*
     * SOFT DELETE
     */
    @DeleteMapping("/{id}")
    public void softDelete(

            @PathVariable Long id) {

        academicCycleService.softDelete(id);
    }

    /*
     * RESTORE
     */
    @PatchMapping("/{id}/restore")
    public void restore(

            @PathVariable Long id) {

        academicCycleService.restore(id);
    }

    /*
     * DELETE REAL
     */
    @DeleteMapping("/{id}/force")
    public void forceDelete(

            @PathVariable Long id) {

        academicCycleService.forceDelete(id);
    }
}
