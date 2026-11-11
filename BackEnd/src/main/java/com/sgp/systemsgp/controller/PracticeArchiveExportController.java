/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeArchiveExportController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone la descarga del expediente de una práctica como archivo ZIP.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.service.PracticeArchiveExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor
public class PracticeArchiveExportController {
    private final PracticeArchiveExportService service;
    @GetMapping("/api/enrollments/{id}/archive.zip")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','TUTOR_INSTITUCIONAL','DIRECTOR_PRACTICAS','ADMIN')")
    public ResponseEntity<byte[]> export(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("application/zip"))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("expediente-practica-" + id + ".zip").build().toString())
                .body(service.export(id, auth.getName()));
    }
}
