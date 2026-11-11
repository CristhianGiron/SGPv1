/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFormOptionResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para los instrumentos de entrevista y observación.
 */

package com.sgp.systemsgp.dto.practiceform;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PracticeFormOptionResponse {

    private Long id;

    private String label;

    private Integer order;
}
