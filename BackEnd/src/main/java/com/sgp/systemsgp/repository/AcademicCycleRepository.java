/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AcademicCycleRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para los ciclos académicos.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.AcademicCycle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicCycleRepository
        extends JpaRepository<AcademicCycle, Long> {

    List<AcademicCycle> findByCareerId(Long careerId);

    List<AcademicCycle> findByDeletedFalse();

    List<AcademicCycle> findByDeletedFalseAndActiveTrue();

    Optional<AcademicCycle> findByIdAndDeletedFalse(Long id);

    boolean existsByNameIgnoreCaseAndCareerId(
            String name,
            Long careerId);
}
