/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          GradeParallelResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para los paralelos de los centros receptores.
 */

package com.sgp.systemsgp.dto.gradeparallel;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GradeParallelResponse {

    private Long id;

    private String letter;

    private String name;

    private Long gradeId;

    private String grade;

    private Long institutionId;

    private String institution;

    private boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
