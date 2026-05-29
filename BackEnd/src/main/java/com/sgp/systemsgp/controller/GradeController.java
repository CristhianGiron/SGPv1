package com.sgp.systemsgp.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.sgp.systemsgp.dto.grade.CreateGradeRequest;
import com.sgp.systemsgp.dto.grade.GradeResponse;
import com.sgp.systemsgp.dto.grade.UpdateGradeRequest;
import com.sgp.systemsgp.service.GradeService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class GradeController {

    private final GradeService gradeService;

    /*
     * CREAR
     */
    @PostMapping
    public GradeResponse create(

            @Valid

            @RequestBody

            CreateGradeRequest request) {

        return gradeService.create(request);
    }

    /*
     * LISTAR
     */
    @GetMapping
    public List<GradeResponse> getAll() {

        return gradeService.getAll();
    }

    /*
     * OBTENER
     */
    @GetMapping("/{id}")
    public GradeResponse getById(
            @PathVariable Long id) {

        return gradeService.getById(id);
    }

    /*
     * ACTUALIZAR
     */
    @PutMapping("/{id}")
    public GradeResponse update(

            @PathVariable Long id,

            @Valid
            @RequestBody UpdateGradeRequest request) {

        return gradeService.update(id, request);
    }

    /*
     * ELIMINAR
     */
    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id) {

        gradeService.delete(id);
    }
}
