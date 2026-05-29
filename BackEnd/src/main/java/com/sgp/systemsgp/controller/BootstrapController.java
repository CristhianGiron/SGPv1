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