/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FeedbackCommentResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para el módulo Feedback Comment Response.
 */

package com.sgp.systemsgp.dto.feedback;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackCommentResponse {

    private Long id;

    private String documentType;

    private Long documentId;

    private String sectionKey;

    private Long entryId;

    private Integer reviewCycle;

    private String message;

    private String authorUsername;

    private String authorName;

    private String authorRole;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
