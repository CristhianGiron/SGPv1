/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CreateGradeRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para los grados educativos.
 */

package com.sgp.systemsgp.dto.grade;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateGradeRequest {

    @NotBlank(message = "El nombre del grado es obligatorio")
    @Size(max = 80, message = "El nombre del grado no puede superar 80 caracteres")
    private String name;

    @NotBlank(message = "El código del grado es obligatorio")
    @Size(max = 30, message = "El código del grado no puede superar 30 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "El código del grado solo puede contener letras, números, guion y guion bajo")
    private String code;

    /*
     * Ej:
     * 1ro EGB
     * 2do Bachillerato
     */
    @NotNull(message = "El nivel del grado es obligatorio")
    @Min(value = 1, message = "El nivel debe ser mayor o igual a 1")
    @Max(value = 20, message = "El nivel no puede superar 20")
    private Integer level;

    @NotNull(message = "La institución educativa es obligatoria")
    @Positive(message = "La institución seleccionada no es válida")
    private Long institutionId;

    private Boolean active;
}
