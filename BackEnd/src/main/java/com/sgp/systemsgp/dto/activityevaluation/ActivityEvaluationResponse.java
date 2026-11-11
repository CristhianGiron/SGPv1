/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ActivityEvaluationResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para la evaluación de actividades (L.4).
 */

package com.sgp.systemsgp.dto.activityevaluation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityEvaluationResponse {

    private Long id;

    private Long enrollmentId;

    private Long courseId;

    private String courseName;

    private Long studentId;

    private String studentUsername;

    private Long educationalInstitutionId;

    private String educationalInstitutionName;

    private String educationalInstitutionCode;

    private String educationalInstitutionAddress;

    private String educationalInstitutionPhone;

    private String educationalInstitutionEmail;

    private String practiceType;

    private String studentFullName;

    private String studentIdentification;

    private String studentEmail;

    private String studentPhone;

    private String academicPeriod;

    private String developmentMode;

    private List<ActivityEvaluationAspectResponse> aspects;

    private Integer totalScore;

    private BigDecimal averageScore;

    private Integer hoursCompleted;

    private BigDecimal activitiesCompletionPercentage;

    private LocalDate evaluationDate;

    private String evaluatedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
