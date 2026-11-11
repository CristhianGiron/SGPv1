/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para las planificaciones didácticas.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.DidacticPlan;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DidacticPlanRepository extends JpaRepository<DidacticPlan, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from DidacticPlan p where p.id=:id and p.deleted=false")
    Optional<DidacticPlan> findForUpdate(@org.springframework.data.repository.query.Param("id") Long id);


    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    Optional<DidacticPlan> findByIdAndDeletedFalse(Long id);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    List<DidacticPlan> findByStudent_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    List<DidacticPlan> findByEnrollment_Group_InstitutionalTutor_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    List<DidacticPlan> findByCourse_InstitutionalTutor_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    List<DidacticPlan> findByCourse_PracticeTutor_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    List<DidacticPlan> findByDeletedFalse();
}
