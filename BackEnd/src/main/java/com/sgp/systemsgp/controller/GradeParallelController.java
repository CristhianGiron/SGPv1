package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.gradeparallel.CreateGradeParallelRequest;
import com.sgp.systemsgp.dto.gradeparallel.GradeParallelResponse;
import com.sgp.systemsgp.dto.gradeparallel.UpdateGradeParallelRequest;
import com.sgp.systemsgp.service.GradeParallelService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/grade-parallels")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class GradeParallelController {

    private final GradeParallelService gradeParallelService;

    @PostMapping
    public GradeParallelResponse create(
            @Valid @RequestBody CreateGradeParallelRequest request) {

        return gradeParallelService.create(request);
    }

    @GetMapping
    public List<GradeParallelResponse> getAll() {

        return gradeParallelService.getAll();
    }

    @GetMapping("/{id}")
    public GradeParallelResponse getById(
            @PathVariable Long id) {

        return gradeParallelService.getById(id);
    }

    @PutMapping("/{id}")
    public GradeParallelResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGradeParallelRequest request) {

        return gradeParallelService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id) {

        gradeParallelService.delete(id);
    }
}
