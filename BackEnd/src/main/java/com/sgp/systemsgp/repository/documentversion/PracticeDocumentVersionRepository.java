/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDocumentVersionRepository.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Define las consultas de persistencia para el módulo Practice Document Version Repository.
 */

package com.sgp.systemsgp.repository.documentversion;
import com.sgp.systemsgp.model.documentversion.PracticeDocumentVersion;
import com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind;
import com.sgp.systemsgp.dto.enrollment.documentversion.PracticeDocumentVersionSummary;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface PracticeDocumentVersionRepository extends JpaRepository<PracticeDocumentVersion,Long> {
 Optional<PracticeDocumentVersion> findFirstByKindAndDocumentIdAndPdfHashIsNotNullOrderByIdDesc(PracticeDocumentKind kind,Long documentId);
 long countByKindAndDocumentId(PracticeDocumentKind kind,Long id);
 boolean existsByKindAndDocumentIdAndDocumentStatus(PracticeDocumentKind kind,Long id,String status);
 Optional<PracticeDocumentVersion> findByIdAndEnrollment_Id(Long id,Long enrollmentId);
 Optional<PracticeDocumentVersion> findFirstByEnrollment_IdAndKindOrderByIdDesc(Long enrollmentId,PracticeDocumentKind kind);
 @Query("select new com.sgp.systemsgp.dto.enrollment.documentversion.PracticeDocumentVersionSummary(v.id,cast(v.kind as string),v.documentId,v.revisionNumber,v.event,v.documentStatus,v.actor.username,v.createdAt,v.snapshotHash,(v.pdfHash is not null)) from PracticeDocumentVersion v where v.enrollment.id=:id order by v.id desc")
 List<PracticeDocumentVersionSummary> summaries(@Param("id") Long id);
}
