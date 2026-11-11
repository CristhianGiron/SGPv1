/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AuthController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con la autenticación de usuarios.
 */

package com.sgp.systemsgp.controller;

import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.sgp.systemsgp.dto.auth.AuthResponse;
import com.sgp.systemsgp.dto.auth.LoginRequest;
import com.sgp.systemsgp.dto.auth.RegisterRequest;
import com.sgp.systemsgp.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.sgp.systemsgp.service.AuthSessionService sessions;

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody com.sgp.systemsgp.dto.auth.RefreshSessionRequest request) {
        return sessions.refresh(request.refreshToken());
    }
    @PostMapping({"/logout","/logout-all"})
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public void logout(org.springframework.security.core.Authentication a,jakarta.servlet.http.HttpServletRequest request,
                       @RequestHeader("Authorization") String header) {
        sessions.logout(a.getName(),header.substring(7),request.getRequestURI().endsWith("/logout-all"));
    }


    /*
     * REGISTRO
     */
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AuthResponse register(
            @RequestPart("data") @Valid RegisterRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return authService.register(request, file);
    }
    // @PostMapping("/register")
    // public AuthResponse register(
    // @Valid @RequestBody RegisterRequest request) {
    // return authService.register(request);
    // }

    /*
     * LOGIN
     */
    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
