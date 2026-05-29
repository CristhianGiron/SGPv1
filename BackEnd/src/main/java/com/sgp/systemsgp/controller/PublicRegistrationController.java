package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.academiccycle.AcademicCycleResponse;
import com.sgp.systemsgp.dto.institution.InstitutionResponse;
import com.sgp.systemsgp.service.AcademicCycleService;
import com.sgp.systemsgp.service.InstitutionService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicRegistrationController {

    private final AcademicCycleService academicCycleService;

    private final InstitutionService institutionService;

    @GetMapping("/academic-cycles")
    public List<AcademicCycleResponse> academicCycles() {

        return academicCycleService.getActiveForRegistration();
    }

    @GetMapping("/institutions")
    public Page<InstitutionResponse> institutions(
            @RequestParam(required = false) String type,
            @PageableDefault(size = 100) Pageable pageable) {

        return institutionService.getActiveForRegistration(
                type,
                pageable);
    }
}
