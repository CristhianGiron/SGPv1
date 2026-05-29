package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.activityevaluation.ActivityEvaluationResponse;
import com.sgp.systemsgp.dto.activityevaluation.CreateActivityEvaluationRequest;
import com.sgp.systemsgp.dto.activityevaluation.UpdateActivityEvaluationRequest;
import com.sgp.systemsgp.service.ActivityEvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/activity-evaluations")
@RequiredArgsConstructor
public class ActivityEvaluationController {

    private final ActivityEvaluationService activityEvaluationService;

    @PostMapping
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public ActivityEvaluationResponse create(
            Authentication authentication,
            @Valid @RequestBody CreateActivityEvaluationRequest request) {

        return activityEvaluationService.create(
                authentication.getName(),
                request);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<ActivityEvaluationResponse> myEvaluations(
            Authentication authentication) {

        return activityEvaluationService.myEvaluations(
                authentication.getName());
    }

    @GetMapping("/managed")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public List<ActivityEvaluationResponse> managedEvaluations(
            Authentication authentication) {

        return activityEvaluationService.managedEvaluations(
                authentication.getName());
    }

    @GetMapping("/defaults")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public ActivityEvaluationResponse defaults(
            Authentication authentication,
            @RequestParam(required = false) Long enrollmentId) {

        return activityEvaluationService.getDefaults(
                authentication.getName(),
                enrollmentId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public ActivityEvaluationResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        return activityEvaluationService.getById(
                id,
                authentication.getName());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR_PRACTICAS')")
    public ActivityEvaluationResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateActivityEvaluationRequest request) {

        return activityEvaluationService.update(
                id,
                authentication.getName(),
                request);
    }
}
