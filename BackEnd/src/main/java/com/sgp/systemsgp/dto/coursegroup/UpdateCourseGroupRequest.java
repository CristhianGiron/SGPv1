/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          UpdateCourseGroupRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para los grupos del paralelo.
 */

package com.sgp.systemsgp.dto.coursegroup;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCourseGroupRequest {

    @Size(max = 80, message = "El nombre del grupo no puede superar 80 caracteres")
    private String name;

    @Size(max = 500, message = "La descripción del grupo no puede superar 500 caracteres")
    private String description;

    @Min(value = 1, message = "La capacidad del grupo debe ser mayor o igual a 1")
    @Max(value = 500, message = "La capacidad del grupo no puede superar 500")
    private Integer capacity;

    @Positive(message = "El tutor institucional seleccionado no es válido")
    private Long institutionalTutorId;

    private Boolean active;
}
