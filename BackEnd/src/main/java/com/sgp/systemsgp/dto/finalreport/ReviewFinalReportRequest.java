/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ReviewFinalReportRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el informe del tutor institucional (L.3).
 */

package com.sgp.systemsgp.dto.finalreport;

import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewFinalReportRequest {

    private Boolean approved;

    @Size(max = 1500, message = "El feedback de información general no puede superar 1500 caracteres")
    private String generalInfoFeedback;

    @Size(max = 1500, message = "El feedback de antecedentes no puede superar 1500 caracteres")
    private String antecedentsFeedback;

    @Size(max = 1500, message = "El feedback de objetivo no puede superar 1500 caracteres")
    private String objectiveFeedback;

    @Size(max = 1500, message = "El feedback de actividades no puede superar 1500 caracteres")
    private String activitiesFeedback;

    @Size(max = 1500, message = "El feedback de conclusiones no puede superar 1500 caracteres")
    private String conclusionsFeedback;

    @Size(max = 1500, message = "El feedback de recomendaciones no puede superar 1500 caracteres")
    private String recommendationsFeedback;

    @Size(max = 1500, message = "El feedback de aprobación no puede superar 1500 caracteres")
    private String approvalFeedback;
}
