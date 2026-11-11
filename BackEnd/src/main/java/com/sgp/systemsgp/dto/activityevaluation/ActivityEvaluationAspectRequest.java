/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ActivityEvaluationAspectRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para la evaluación de actividades (L.4).
 */

package com.sgp.systemsgp.dto.activityevaluation;

import com.sgp.systemsgp.enums.ActivityEvaluationAspectType;
import com.sgp.systemsgp.enums.ActivityEvaluationLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActivityEvaluationAspectRequest {

    @NotNull
    private ActivityEvaluationAspectType aspectType;

    @NotBlank
    @Size(max = 500, message = "El criterio de evaluación no puede superar 500 caracteres")
    private String item;

    @NotNull
    private ActivityEvaluationLevel level;
}
