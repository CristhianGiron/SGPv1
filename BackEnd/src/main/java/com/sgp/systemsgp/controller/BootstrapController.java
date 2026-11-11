/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          BootstrapController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con el módulo Bootstrap Controller.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.admin.CreateAdminRequest;
import com.sgp.systemsgp.service.BootstrapService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/bootstrap")
@RequiredArgsConstructor
public class BootstrapController {

    private final BootstrapService bootstrapService;

    /*
     * CREAR PRIMER ADMIN (SIN AUTH)
     */
    @PostMapping("/admin")
    public ResponseEntity<Long> createFirstAdmin(
            @Valid @RequestBody CreateAdminRequest request) {
        Long id = bootstrapService.createFirstAdmin(request);
        return ResponseEntity.ok(id);
    }
}