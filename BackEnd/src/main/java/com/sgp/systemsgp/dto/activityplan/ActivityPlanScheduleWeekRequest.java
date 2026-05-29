package com.sgp.systemsgp.dto.activityplan;

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

    @Size(max = 2500, message = "Las actividades planificadas no pueden superar 2500 caracteres")
    private String scheduledActivities;

    @AssertTrue(message = "La fecha final de la semana no puede ser anterior a la fecha inicial")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}
