/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeAttendanceRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para la asistencia a prácticas.
 */

package com.sgp.systemsgp.dto.practiceschedule;

import com.sgp.systemsgp.enums.PracticeAttendanceStatus;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class PracticeAttendanceRequest {

    @Positive(message = "El período de horario seleccionado no es válido")
    private Long schedulePeriodId;

    @NotNull
    private LocalDate attendanceDate;

    private LocalTime startTime;

    private LocalTime endTime;

    @PositiveOrZero(message = "El total de minutos no puede ser negativo")
    @Max(value = 1440, message = "El total de minutos no puede superar un día completo")
    private Integer totalMinutes;

    @NotNull
    private PracticeAttendanceStatus status;

    @Size(max = 1200, message = "Las observaciones no pueden superar 1200 caracteres")
    private String observations;

    @AssertTrue(message = "La hora de fin debe ser posterior a la hora de inicio")
    public boolean isTimeRangeValid() {
        return startTime == null || endTime == null || endTime.isAfter(startTime);
    }
}
