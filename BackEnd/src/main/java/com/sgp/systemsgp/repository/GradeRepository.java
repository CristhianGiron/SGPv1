/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          GradeRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para los grados educativos.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Grade;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeRepository
        extends JpaRepository<Grade, Long> {

    List<Grade> findByInstitutionId(Long institutionId);

    List<Grade> findByDeletedFalse();

    Optional<Grade> findByIdAndDeletedFalse(Long id);

    boolean existsByCode(String code);

    Optional<Grade> findByCode(String code);
}
