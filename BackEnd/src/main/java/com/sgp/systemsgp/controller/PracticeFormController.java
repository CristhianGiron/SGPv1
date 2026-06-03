package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.practiceform.CreatePracticeFormRequest;
import com.sgp.systemsgp.dto.practiceform.PracticeFormResponse;
import com.sgp.systemsgp.dto.practiceform.SubmitPracticeFormResponseRequest;
import com.sgp.systemsgp.dto.practiceform.UpdatePracticeFormInterpretationRequest;
import com.sgp.systemsgp.service.PracticeFormService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/practice-forms")
@RequiredArgsConstructor
public class PracticeFormController {

    private final PracticeFormService practiceFormService;

    @PostMapping
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public PracticeFormResponse create(
            Authentication authentication,
            @Valid @RequestBody CreatePracticeFormRequest request) {

        return practiceFormService.create(
                authentication.getName(),
                request);
    }

    @PostMapping("/observations")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public PracticeFormResponse createObservation(
            Authentication authentication,
            @Valid @RequestBody CreatePracticeFormRequest request) {

        return practiceFormService.createObservation(
                authentication.getName(),
                request);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<PracticeFormResponse> myForms(
            Authentication authentication) {

        return practiceFormService.myForms(authentication.getName());
    }

    @GetMapping("/observations/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<PracticeFormResponse> myObservationForms(
            Authentication authentication) {

        return practiceFormService.myObservationForms(authentication.getName());
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('TUTOR_INSTITUCIONAL','DIRECTORA_INSTITUCION')")
    public List<PracticeFormResponse> assignedForms(
            Authentication authentication) {

        return practiceFormService.assignedForms(authentication.getName());
    }

    @GetMapping("/managed")
    @PreAuthorize("hasAnyRole('TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public List<PracticeFormResponse> managedForms(
            Authentication authentication) {

        return practiceFormService.managedForms(authentication.getName());
    }

    @GetMapping("/observations/managed")
    @PreAuthorize("hasAnyRole('TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public List<PracticeFormResponse> managedObservationForms(
            Authentication authentication) {

        return practiceFormService.managedObservationForms(authentication.getName());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL','DIRECTORA_INSTITUCION','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public PracticeFormResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        return practiceFormService.getById(
                id,
                authentication.getName());
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public PracticeFormResponse duplicate(
            Authentication authentication,
            @PathVariable Long id) {

        return practiceFormService.duplicate(
                id,
                authentication.getName());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public PracticeFormResponse updateDraft(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CreatePracticeFormRequest request) {

        return practiceFormService.updateDraft(
                id,
                authentication.getName(),
                request);
    }

    @PostMapping("/{id}/send")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public PracticeFormResponse sendDraft(
            Authentication authentication,
            @PathVariable Long id) {

        return practiceFormService.sendDraft(
                id,
                authentication.getName());
    }

    @PostMapping("/{id}/responses")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL','DIRECTORA_INSTITUCION')")
    public PracticeFormResponse submitResponse(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SubmitPracticeFormResponseRequest request) {

        return practiceFormService.submitResponse(
                id,
                authentication.getName(),
                request);
    }

    @PatchMapping("/{id}/questions/{questionId}/interpretation")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public PracticeFormResponse updateInterpretation(
            Authentication authentication,
            @PathVariable Long id,
            @PathVariable Long questionId,
            @Valid @RequestBody UpdatePracticeFormInterpretationRequest request) {

        return practiceFormService.updateInterpretation(
                id,
                questionId,
                authentication.getName(),
                request);
    }
}
