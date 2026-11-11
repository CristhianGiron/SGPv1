/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          UpdateGradeParallelRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para los paralelos de los centros receptores.
 */

package com.sgp.systemsgp.dto.gradeparallel;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import lombok.Data;

@Data
public class UpdateGradeParallelRequest {

    @Pattern(regexp = "^[A-Z]$", message = "El paralelo debe ser una letra de la A a la Z")
    private String letter;

    @Positive(message = "El grado seleccionado no es válido")
    private Long gradeId;

    private Boolean active;
}
