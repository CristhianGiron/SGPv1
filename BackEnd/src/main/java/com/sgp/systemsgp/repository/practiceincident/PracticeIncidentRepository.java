/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeIncidentRepository.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Define las consultas de persistencia para el módulo Practice Incident Repository.
 */

package com.sgp.systemsgp.repository.practiceincident;
import com.sgp.systemsgp.model.practiceincident.PracticeIncident;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface PracticeIncidentRepository extends JpaRepository<PracticeIncident,Long> {
 long countByEnrollment_IdAndStatusIn(Long id,java.util.Collection<com.sgp.systemsgp.enums.practiceincident.PracticeIncidentStatus> statuses);
 List<PracticeIncident> findByEnrollment_IdOrderByCreatedAtDescIdDesc(Long enrollmentId);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select i from PracticeIncident i where i.id=:id")
 Optional<PracticeIncident> findForUpdate(@Param("id") Long id);
}
