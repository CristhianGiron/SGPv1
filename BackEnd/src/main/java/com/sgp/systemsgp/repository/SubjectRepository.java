/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          SubjectRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para las asignaturas.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Subject;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository
        extends JpaRepository<Subject, Long> {

    List<Subject> findByAcademicCycle_Career_Id(Long careerId);

    List<Subject> findByGradeId(Long gradeId);

    List<Subject> findByDeletedFalse();

    Optional<Subject> findByIdAndDeletedFalse(Long id);

    boolean existsByCode(String code);

    Optional<Subject> findByCode(String code);

    List<Subject> findByAcademicCycleId(Long academicCycleId);

    List<Subject> findByCourse_IdAndDeletedFalse(Long courseId);

}
