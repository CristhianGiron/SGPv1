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
