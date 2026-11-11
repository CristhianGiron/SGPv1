/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeSchedulePeriodRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para las jornadas de prácticas.
 */

package com.sgp.systemsgp.dto.practiceschedule;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Getter
@Setter
public class PracticeSchedulePeriodRequest {

    @NotNull
    private DayOfWeek dayOfWeek;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @Size(max = 180, message = "El lugar no puede superar 180 caracteres")
    private String place;

    @Size(max = 800, message = "Las notas no pueden superar 800 caracteres")
    private String notes;

    @AssertTrue(message = "La hora de fin debe ser posterior a la hora de inicio")
    public boolean isTimeRangeValid() {
        return startTime == null || endTime == null || endTime.isAfter(startTime);
    }
}
