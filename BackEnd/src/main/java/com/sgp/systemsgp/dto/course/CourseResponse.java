/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para los paralelos académicos.
 */

package com.sgp.systemsgp.dto.course;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CourseResponse {

    private String coverImageUrl;

    private Long id;

    private String name;

    private String description;

    private String curricularOrganizationUnit;

    private String integrativeKnowledgeProject;

    private String practiceType;

    private String generalObjective;

    private String specificObjective1;

    private String specificObjective2;

    private String specificObjective3;

    private String code;

    private Integer capacity;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private boolean active;

    private boolean locked;

    /*
     * ADMIN
     */
    private String createdBy;

    /*
     * TUTORES
     */
    private String institutionalTutor;

    private String practiceTutor;

    private Long subjectId;

    private String subject;

    private Long academicCycleId;

    private String academicCycle;

    private Long careerId;

    private String career;

    private Long facultyId;

    private String faculty;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
