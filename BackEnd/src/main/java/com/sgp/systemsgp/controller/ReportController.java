/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ReportController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con el módulo Report Controller.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.report.CoordinationReportResponse;
import com.sgp.systemsgp.service.CoordinationReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
    public CoordinationReportResponse coordinationReport(Authentication authentication) {
        return coordinationReportService.coordinationReport(authentication.getName());
    }
}
