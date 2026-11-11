/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          SubmitPracticeFormResponseRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para los instrumentos de entrevista y observación.
 */

package com.sgp.systemsgp.dto.practiceform;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SubmitPracticeFormResponseRequest {

    private Boolean draft;

    @Valid
    @Size(max = 120, message = "No puede enviar más de 120 respuestas")
    private List<PracticeFormAnswerRequest> answers;
}
