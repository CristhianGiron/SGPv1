/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanRevisionRepository.java
 * @fecha         2026-11-10 21:24:04
 * @nota          Define las consultas de persistencia para las planificaciones didácticas.
 */

package com.sgp.systemsgp.repository;
import com.sgp.systemsgp.model.DidacticPlanRevision;
import com.sgp.systemsgp.dto.didacticplan.DidacticPlanRevisionSummary;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface DidacticPlanRevisionRepository extends JpaRepository<DidacticPlanRevision,Long> {
 long countByPlan_Id(Long id);
 Optional<DidacticPlanRevision> findByIdAndPlan_Id(Long id,Long planId);
 @Query("select new com.sgp.systemsgp.dto.didacticplan.DidacticPlanRevisionSummary(r.id,r.revisionNumber,r.returnedBy.username,r.returnedAt,r.reason) from DidacticPlanRevision r where r.plan.id=:id order by r.revisionNumber desc")
 List<DidacticPlanRevisionSummary> summaries(@Param("id") Long id);
}
