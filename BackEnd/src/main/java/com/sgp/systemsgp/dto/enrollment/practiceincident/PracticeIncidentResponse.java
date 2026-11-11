/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeIncidentResponse.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Define los datos de respuesta para el módulo Practice Incident Response.
 */

package com.sgp.systemsgp.dto.enrollment.practiceincident;
import java.time.LocalDateTime;
import java.util.List;
public record PracticeIncidentResponse(Long id,Long enrollmentId,String type,String status,String title,String description,
 String createdBy,Long responsibleId,String responsible,LocalDateTime createdAt,LocalDateTime updatedAt,List<Event> events){
 public record Event(Long id,String actor,String previousStatus,String newStatus,String reason,String effects,LocalDateTime createdAt){}
 public record Responsible(Long id,String username,String name){}
}
