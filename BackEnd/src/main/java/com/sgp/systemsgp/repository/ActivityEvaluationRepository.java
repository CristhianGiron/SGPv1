/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ActivityEvaluationRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para la evaluación de actividades (L.4).
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.ActivityEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ActivityEvaluationRepository
        extends JpaRepository<ActivityEvaluation, Long> {

    java.util.List<ActivityEvaluation> findByEnrollment_IdAndDeletedFalseOrderByIdAsc(Long enrollmentId);

    boolean existsByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    Optional<ActivityEvaluation> findByIdAndDeletedFalse(Long id);

    List<ActivityEvaluation> findByStudent_UsernameAndDeletedFalse(String username);

    List<ActivityEvaluation> findByCourse_PracticeTutor_UsernameAndDeletedFalse(
            String username);
}
