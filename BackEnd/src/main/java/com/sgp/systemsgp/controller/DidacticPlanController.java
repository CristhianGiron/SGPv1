/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con las planificaciones didácticas.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.didacticplan.DidacticPlanRecommendationRequest;
import com.sgp.systemsgp.dto.didacticplan.DidacticPlanRequest;
import com.sgp.systemsgp.dto.didacticplan.DidacticPlanResponse;
import com.sgp.systemsgp.service.DidacticPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/didactic-plans")
@RequiredArgsConstructor
public class DidacticPlanController {

    private final DidacticPlanService didacticPlanService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL')")
    public DidacticPlanResponse create(
            Authentication authentication,
            @Valid @RequestBody DidacticPlanRequest request) {

        return didacticPlanService.create(authentication.getName(), request);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<DidacticPlanResponse> myPlans(Authentication authentication) {

        return didacticPlanService.myPlans(authentication.getName());
    }

    @GetMapping("/managed")
    @PreAuthorize("hasAnyRole('TUTOR_INSTITUCIONAL','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public List<DidacticPlanResponse> managedPlans(Authentication authentication) {

        return didacticPlanService.managedPlans(authentication.getName());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public DidacticPlanResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        return didacticPlanService.getById(id, authentication.getName());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL')")
    public DidacticPlanResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody DidacticPlanRequest request) {

        return didacticPlanService.update(id, authentication.getName(), request);
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL')")
    public DidacticPlanResponse submit(
            Authentication authentication,
            @PathVariable Long id) {

        return didacticPlanService.submit(id, authentication.getName());
    }

    @PatchMapping("/{id}/recommendations")
    @PreAuthorize("hasAnyRole('TUTOR_INSTITUCIONAL','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public DidacticPlanResponse recommend(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody DidacticPlanRecommendationRequest request) {

        return didacticPlanService.addRecommendations(id, authentication.getName(), request);
    }

    @PatchMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('TUTOR_PRACTICAS','DIRECTOR_PRACTICAS')")
    public DidacticPlanResponse returnPlan(Authentication a,@PathVariable Long id,
            @Valid @RequestBody com.sgp.systemsgp.dto.didacticplan.ReturnDidacticPlanRequest request) {
        return didacticPlanService.returnInstitutionalPlan(id,a.getName(),request);
    }
    @GetMapping("/{id}/revisions")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public List<com.sgp.systemsgp.dto.didacticplan.DidacticPlanRevisionSummary> revisions(Authentication a,@PathVariable Long id) {
        return didacticPlanService.revisions(id,a.getName());
    }
    @GetMapping("/{id}/revisions/{revisionId}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public DidacticPlanResponse revision(Authentication a,@PathVariable Long id,@PathVariable Long revisionId) {
        return didacticPlanService.revision(id,revisionId,a.getName());
    }
    @GetMapping("/{id}/revisions/{revisionId}/pdf")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public ResponseEntity<byte[]> revisionPdf(Authentication a,@PathVariable Long id,@PathVariable Long revisionId) {
        var pdf=didacticPlanService.revisionPdf(id,revisionId,a.getName());
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).body(pdf.content());
    }

    @PostMapping(value = "/{id}/pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL')")
    public DidacticPlanResponse uploadPdf(
            Authentication authentication,
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file) {

        return didacticPlanService.uploadPdf(id, authentication.getName(), file);
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL','TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public ResponseEntity<byte[]> uploadedPdf(
            Authentication authentication,
            @PathVariable Long id) {

        DidacticPlanService.UploadedPdf pdf = didacticPlanService.uploadedPdf(id, authentication.getName());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + pdf.filename() + "\"")
                .contentType(MediaType.parseMediaType(pdf.contentType()))
                .body(pdf.content());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL')")
    public void delete(
            Authentication authentication,
            @PathVariable Long id) {

        didacticPlanService.delete(id, authentication.getName());
    }
}
