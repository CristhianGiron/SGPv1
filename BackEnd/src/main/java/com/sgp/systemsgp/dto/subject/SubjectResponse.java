/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          SubjectResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para las asignaturas.
 */

package com.sgp.systemsgp.dto.subject;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectResponse {

    private Long id;

    private String name;

    private String code;

    private String description;

    private Integer credits;

    private Integer hours;

    /*
     * UNIVERSIDAD
     */
    private Long academicCycleId;

    private String academicCycle;

    private Long courseId;

    private String course;

    private Long careerId;

    private String career;

    private Long facultyId;

    private String faculty;

    /*
     * ESCUELA / COLEGIO
     */
    private Long gradeId;

    private String grade;

    private Long gradeParallelId;

    private String gradeParallel;

    private Long institutionId;

    private String institution;

    private boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
