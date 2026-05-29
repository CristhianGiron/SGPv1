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
