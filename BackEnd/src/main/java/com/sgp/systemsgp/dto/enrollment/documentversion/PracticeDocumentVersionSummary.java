/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDocumentVersionSummary.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Define los datos de respuesta para el módulo Practice Document Version Summary.
 */

package com.sgp.systemsgp.dto.enrollment.documentversion;
import java.time.LocalDateTime;
public record PracticeDocumentVersionSummary(Long id,String kind,Long documentId,int revisionNumber,String event,String documentStatus,
 String actor,LocalDateTime createdAt,String snapshotHash,boolean hasPdf) {}
