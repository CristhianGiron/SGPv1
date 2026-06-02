package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.practicereport.CreatePracticeReportRequest;
import com.sgp.systemsgp.dto.document.ReviewableDocumentSummaryResponse;
import com.sgp.systemsgp.dto.practicereport.PracticeReportResponse;
import com.sgp.systemsgp.dto.practicereport.ReviewPracticeReportRequest;
import com.sgp.systemsgp.dto.practicereport.UpdatePracticeReportRequest;
import com.sgp.systemsgp.service.PracticeReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/practice-reports")
@RequiredArgsConstructor
public class PracticeReportController {

    private final PracticeReportService practiceReportService;

    @PostMapping
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public PracticeReportResponse create(
            Authentication authentication,
            @Valid @RequestBody CreatePracticeReportRequest request) {

        return practiceReportService.create(
                authentication.getName(),
                request);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<PracticeReportResponse> myReports(
            Authentication authentication) {

        return practiceReportService.myReports(
                authentication.getName());
    }

    @GetMapping("/me/summary")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<ReviewableDocumentSummaryResponse> myReportSummaries(
            Authentication authentication) {

        return practiceReportService.myReportSummaries(
                authentication.getName());
    }

    @GetMapping("/review")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public List<PracticeReportResponse> reviewQueue(
            Authentication authentication) {

        return practiceReportService.reviewQueue(
                authentication.getName());
    }

    @GetMapping("/review/summary")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public List<ReviewableDocumentSummaryResponse> reviewQueueSummaries(
            Authentication authentication) {

        return practiceReportService.reviewQueueSummaries(
                authentication.getName());
    }

    @GetMapping("/submitted")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public List<PracticeReportResponse> submittedDocuments(
            Authentication authentication) {

        return practiceReportService.submittedDocuments(authentication.getName());
    }

    @GetMapping("/submitted/summary")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public List<ReviewableDocumentSummaryResponse> submittedDocumentSummaries(
            Authentication authentication) {

        return practiceReportService.submittedDocumentSummaries(authentication.getName());
    }

    @GetMapping("/defaults")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public PracticeReportResponse defaults(
            Authentication authentication,
            @RequestParam(required = false) Long enrollmentId) {

        return practiceReportService.getDefaults(
                authentication.getName(),
                enrollmentId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public PracticeReportResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        return practiceReportService.getById(
                id,
                authentication.getName());
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public ResponseEntity<byte[]> exportPdf(
            Authentication authentication,
            @PathVariable Long id) {

        return PdfResponseFactory.attachment(
                practiceReportService.exportApprovedPdf(
                        id,
                        authentication.getName()),
                "L.1. Informe de Actividades Cumplidas.pdf");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public PracticeReportResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePracticeReportRequest request) {

        return practiceReportService.update(
                id,
                authentication.getName(),
                request);
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public PracticeReportResponse submit(
            Authentication authentication,
            @PathVariable Long id) {

        return practiceReportService.submit(
                id,
                authentication.getName());
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('TUTOR_PRACTICAS','DIRECTOR_PRACTICAS')")
    public PracticeReportResponse review(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ReviewPracticeReportRequest request) {

        return practiceReportService.review(
                id,
                authentication.getName(),
                request);
    }
}
