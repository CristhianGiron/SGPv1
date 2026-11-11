/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseStudentMembershipRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para la pertenencia académica de estudiantes.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.CourseStudentMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface CourseStudentMembershipRepository extends JpaRepository<CourseStudentMembership,Long> {
    List<CourseStudentMembership> findByStudent_IdAndActiveTrue(Long studentId);
    boolean existsByCourse_IdAndStudent_IdAndActiveTrue(Long courseId,Long studentId);
    Optional<CourseStudentMembership> findByCourse_IdAndStudent_Id(Long courseId,Long studentId);
    List<CourseStudentMembership> findByCourse_IdOrderByIdAsc(Long courseId);
}
