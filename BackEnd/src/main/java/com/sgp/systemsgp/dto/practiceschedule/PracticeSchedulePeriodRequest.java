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
