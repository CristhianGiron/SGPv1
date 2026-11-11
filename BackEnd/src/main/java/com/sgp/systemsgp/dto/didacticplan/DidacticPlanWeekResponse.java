/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanWeekResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para las planificaciones didácticas.
 */

package com.sgp.systemsgp.dto.didacticplan;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@lombok.extern.jackson.Jacksonized
@Builder
public class DidacticPlanWeekResponse {

    private Long id;
    private Integer weekNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private String contents;
    private String skill;
    private String methodologyActivities;
    private String resources;
    private String evaluationIndicators;
    private String evaluationActivities;
}
