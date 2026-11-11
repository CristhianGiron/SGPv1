/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AdminRecoveryController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con el módulo Admin Recovery Controller.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.account.AdminPasswordRecoveryRequest;
import com.sgp.systemsgp.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/recovery")
@RequiredArgsConstructor
public class AdminRecoveryController {

    private final AccountService accountService;

    @PostMapping("/password")
    public ResponseEntity<String> recoverAdminPassword(
            @Valid @RequestBody AdminPasswordRecoveryRequest request) {
        accountService.recoverAdminPassword(request);
        return ResponseEntity.ok("Contraseña actualizada correctamente");
    }
}
