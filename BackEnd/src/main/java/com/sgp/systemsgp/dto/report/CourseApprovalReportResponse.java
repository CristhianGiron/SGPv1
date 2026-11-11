/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseApprovalReportResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para los paralelos académicos.
 */

package com.sgp.systemsgp.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseApprovalReportResponse {

    private Long courseId;

    private String courseName;

    private long pending;

    private long needsCorrection;

    private long approved;

    private Double averageReviewHours;
}
