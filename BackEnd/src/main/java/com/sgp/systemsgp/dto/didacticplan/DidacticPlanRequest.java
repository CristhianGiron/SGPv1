package com.sgp.systemsgp.dto.didacticplan;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class DidacticPlanRequest {

    @NotNull
    private Long enrollmentId;

    private Long sourcePlanId;
    private Boolean draft = true;

    @Size(max = 255)
    private String title;

    @Size(max = 255)
    private String teacherName;

    @Size(max = 255)
    private String areaSubject;

    private Integer periods;
    private Integer weeks;
    private LocalDate startWeek;
    private LocalDate endWeek;

    @Size(max = 255)
    private String gradeCourse;

    @Size(max = 50)
    private String parallel;

    @Size(max = 500)
    private String planningUnitTitle;

    @Size(max = 4000)
    private String curricularInsertions;

    @Size(max = 8000)
    private String learningObjectives;

    @Size(max = 8000)
    private String evaluationCriteria;

    @Size(max = 8000)
    private String duaPrinciples;

    @Valid
    private List<DidacticPlanWeekRequest> weekPlans = new ArrayList<>();
}
