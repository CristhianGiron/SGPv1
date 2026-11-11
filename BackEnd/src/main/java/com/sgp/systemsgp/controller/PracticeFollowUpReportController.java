/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFollowUpReportController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con el seguimiento de prácticas (L.5).
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.practicefollowup.CreatePracticeFollowUpReportRequest;
import com.sgp.systemsgp.dto.practicefollowup.PracticeFollowUpReportResponse;
import com.sgp.systemsgp.dto.practicefollowup.UpdatePracticeFollowUpReportRequest;
import com.sgp.systemsgp.service.PracticeFollowUpReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/practice-follow-up-reports")
@RequiredArgsConstructor
public class PracticeFollowUpReportController {

    private final PracticeFollowUpReportService practiceFollowUpReportService;

    @PostMapping
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public PracticeFollowUpReportResponse create(
            Authentication authentication,
            @Valid @RequestBody CreatePracticeFollowUpReportRequest request) {

        return practiceFollowUpReportService.create(
                authentication.getName(),
                request);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<PracticeFollowUpReportResponse> myReports(
            Authentication authentication) {

        return practiceFollowUpReportService.myReports(
                authentication.getName());
    }

    @GetMapping("/managed")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public List<PracticeFollowUpReportResponse> managedReports(
            Authentication authentication) {

        return practiceFollowUpReportService.managedReports(
                authentication.getName());
    }

    @GetMapping("/defaults")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public PracticeFollowUpReportResponse defaults(
            Authentication authentication,
            @RequestParam(required = false) Long enrollmentId) {

        return practiceFollowUpReportService.getDefaults(
                authentication.getName(),
                enrollmentId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public PracticeFollowUpReportResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        return practiceFollowUpReportService.getById(
                id,
                authentication.getName());
    }

    @GetMapping("/{id}/pdf/preview")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public org.springframework.http.ResponseEntity<byte[]> previewPdf(Authentication authentication, @PathVariable Long id) {
        return PdfResponseFactory.inline(com.sgp.systemsgp.service.PdfPreview.mark(practiceFollowUpReportService.exportPdf(id, authentication.getName())));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public ResponseEntity<byte[]> exportPdf(
            Authentication authentication,
            @PathVariable Long id) {

        return PdfResponseFactory.attachment(
                practiceFollowUpReportService.exportPdf(
                        id,
                        authentication.getName()),
                "L.5. Reporte de Seguimiento.pdf");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public PracticeFollowUpReportResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePracticeFollowUpReportRequest request) {

        return practiceFollowUpReportService.update(
                id,
                authentication.getName(),
                request);
    }
}
