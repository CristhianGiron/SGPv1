/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FinalReportRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para el informe del tutor institucional (L.3).
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.enums.FinalReportStatus;
import com.sgp.systemsgp.model.FinalReport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinalReportRepository
        extends JpaRepository<FinalReport, Long> {

    java.util.List<FinalReport> findByEnrollment_IdAndDeletedFalseOrderByIdAsc(Long enrollmentId);

    boolean existsByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "practiceReviewedBy",
            "institutionalReviewedBy",
            "directorReviewedBy"
    })
    Optional<FinalReport> findByIdAndDeletedFalse(Long id);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "practiceReviewedBy",
            "institutionalReviewedBy",
            "directorReviewedBy"
    })
    List<FinalReport> findByStudent_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "practiceReviewedBy",
            "institutionalReviewedBy",
            "directorReviewedBy"
    })
    List<FinalReport> findByCourse_PracticeTutor_UsernameAndDeletedFalse(
            String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "practiceReviewedBy",
            "institutionalReviewedBy",
            "directorReviewedBy"
    })
    List<FinalReport> findByCourse_InstitutionalTutor_UsernameAndDeletedFalse(
            String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "practiceReviewedBy",
            "institutionalReviewedBy",
            "directorReviewedBy"
    })
    List<FinalReport> findByEnrollment_Group_InstitutionalTutor_UsernameAndDeletedFalse(
            String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "practiceReviewedBy",
            "institutionalReviewedBy",
            "directorReviewedBy"
    })
    List<FinalReport> findByStatusInAndDeletedFalse(
            List<FinalReportStatus> statuses);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "practiceReviewedBy",
            "institutionalReviewedBy",
            "directorReviewedBy"
    })
    List<FinalReport> findByDeletedFalse();
}
