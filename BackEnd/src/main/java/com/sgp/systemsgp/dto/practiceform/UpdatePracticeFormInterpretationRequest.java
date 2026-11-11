/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          UpdatePracticeFormInterpretationRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para los instrumentos de entrevista y observación.
 */

package com.sgp.systemsgp.dto.practiceform;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePracticeFormInterpretationRequest {

    @Size(max = 5000, message = "La interpretación no puede superar 5000 caracteres")
    private String interpretation;
}
