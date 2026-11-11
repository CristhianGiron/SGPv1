/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFormAnswerResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para los instrumentos de entrevista y observación.
 */

package com.sgp.systemsgp.dto.practiceform;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class PracticeFormAnswerResponse {

    private Long questionId;

    private String textAnswer;

    private BigDecimal numberAnswer;

    private Boolean booleanAnswer;

    private List<String> selectedOptions;
}
