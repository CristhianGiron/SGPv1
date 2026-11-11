/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FacultyRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para las facultades universitarias.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Faculty;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FacultyRepository
        extends JpaRepository<Faculty, Long> {

    boolean existsByCode(String code);

    List<Faculty> findByInstitutionId(Long institutionId);

    List<Faculty> findByDeletedFalse();

    Optional<Faculty> findByIdAndDeletedFalse(Long id);
}
