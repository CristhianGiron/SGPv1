/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CompletedActivityRecordRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para el registro de actividades cumplidas (L.6).
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.enums.CompletedActivityRecordStatus;
import com.sgp.systemsgp.model.CompletedActivityRecord;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompletedActivityRecordRepository
        extends JpaRepository<CompletedActivityRecord, Long> {

    java.util.List<CompletedActivityRecord> findByEnrollment_IdAndDeletedFalseOrderByIdAsc(Long enrollmentId);

    Optional<CompletedActivityRecord> findByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    boolean existsByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    Optional<CompletedActivityRecord> findByIdAndDeletedFalse(Long id);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<CompletedActivityRecord> findByStudent_UsernameAndDeletedFalse(
            String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<CompletedActivityRecord> findByCourse_PracticeTutor_UsernameAndDeletedFalse(
            String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<CompletedActivityRecord> findByStatusInAndDeletedFalse(
            List<CompletedActivityRecordStatus> statuses);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<CompletedActivityRecord> findByDeletedFalse();
}
