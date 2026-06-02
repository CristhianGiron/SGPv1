package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.completedactivity.CompletedActivityRecordResponse;
import com.sgp.systemsgp.dto.completedactivity.CreateCompletedActivityRecordRequest;
import com.sgp.systemsgp.dto.completedactivity.ReviewCompletedActivityRecordRequest;
import com.sgp.systemsgp.dto.completedactivity.UpdateCompletedActivityRecordRequest;
import com.sgp.systemsgp.dto.document.ReviewableDocumentSummaryResponse;
import com.sgp.systemsgp.service.CompletedActivityRecordService;
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
@RequestMapping("/api/completed-activity-records")
@RequiredArgsConstructor
public class CompletedActivityRecordController {

    private final CompletedActivityRecordService completedActivityRecordService;

    @PostMapping
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public CompletedActivityRecordResponse create(
            Authentication authentication,
            @Valid @RequestBody CreateCompletedActivityRecordRequest request) {

        return completedActivityRecordService.create(
                authentication.getName(),
                request);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<CompletedActivityRecordResponse> myRecords(
            Authentication authentication) {

        return completedActivityRecordService.myRecords(
                authentication.getName());
    }

    @GetMapping("/me/summary")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<ReviewableDocumentSummaryResponse> myRecordSummaries(
            Authentication authentication) {

        return completedActivityRecordService.myRecordSummaries(
                authentication.getName());
    }

    @GetMapping("/review")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public List<CompletedActivityRecordResponse> reviewQueue(
            Authentication authentication) {

        return completedActivityRecordService.reviewQueue(
                authentication.getName());
    }

    @GetMapping("/review/summary")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public List<ReviewableDocumentSummaryResponse> reviewQueueSummaries(
            Authentication authentication) {

        return completedActivityRecordService.reviewQueueSummaries(
                authentication.getName());
    }

    @GetMapping("/submitted")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public List<CompletedActivityRecordResponse> submittedDocuments(
            Authentication authentication) {

        return completedActivityRecordService.submittedDocuments(authentication.getName());
    }

    @GetMapping("/submitted/summary")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public List<ReviewableDocumentSummaryResponse> submittedDocumentSummaries(
            Authentication authentication) {

        return completedActivityRecordService.submittedDocumentSummaries(authentication.getName());
    }

    @GetMapping("/defaults")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public CompletedActivityRecordResponse defaults(
            Authentication authentication,
            @RequestParam(required = false) Long enrollmentId) {

        return completedActivityRecordService.getDefaults(
                authentication.getName(),
                enrollmentId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public CompletedActivityRecordResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        return completedActivityRecordService.getById(
                id,
                authentication.getName());
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public ResponseEntity<byte[]> exportPdf(
            Authentication authentication,
            @PathVariable Long id) {

        return PdfResponseFactory.attachment(
                completedActivityRecordService.exportApprovedPdf(
                        id,
                        authentication.getName()),
                "L.6. Registro de Actividades Cumplidas.pdf");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public CompletedActivityRecordResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCompletedActivityRecordRequest request) {

        return completedActivityRecordService.update(
                id,
                authentication.getName(),
                request);
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public CompletedActivityRecordResponse submit(
            Authentication authentication,
            @PathVariable Long id) {

        return completedActivityRecordService.submit(
                id,
                authentication.getName());
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('TUTOR_PRACTICAS','DIRECTOR_PRACTICAS')")
    public CompletedActivityRecordResponse review(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ReviewCompletedActivityRecordRequest request) {

        return completedActivityRecordService.review(
                id,
                authentication.getName(),
                request);
    }
}
