/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseGroupRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para los grupos del paralelo.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.CourseGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseGroupRepository extends JpaRepository<CourseGroup, Long> {

    List<CourseGroup> findByCourse_IdAndDeletedFalse(Long courseId);

    List<CourseGroup> findByInstitutionalTutor_UsernameAndDeletedFalse(String username);

    Optional<CourseGroup> findByIdAndDeletedFalse(Long id);

    boolean existsByCourse_IdAndNameIgnoreCaseAndDeletedFalse(Long courseId, String name);
}
