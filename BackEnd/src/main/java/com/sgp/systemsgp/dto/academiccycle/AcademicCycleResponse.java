/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AcademicCycleResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para los ciclos académicos.
 */

package com.sgp.systemsgp.dto.academiccycle;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicCycleResponse {

    private Long id;

    private String name;

    private Integer level;

    /*
     * Carrera
     */
    private Long careerId;

    private String career;

    /*
     * Facultad
     */
    private Long facultyId;

    private String faculty;

    /*
     * Institución
     */
    private Long institutionId;

    private String institution;

    /*
     * Estado
     */
    private boolean active;

    /*
     * Auditoría
     */
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}