/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CompletedActivityRecordEntryFeedbackRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el registro de actividades cumplidas (L.6).
 */

package com.sgp.systemsgp.dto.completedactivity;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompletedActivityRecordEntryFeedbackRequest {

    @NotNull
    @Positive(message = "La actividad seleccionada no es válida")
    private Long entryId;

    @Size(max = 1500, message = "El feedback de la actividad no puede superar 1500 caracteres")
    private String feedback;

    @Size(max = 1500, message = "Las sugerencias de la actividad no pueden superar 1500 caracteres")
    private String suggestions;
}
