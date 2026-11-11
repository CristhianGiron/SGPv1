/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeOfferingResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para las prácticas ofrecidas a un paralelo.
 */

package com.sgp.systemsgp.dto.enrollment;
import java.time.LocalDateTime;
public record PracticeOfferingResponse(Long id, Long courseId, String name, Integer capacity,
        LocalDateTime startDate, LocalDateTime endDate, boolean enrollmentOpen, long assignedStudents) {}
