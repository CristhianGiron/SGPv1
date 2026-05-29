package com.sgp.systemsgp.dto.practiceschedule;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class UpdatePracticeScheduleRequest {

    private LocalDate startDate;

    private LocalDate endDate;

    @Size(max = 1200, message = "Las observaciones no pueden superar 1200 caracteres")
    private String observations;

    @Valid
    @Size(max = 21, message = "El horario no puede superar 21 períodos")
    private List<PracticeSchedulePeriodRequest> periods;

    @AssertTrue(message = "La fecha de fin no puede ser anterior a la fecha de inicio")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}
