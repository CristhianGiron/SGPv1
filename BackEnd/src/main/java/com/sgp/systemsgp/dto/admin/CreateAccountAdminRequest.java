package com.sgp.systemsgp.dto.admin;

import jakarta.validation.constraints.*;

import lombok.Data;

@Data
public class CreateAccountAdminRequest {

    @NotBlank(message = "El usuario es obligatorio")
    @Size(min = 4, max = 50, message = "El usuario debe tener entre 4 y 50 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El usuario solo puede contener letras, números, punto, guion y guion bajo")
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

    @Email(message = "El correo no tiene un formato válido")
    @Size(max = 120, message = "El correo no puede superar 120 caracteres")
    private String institutionalEmail;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "El teléfono debe tener 10 dígitos")
    private String phone;

    @Size(max = 255, message = "La dirección no puede superar 255 caracteres")
    private String address;

    @NotBlank(message = "El rol es obligatorio")
    private String role;

    @Positive(message = "El ciclo académico seleccionado no es válido")
    private Long academicCycleId;

    @Positive(message = "La carrera seleccionada no es válida")
    private Long careerId;

    @Positive(message = "El grado seleccionado no es válido")
    private Long gradeId;

    @Positive(message = "El paralelo seleccionado no es válido")
    private Long gradeParallelId;

    @Positive(message = "La institución seleccionada no es válida")
    private Long institutionId;
}
