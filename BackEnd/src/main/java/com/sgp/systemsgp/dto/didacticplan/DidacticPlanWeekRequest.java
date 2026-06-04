package com.sgp.systemsgp.dto.didacticplan;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DidacticPlanWeekRequest {

    private Integer weekNumber;
    private LocalDate startDate;
    private LocalDate endDate;

    @Size(max = 4000)
    private String contents;

    @Size(max = 4000)
    private String skill;

    @Size(max = 6000)
    private String methodologyActivities;

    @Size(max = 3000)
    private String resources;

    @Size(max = 4000)
    private String evaluationIndicators;

    @Size(max = 4000)
    private String evaluationActivities;
}
