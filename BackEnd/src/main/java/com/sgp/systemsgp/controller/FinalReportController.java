package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.finalreport.CreateFinalReportRequest;
import com.sgp.systemsgp.dto.document.ReviewableDocumentSummaryResponse;
import com.sgp.systemsgp.dto.finalreport.FinalReportResponse;
import com.sgp.systemsgp.dto.finalreport.ReviewFinalReportRequest;
import com.sgp.systemsgp.dto.finalreport.UpdateFinalReportInstitutionalSectionRequest;
import com.sgp.systemsgp.dto.finalreport.UpdateFinalReportRequest;
import com.sgp.systemsgp.service.FinalReportService;
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
@RequestMapping("/api/final-reports")
@RequiredArgsConstructor
public class FinalReportController {

    private final FinalReportService finalReportService;

    @PostMapping
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public FinalReportResponse create(
            Authentication authentication,
            @Valid @RequestBody CreateFinalReportRequest request) {

        return finalReportService.create(
                authentication.getName(),
                request);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<FinalReportResponse> myReports(
            Authentication authentication) {

        return finalReportService.myReports(
                authentication.getName());
    }

    @GetMapping("/me/summary")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<ReviewableDocumentSummaryResponse> myReportSummaries(
            Authentication authentication) {

        return finalReportService.myReportSummaries(
                authentication.getName());
    }

    @GetMapping("/practice-review")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public List<FinalReportResponse> practiceReviewQueue(
            Authentication authentication) {

        return finalReportService.practiceReviewQueue(
                authentication.getName());
    }

    @GetMapping("/practice-review/summary")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public List<ReviewableDocumentSummaryResponse> practiceReviewQueueSummaries(
            Authentication authentication) {

        return finalReportService.practiceReviewQueueSummaries(
                authentication.getName());
    }

    @GetMapping("/institutional-review")
    @PreAuthorize("hasRole('TUTOR_INSTITUCIONAL')")
    public List<FinalReportResponse> institutionalReviewQueue(
            Authentication authentication) {

        return finalReportService.institutionalReviewQueue(
                authentication.getName());
    }

    @GetMapping("/institutional-review/summary")
    @PreAuthorize("hasRole('TUTOR_INSTITUCIONAL')")
    public List<ReviewableDocumentSummaryResponse> institutionalReviewQueueSummaries(
            Authentication authentication) {

        return finalReportService.institutionalReviewQueueSummaries(
                authentication.getName());
    }

    @GetMapping("/submitted")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public List<FinalReportResponse> submittedDocuments(
            Authentication authentication) {

        return finalReportService.submittedDocuments(authentication.getName());
    }

    @GetMapping("/submitted/summary")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public List<ReviewableDocumentSummaryResponse> submittedDocumentSummaries(
            Authentication authentication) {

        return finalReportService.submittedDocumentSummaries(authentication.getName());
    }

    @GetMapping("/defaults")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public FinalReportResponse defaults(
            Authentication authentication,
            @RequestParam(required = false) Long enrollmentId) {

        return finalReportService.getDefaults(
                authentication.getName(),
                enrollmentId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','TUTOR_INSTITUCIONAL','DIRECTOR_PRACTICAS','ADMIN')")
    public FinalReportResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        return finalReportService.getById(
                id,
                authentication.getName());
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','TUTOR_INSTITUCIONAL','DIRECTOR_PRACTICAS','ADMIN')")
    public ResponseEntity<byte[]> exportPdf(
            Authentication authentication,
            @PathVariable Long id) {

        return PdfResponseFactory.attachment(
                finalReportService.exportApprovedPdf(
                        id,
                        authentication.getName()),
                "L.3. Informe Tutor Institucional.pdf");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public FinalReportResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateFinalReportRequest request) {

        return finalReportService.update(
                id,
                authentication.getName(),
                request);
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public FinalReportResponse submit(
            Authentication authentication,
            @PathVariable Long id) {

        return finalReportService.submit(
                id,
                authentication.getName());
    }

    @PatchMapping("/{id}/institutional-section")
    @PreAuthorize("hasRole('TUTOR_INSTITUCIONAL')")
    public FinalReportResponse updateInstitutionalSection(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateFinalReportInstitutionalSectionRequest request) {

        return finalReportService.updateInstitutionalSection(
                id,
                authentication.getName(),
                request);
    }

    @PatchMapping("/{id}/practice-review")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public FinalReportResponse reviewByPracticeTutor(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ReviewFinalReportRequest request) {

        return finalReportService.reviewByPracticeTutor(
                id,
                authentication.getName(),
                request);
    }

    @PatchMapping("/{id}/director-review")
    @PreAuthorize("hasRole('DIRECTOR_PRACTICAS')")
    public FinalReportResponse reviewByDirector(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ReviewFinalReportRequest request) {

        return finalReportService.reviewByDirector(
                id,
                authentication.getName(),
                request);
    }

    @PatchMapping("/{id}/institutional-review")
    @PreAuthorize("hasRole('TUTOR_INSTITUCIONAL')")
    public FinalReportResponse reviewByInstitutionalTutor(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ReviewFinalReportRequest request) {

        return finalReportService.reviewByInstitutionalTutor(
                id,
                authentication.getName(),
                request);
    }
}
