/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ActivityPlanRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para el plan de actividades (L.2).
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.enums.ActivityPlanStatus;
import com.sgp.systemsgp.model.ActivityPlan;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ActivityPlanRepository
        extends JpaRepository<ActivityPlan, Long> {

    java.util.List<ActivityPlan> findByEnrollment_IdAndDeletedFalseOrderByIdAsc(Long enrollmentId);

    boolean existsByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    Optional<ActivityPlan> findByIdAndDeletedFalse(Long id);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<ActivityPlan> findByStudent_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<ActivityPlan> findByCourse_PracticeTutor_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<ActivityPlan> findByStatusInAndDeletedFalse(
            List<ActivityPlanStatus> statuses);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<ActivityPlan> findByDeletedFalse();
}
