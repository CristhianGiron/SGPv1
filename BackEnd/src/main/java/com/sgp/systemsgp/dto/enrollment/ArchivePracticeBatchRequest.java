/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ArchivePracticeBatchRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el módulo Archive Practice Batch Request.
 */

package com.sgp.systemsgp.dto.enrollment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ArchivePracticeBatchRequest {

    private List<Long> enrollmentIds;

    private boolean archived;
}
