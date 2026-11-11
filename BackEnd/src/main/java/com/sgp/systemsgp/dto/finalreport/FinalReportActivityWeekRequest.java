/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FinalReportActivityWeekRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el informe del tutor institucional (L.3).
 */

package com.sgp.systemsgp.dto.finalreport;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class FinalReportActivityWeekRequest {

    @Min(1)
    private Integer weekNumber;

    private LocalDate startDate;

    private LocalDate endDate;

    @Size(max = 2500, message = "Las actividades de la semana no pueden superar 2500 caracteres")
    private String activities;

    @AssertTrue(message = "La fecha final de la semana no puede ser anterior a la fecha inicial")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}
