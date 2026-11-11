/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeReportActivityWeekResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para el informe de actividades cumplidas (L.1).
 */

package com.sgp.systemsgp.dto.practicereport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticeReportActivityWeekResponse {

    private Long id;

    private Integer weekNumber;

    private LocalDate startDate;

    private LocalDate endDate;

    private String activities;
}
