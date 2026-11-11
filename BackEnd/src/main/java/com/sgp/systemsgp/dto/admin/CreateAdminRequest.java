/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CreateAdminRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el módulo Create Admin Request.
 */

package com.sgp.systemsgp.dto.admin;

import jakarta.validation.constraints.*;

import lombok.Data;

@Data
public class CreateAdminRequest {

    @NotBlank(message = "El username es obligatorio")
    @Size(min = 4, max = 50, message = "El username debe tener entre 4 y 50 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El username solo puede contener letras, números, punto, guion y guion bajo")
    private String username;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
    private String password;

    @NotBlank(message = "Los nombres son obligatorios")
    @Size(max = 80, message = "Los nombres no pueden superar 80 caracteres")
    private String names;

    @NotBlank(message = "Los apellidos son obligatorios")
    @Size(max = 80, message = "Los apellidos no pueden superar 80 caracteres")
    private String lastNames;

    @NotBlank(message = "La cédula es obligatoria")
    @Pattern(regexp = "^[0-9]{10}$", message = "La cédula debe tener 10 dígitos")
    private String cedula;

    @Email(message = "Correo inválido")
    @Size(max = 120, message = "El correo no puede superar 120 caracteres")
    private String institutionalEmail;
}
