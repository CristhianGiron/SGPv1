/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para las planificaciones didácticas.
 */

package com.sgp.systemsgp.dto.didacticplan;

import com.sgp.systemsgp.enums.DidacticPlanAuthorType;
import com.sgp.systemsgp.enums.DidacticPlanStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@lombok.extern.jackson.Jacksonized
@Builder
public class DidacticPlanResponse {

    private Long id;
    private Long enrollmentId;
    private Long studentId;
    private String studentName;
    private Long authorId;
    private String authorName;
    private DidacticPlanAuthorType authorType;
    private Long sourcePlanId;
    private DidacticPlanStatus status;
    private String courseName;
    private String educationalInstitutionName;
    private String title;
    private String teacherName;
    private String areaSubject;
    private Integer periods;
    private Integer weeks;
    private LocalDate startWeek;
    private LocalDate endWeek;
    private String gradeCourse;
    private String parallel;
    private String planningUnitTitle;
    private String curricularInsertions;
    private String learningObjectives;
    private String evaluationCriteria;
    private String duaPrinciples;
    private List<DidacticPlanWeekResponse> weekPlans;
    private boolean hasUploadedPdf;
    private String uploadedPdfFilename;
    private Long uploadedPdfSize;
    private String recommendations;
    private String recommendedByName;
    private LocalDateTime recommendedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
