package com.sgp.systemsgp.dto.completedactivity;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class CompletedActivityRecordEntryRequest {

    @NotNull
    private LocalDate activityDate;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @PositiveOrZero(message = "El total de minutos no puede ser negativo")
    @Max(value = 1440, message = "El total de minutos no puede superar un día completo")
    private Integer totalMinutes;

    @Size(max = 2500, message = "Las actividades desarrolladas no pueden superar 2500 caracteres")
    private String developedActivities;

    @Size(max = 500, message = "El enlace de evidencia no puede superar 500 caracteres")
    @Pattern(regexp = "^$|^https?://.+", message = "El enlace de evidencia debe iniciar con http:// o https://")
    private String evidenceLink;

    @AssertTrue(message = "La hora de fin debe ser posterior a la hora de inicio")
    public boolean isTimeRangeValid() {
        return startTime == null || endTime == null || endTime.isAfter(startTime);
    }
}
