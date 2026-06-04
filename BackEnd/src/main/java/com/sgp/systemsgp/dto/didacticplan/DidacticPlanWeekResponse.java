package com.sgp.systemsgp.dto.didacticplan;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class DidacticPlanWeekResponse {

    private Long id;
    private Integer weekNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private String contents;
    private String skill;
    private String methodologyActivities;
    private String resources;
    private String evaluationIndicators;
    private String evaluationActivities;
}
