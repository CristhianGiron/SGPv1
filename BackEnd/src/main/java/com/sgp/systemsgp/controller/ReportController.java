package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.report.CoordinationReportResponse;
import com.sgp.systemsgp.service.CoordinationReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final CoordinationReportService coordinationReportService;

    @GetMapping("/coordination")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public CoordinationReportResponse coordinationReport() {
        return coordinationReportService.coordinationReport();
    }
}
