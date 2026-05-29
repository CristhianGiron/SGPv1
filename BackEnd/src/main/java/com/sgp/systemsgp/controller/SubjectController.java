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

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SubjectController {

    private final SubjectService subjectService;

    /*
     * CREAR
     */
    @PostMapping
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
    public List<SubjectResponse> getAll() {

        return subjectService.getAll();
    }

    /*
     * OBTENER
     */
    @GetMapping("/{id}")
    public SubjectResponse getById(
            @PathVariable Long id) {

        return subjectService.getById(id);
    }

    /*
     * ACTUALIZAR
     */
    @PutMapping("/{id}")
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
    public void delete(
            @PathVariable Long id) {

        subjectService.delete(id);
    }
}
