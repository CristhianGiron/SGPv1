/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticePhotoResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para las evidencias fotográficas.
 */

package com.sgp.systemsgp.dto.practicephoto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticePhotoResponse {

    private Long id;

    private Long enrollmentId;

    private Long courseId;

    private String courseName;

    private Long studentId;

    private String studentUsername;

    private String studentFullName;

    private String studentIdentification;

    private LocalDate practiceDate;

    private String description;

    private String originalFilename;

    private String contentType;

    private Long fileSize;

    private String contentUrl;

    private String publicContentUrl;

    private String uploadedBy;

    private LocalDateTime uploadedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
