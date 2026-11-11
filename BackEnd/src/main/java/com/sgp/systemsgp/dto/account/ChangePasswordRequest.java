/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ChangePasswordRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el módulo Change Password Request.
 */

package com.sgp.systemsgp.dto.account;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {

    @NotBlank
    private String currentPassword;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 8, max = 72, message = "La nueva contraseña debe tener entre 8 y 72 caracteres")
    private String newPassword;

    @NotBlank(message = "La confirmación de contraseña es obligatoria")
    private String confirmPassword;

    @AssertTrue(message = "La confirmación no coincide con la nueva contraseña")
    public boolean isPasswordConfirmationValid() {
        return newPassword == null || confirmPassword == null || newPassword.equals(confirmPassword);
    }
}
