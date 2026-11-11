/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseStudentResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para la pertenencia académica de estudiantes.
 */

package com.sgp.systemsgp.dto.course;

import java.time.LocalDateTime;

public record CourseStudentResponse(Long id,String username,String names,String lastNames,boolean active,LocalDateTime assignedAt) {}
