/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EnrollmentResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para las inscripciones y prácticas asignadas.
 */

package com.sgp.systemsgp.dto.enrollment;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EnrollmentResponse {

    private String coverImageUrl;

    private String institutionLogoUrl;

    private Long id;

    private String student;

    private String studentFullName;

    private String studentIdentification;

    private String studentEmail;

    private String studentPhone;

    private Long practiceId;

    private String practiceName;

    private Long courseId;

    private String courseName;

    private boolean courseActive;

    private Long groupId;

    private String groupName;

    private Long subjectId;

    private String subjectName;

    private Long facultyId;

    private String facultyName;

    private Long careerId;

    private String careerName;

    private Long academicCycleId;

    private String academicCycleName;

    private Long educationalInstitutionId;

    private String educationalInstitutionName;

    private String educationalInstitutionCode;

    private String educationalInstitutionAddress;

    private String educationalInstitutionPhone;

    private String educationalInstitutionEmail;

    private String institutionalTutor;

    private String institutionDirector;

    private String practiceTutor;

    private String studentAcademicCycle;

    private String courseAcademicCycle;

    private String status;

    private LocalDateTime enrolledAt;

    private boolean archived;

    private LocalDateTime archivedAt;
}
