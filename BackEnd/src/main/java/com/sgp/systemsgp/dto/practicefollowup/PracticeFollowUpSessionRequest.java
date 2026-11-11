/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFollowUpSessionRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el seguimiento de prácticas (L.5).
 */

package com.sgp.systemsgp.dto.practicefollowup;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class PracticeFollowUpSessionRequest {

    @NotNull
    private LocalDate supervisionDate;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @PositiveOrZero(message = "El total de minutos no puede ser negativo")
    @Max(value = 1440, message = "El total de minutos no puede superar un día completo")
    private Integer totalMinutes;

    @Size(max = 2500, message = "Las actividades supervisadas no pueden superar 2500 caracteres")
    private String supervisedActivities;

    @AssertTrue(message = "La hora de fin debe ser posterior a la hora de inicio")
    public boolean isTimeRangeValid() {
        return startTime == null || endTime == null || endTime.isAfter(startTime);
    }
}
