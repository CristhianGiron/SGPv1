/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDeadlineResponse.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Define los datos de respuesta para el módulo Practice Deadline Response.
 */

package com.sgp.systemsgp.dto.enrollment.practicedeadline;
import java.time.LocalDateTime;
import java.util.List;
public record PracticeDeadlineResponse(Long id,String kind,String stage,LocalDateTime dueAt,int reminderHours,String reason,
 String updatedBy,LocalDateTime updatedAt,long revision,String state,List<String> responsibleUsers){}
