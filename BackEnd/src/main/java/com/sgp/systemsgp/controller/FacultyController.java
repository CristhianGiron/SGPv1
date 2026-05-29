package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.faculty.*;
import com.sgp.systemsgp.service.FacultyService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/faculties")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FacultyController {

    private final FacultyService facultyService;

    /*
     * CREAR
     */
    @PostMapping
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
    public List<FacultyResponse> getAll() {

        return facultyService.getAll();
    }

    /*
     * OBTENER
     */
    @GetMapping("/{id}")
    public FacultyResponse getById(

            @PathVariable Long id) {

        return facultyService.getById(id);
    }

    /*
     * UPDATE
     */
    @PutMapping("/{id}")
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
    public void delete(

            @PathVariable Long id) {

        facultyService.delete(id);
    }
}
