/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeScheduleRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para las jornadas de prácticas.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.PracticeSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface PracticeScheduleRepository
        extends JpaRepository<PracticeSchedule, Long> {

    boolean existsByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    Optional<PracticeSchedule> findByIdAndDeletedFalse(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from PracticeSchedule s where s.id = :id and s.deleted = false")
    Optional<PracticeSchedule> findForAttendanceUpdate(@Param("id") Long id);

    List<PracticeSchedule> findByStudent_UsernameAndDeletedFalse(
            String username);

    List<PracticeSchedule> findByCourse_InstitutionalTutor_UsernameAndDeletedFalse(
            String username);

    List<PracticeSchedule> findByEnrollment_Group_InstitutionalTutor_UsernameAndDeletedFalse(
            String username);

    List<PracticeSchedule> findByCourse_PracticeTutor_UsernameAndDeletedFalse(
            String username);

    List<PracticeSchedule> findByEducationalInstitution_IdAndDeletedFalse(
            Long institutionId);

    List<PracticeSchedule> findByDeletedFalse();
}
