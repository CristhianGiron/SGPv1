/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeCompletionSummary.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para el módulo Practice Completion Summary.
 */

package com.sgp.systemsgp.dto.enrollment;

import java.time.LocalDateTime;
import java.util.List;

/** Advisory information; it does not impose an academic hours threshold. */
public record PracticeCompletionSummary(
        Long enrollmentId,
        LocalDateTime periodEnd,
        boolean periodEnded,
        List<String> warnings,
        Integer approvedRecordMinutes,
        Integer institutionalReportMinutes,
        long attendanceMinutes) {
}
