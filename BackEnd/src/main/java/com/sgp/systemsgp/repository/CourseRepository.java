/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para los paralelos académicos.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository
        extends JpaRepository<Course, Long>,
                JpaSpecificationExecutor<Course> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Course c where c.id = :id and c.deleted = false")
    Optional<Course> findForUpdate(@Param("id") Long id);

    boolean existsByCode(String code);

    List<Course> findByDeletedFalse();

    List<Course> findByPracticeTutor_UsernameAndDeletedFalse(String username);

    List<Course> findByInstitutionalTutor_UsernameAndDeletedFalse(String username);

    List<Course> findByAcademicCycle_IdAndDeletedFalse(Long academicCycleId);

    Optional<Course> findByIdAndDeletedFalse(Long id);

    @Query("""
            SELECT c
            FROM Course c
            LEFT JOIN FETCH c.institutionalTutor it
            LEFT JOIN FETCH it.institution
            LEFT JOIN FETCH c.practiceTutor pt
            LEFT JOIN FETCH pt.institution
            WHERE c.id = :id
              AND c.deleted = false
            """)
    Optional<Course> findByIdWithTutorsAndInstitutions(@Param("id") Long id);
}
