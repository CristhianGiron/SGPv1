/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanWeekRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para las planificaciones didácticas.
 */

package com.sgp.systemsgp.dto.didacticplan;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DidacticPlanWeekRequest {

    private Integer weekNumber;
    private LocalDate startDate;
    private LocalDate endDate;

    @Size(max = 4000)
    private String contents;

    @Size(max = 4000)
    private String skill;

    @Size(max = 6000)
    private String methodologyActivities;

    @Size(max = 3000)
    private String resources;

    @Size(max = 4000)
    private String evaluationIndicators;

    @Size(max = 4000)
    private String evaluationActivities;
}
