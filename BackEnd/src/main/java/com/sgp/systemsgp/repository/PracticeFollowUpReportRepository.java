/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFollowUpReportRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para el seguimiento de prácticas (L.5).
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.PracticeFollowUpReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PracticeFollowUpReportRepository
        extends JpaRepository<PracticeFollowUpReport, Long> {

    java.util.List<PracticeFollowUpReport> findByEnrollment_IdAndDeletedFalseOrderByIdAsc(Long enrollmentId);

    boolean existsByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    Optional<PracticeFollowUpReport> findByIdAndDeletedFalse(Long id);

    List<PracticeFollowUpReport> findByStudent_UsernameAndDeletedFalse(
            String username);

    List<PracticeFollowUpReport> findByCourse_PracticeTutor_UsernameAndDeletedFalse(
            String username);
}
