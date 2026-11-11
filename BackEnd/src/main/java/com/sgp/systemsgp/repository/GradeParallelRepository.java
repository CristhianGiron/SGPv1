/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          GradeParallelRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para los paralelos de los centros receptores.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.GradeParallel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeParallelRepository
        extends JpaRepository<GradeParallel, Long> {

    List<GradeParallel> findByDeletedFalse();

    List<GradeParallel> findByGrade_IdAndDeletedFalse(Long gradeId);

    Optional<GradeParallel> findByIdAndDeletedFalse(Long id);

    boolean existsByGrade_IdAndLetterIgnoreCaseAndDeletedFalse(
            Long gradeId,
            String letter);
}
