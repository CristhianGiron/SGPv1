/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFormQuestionResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para los instrumentos de entrevista y observación.
 */

package com.sgp.systemsgp.dto.practiceform;

import com.sgp.systemsgp.enums.PracticeFormQuestionType;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PracticeFormQuestionResponse {

    private Long id;

    private Integer order;

    private PracticeFormQuestionType type;

    private String prompt;

    private boolean required;

    private boolean tabulable;

    private Integer scaleMin;

    private Integer scaleMax;

    private List<PracticeFormOptionResponse> options;

    private PracticeFormAnswerResponse answer;

    private PracticeFormQuestionTabulationResponse tabulation;

    private String studentInterpretation;
}
