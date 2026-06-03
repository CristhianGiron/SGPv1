package com.sgp.systemsgp.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
public class RegisterRequest {

        /*
         * USERNAME
         */
        @NotBlank(message = "El username es obligatorio")
        @Size(min = 4, max = 50, message = "El username debe tener entre 4 y 50 caracteres")
        @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El username solo puede contener letras, números, punto, guion y guion bajo")
        private String username;

        /*
         * PASSWORD
         */
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
        private String password;

        /*
         * NOMBRES
         */
        @NotBlank(message = "Los nombres son obligatorios")
        @Size(max = 80, message = "Los nombres no pueden superar 80 caracteres")
        private String names;

        /*
         * APELLIDOS
         */
        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 80, message = "Los apellidos no pueden superar 80 caracteres")
        private String lastNames;

        /*
         * CÉDULA
         */
        @NotBlank(message = "La cédula es obligatoria")
        @Pattern(regexp = "^[0-9]{10}$", message = "La cédula debe tener 10 dígitos")
        private String cedula;

        /*
         * EMAIL INSTITUCIONAL
         */
        @NotBlank(message = "El correo institucional es obligatorio")
        @Email(message = "Correo inválido")
        @Size(max = 120, message = "El correo institucional no puede superar 120 caracteres")
        private String institutionalEmail;

        /*
         * TELÉFONO
         */
        @Pattern(regexp = "^[0-9]{10}$", message = "El teléfono debe tener 10 dígitos")
        private String phone;

        /*
         * DIRECCIÓN
         */
        @Size(max = 255, message = "La dirección es demasiado larga")
        private String address;

        /*
         * ROL PUBLICO
         */
        @Pattern(regexp = "^(ROLE_ESTUDIANTE|ROLE_TUTOR_INSTITUCIONAL|ROLE_TUTOR_PRACTICAS)?$", message = "El rol de registro no es válido")
        private String role;

        /*
         * Ciclo académico al que pertenece el estudiante.
         */
        @Positive(message = "El ciclo académico seleccionado no es válido")
        private Long academicCycleId;

        /*
         * Institución para roles que pertenecen a la universidad.
         */
        @Positive(message = "La institución seleccionada no es válida")
        private Long institutionId;

        /*
         * Paralelo universitario al que se vincula el tutor de prácticas.
         */
        @Positive(message = "El paralelo seleccionado no es válido")
        private Long courseId;

        /*
         * Paralelo institucional al que se vincula el tutor institucional.
         */
        @Positive(message = "El paralelo seleccionado no es válido")
        private Long gradeParallelId;
}
