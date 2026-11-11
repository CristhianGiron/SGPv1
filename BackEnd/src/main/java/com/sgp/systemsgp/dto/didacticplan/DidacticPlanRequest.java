/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para las planificaciones didácticas.
 */

package com.sgp.systemsgp.dto.didacticplan;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @JsonIgnore
    private boolean periodsProvided;

    public void setPeriods(Integer value) {
        this.periods = value;
        this.periodsProvided = true;
    }
    private Integer weeks;
    @JsonIgnore
    private boolean weeksProvided;

    public void setWeeks(Integer value) {
        this.weeks = value;
        this.weeksProvided = true;
    }
    private LocalDate startWeek;
    @JsonIgnore
    private boolean startWeekProvided;

    public void setStartWeek(LocalDate value) {
        this.startWeek = value;
        this.startWeekProvided = true;
    }
    private LocalDate endWeek;
    @JsonIgnore
    private boolean endWeekProvided;

    public void setEndWeek(LocalDate value) {
        this.endWeek = value;
        this.endWeekProvided = true;
    }

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
