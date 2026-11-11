/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ReviewCompletedActivityRecordRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el registro de actividades cumplidas (L.6).
 */

package com.sgp.systemsgp.dto.completedactivity;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ReviewCompletedActivityRecordRequest {

    private Boolean approved;

    @Size(max = 1500, message = "El feedback de información general no puede superar 1500 caracteres")
    private String generalInfoFeedback;

    @Size(max = 1500, message = "El feedback de actividades no puede superar 1500 caracteres")
    private String activitiesFeedback;

    @Size(max = 1500, message = "El feedback de acreditación no puede superar 1500 caracteres")
    private String accreditationFeedback;

    @Valid
    @Size(max = 120, message = "No se pueden enviar más de 120 comentarios por actividad")
    private List<CompletedActivityRecordEntryFeedbackRequest> entryFeedback;
}
