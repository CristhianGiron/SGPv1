/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ActivityPlanScheduleWeekRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el plan de actividades (L.2).
 */

package com.sgp.systemsgp.dto.activityplan;

import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ActivityPlanScheduleWeekRequest {

    @Min(1)
    private Integer weekNumber;

    private LocalDate startDate;

    private LocalDate endDate;

    @JsonAlias("activities")
    @Size(max = 2500, message = "Las actividades planificadas no pueden superar 2500 caracteres")
    private String scheduledActivities;

    @AssertTrue(message = "La fecha final de la semana no puede ser anterior a la fecha inicial")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}
