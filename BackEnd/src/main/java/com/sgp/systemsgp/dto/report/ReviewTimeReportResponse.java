/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ReviewTimeReportResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para el módulo Review Time Report Response.
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
public class ReviewTimeReportResponse {

    private String documentType;

    private long reviewedDocuments;

    private Double averageReviewHours;
}
