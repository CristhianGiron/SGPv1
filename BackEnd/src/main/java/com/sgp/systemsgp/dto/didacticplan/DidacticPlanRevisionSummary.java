/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanRevisionSummary.java
 * @fecha         2026-11-10 21:24:04
 * @nota          Define los datos de respuesta para las planificaciones didácticas.
 */

package com.sgp.systemsgp.dto.didacticplan;
import java.time.LocalDateTime;
public record DidacticPlanRevisionSummary(Long id,int revisionNumber,String returnedBy,LocalDateTime returnedAt,String reason) {}
