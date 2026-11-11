/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeOfferingRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para las prácticas ofrecidas a un paralelo.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.PracticeOffering;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;

public interface PracticeOfferingRepository extends JpaRepository<PracticeOffering, Long> {
    List<PracticeOffering> findByCourse_IdOrderByIdAsc(Long courseId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PracticeOffering p where p.id = :id")
    Optional<PracticeOffering> findForUpdate(@Param("id") Long id);
}
