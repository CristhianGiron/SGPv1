/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          GradeResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para los grados educativos.
 */

package com.sgp.systemsgp.dto.grade;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeResponse {

    private Long id;

    private String name;

    private String code;

    private Integer level;

    private Long institutionId;

    private String institution;

    private boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
