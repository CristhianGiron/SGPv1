/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDeadlineRepository.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Define las consultas de persistencia para el módulo Practice Deadline Repository.
 */

package com.sgp.systemsgp.repository.practicedeadline;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind;
import com.sgp.systemsgp.enums.practicedeadline.PracticeDeadlineStage;
import com.sgp.systemsgp.model.practicedeadline.PracticeDeadline;
import com.sgp.systemsgp.enums.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface PracticeDeadlineRepository extends JpaRepository<PracticeDeadline,Long> {
 List<PracticeDeadline> findByEnrollment_IdOrderByDueAtAsc(Long id);
 Optional<PracticeDeadline> findByEnrollment_IdAndKindAndStage(Long id,PracticeDocumentKind kind,PracticeDeadlineStage stage);
 @Query("select d.id from PracticeDeadline d where d.enrollment.status=com.sgp.systemsgp.enums.EnrollmentStatus.APPROVED and d.enrollment.archived=false and d.enrollment.course.active=true and d.enrollment.course.deleted=false")
 List<Long> activeIds();
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select d from PracticeDeadline d where d.id=:id")
 Optional<PracticeDeadline> findForUpdate(@Param("id") Long id);
}
