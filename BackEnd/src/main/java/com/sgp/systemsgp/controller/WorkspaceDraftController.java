/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          WorkspaceDraftController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con los borradores de trabajo.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.service.WorkspaceDraftService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/drafts") @RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class WorkspaceDraftController {
    private final WorkspaceDraftService service;
    public record Write(@Min(0) long revision, @Size(max = 500000) String content) {}
    @GetMapping("/{scope}")
    public WorkspaceDraftService.Snapshot get(Authentication auth, @PathVariable String scope) {
        return service.get(auth.getName(), scope);
    }
    @PutMapping("/{scope}")
    public WorkspaceDraftService.Snapshot save(Authentication auth, @PathVariable String scope, @Valid @RequestBody Write request) {
        return service.save(auth.getName(), scope, request.revision(), request.content());
    }
}
