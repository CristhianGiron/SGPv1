/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          StudentPracticeFormResponseRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para los instrumentos de entrevista y observación.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.StudentPracticeFormResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentPracticeFormResponseRepository extends JpaRepository<StudentPracticeFormResponse, Long> {

    boolean existsByForm_Id(Long formId);

    Optional<StudentPracticeFormResponse> findByForm_Id(Long formId);
}
