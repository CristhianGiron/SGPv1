package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.activityplan.ActivityPlanResponse;
import com.sgp.systemsgp.dto.activityplan.CreateActivityPlanRequest;
import com.sgp.systemsgp.dto.activityplan.ReviewActivityPlanRequest;
import com.sgp.systemsgp.dto.activityplan.UpdateActivityPlanRequest;
import com.sgp.systemsgp.dto.document.ReviewableDocumentSummaryResponse;
import com.sgp.systemsgp.service.ActivityPlanService;
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
@RequestMapping("/api/activity-plans")
@RequiredArgsConstructor
public class ActivityPlanController {

    private final ActivityPlanService activityPlanService;

    @PostMapping
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ActivityPlanResponse create(
            Authentication authentication,
            @Valid @RequestBody CreateActivityPlanRequest request) {

        return activityPlanService.create(
                authentication.getName(),
                request);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<ActivityPlanResponse> myPlans(
            Authentication authentication) {

        return activityPlanService.myPlans(
                authentication.getName());
    }

    @GetMapping("/me/summary")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<ReviewableDocumentSummaryResponse> myPlanSummaries(
            Authentication authentication) {

        return activityPlanService.myPlanSummaries(
                authentication.getName());
    }

    @GetMapping("/review")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public List<ActivityPlanResponse> reviewQueue(
            Authentication authentication) {

        return activityPlanService.reviewQueue(
                authentication.getName());
    }

    @GetMapping("/review/summary")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public List<ReviewableDocumentSummaryResponse> reviewQueueSummaries(
            Authentication authentication) {

        return activityPlanService.reviewQueueSummaries(
                authentication.getName());
    }

    @GetMapping("/submitted")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public List<ActivityPlanResponse> submittedDocuments() {

        return activityPlanService.submittedDocuments();
    }

    @GetMapping("/submitted/summary")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public List<ReviewableDocumentSummaryResponse> submittedDocumentSummaries() {

        return activityPlanService.submittedDocumentSummaries();
    }

    @GetMapping("/defaults")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ActivityPlanResponse defaults(
            Authentication authentication,
            @RequestParam(required = false) Long enrollmentId) {

        return activityPlanService.getDefaults(
                authentication.getName(),
                enrollmentId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public ActivityPlanResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        return activityPlanService.getById(
                id,
                authentication.getName());
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public ResponseEntity<byte[]> exportPdf(
            Authentication authentication,
            @PathVariable Long id) {

        return PdfResponseFactory.attachment(
                activityPlanService.exportApprovedPdf(
                        id,
                        authentication.getName()),
                "activity-plan-" + id + ".pdf");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ActivityPlanResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateActivityPlanRequest request) {

        return activityPlanService.update(
                id,
                authentication.getName(),
                request);
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public ActivityPlanResponse submit(
            Authentication authentication,
            @PathVariable Long id) {

        return activityPlanService.submit(
                id,
                authentication.getName());
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('TUTOR_PRACTICAS','DIRECTOR_PRACTICAS')")
    public ActivityPlanResponse review(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ReviewActivityPlanRequest request) {

        return activityPlanService.review(
                id,
                authentication.getName(),
                request);
    }
}
