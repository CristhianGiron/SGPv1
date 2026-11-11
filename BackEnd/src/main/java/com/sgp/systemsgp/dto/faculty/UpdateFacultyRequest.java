/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          UpdateFacultyRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para las facultades universitarias.
 */

package com.sgp.systemsgp.dto.faculty;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateFacultyRequest {

    @Size(max = 120, message = "El nombre de la facultad no puede superar 120 caracteres")
    private String name;

    @Size(max = 30, message = "El código de la facultad no puede superar 30 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "El código de la facultad solo puede contener letras, números, guion y guion bajo")
    private String code;

    @Size(max = 500, message = "La descripción de la facultad no puede superar 500 caracteres")
    private String description;

    private Boolean active;
}
