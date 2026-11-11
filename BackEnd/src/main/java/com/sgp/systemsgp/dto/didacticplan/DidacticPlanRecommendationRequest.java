/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanRecommendationRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para las planificaciones didácticas.
 */

package com.sgp.systemsgp.dto.didacticplan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DidacticPlanRecommendationRequest {

    @NotBlank
    @Size(max = 6000)
    private String recommendations;
}
