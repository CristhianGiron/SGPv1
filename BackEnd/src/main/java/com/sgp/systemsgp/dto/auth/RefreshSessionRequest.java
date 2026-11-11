/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          RefreshSessionRequest.java
 * @fecha         2026-11-10 21:24:04
 * @nota          Define los datos de entrada para el módulo Refresh Session Request.
 */

package com.sgp.systemsgp.dto.auth;
import jakarta.validation.constraints.*;
public record RefreshSessionRequest(@NotBlank @Size(max=4096) String refreshToken) {}
