/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DidacticPlanRevision.java
 * @fecha         2026-11-10 21:24:04
 * @nota          Representa los datos persistentes de las planificaciones didácticas.
 */

package com.sgp.systemsgp.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="didactic_plan_revisions",uniqueConstraints=@UniqueConstraint(columnNames={"plan_id","revision_number"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DidacticPlanRevision {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="plan_id",nullable=false) private DidacticPlan plan;
 @Column(nullable=false) private int revisionNumber;
 @ManyToOne(optional=false) @JoinColumn(name="returned_by",nullable=false) private Account returnedBy;
 @Column(nullable=false) private LocalDateTime returnedAt;
 @Column(nullable=false,length=2000) private String reason;
 @Column(nullable=false,columnDefinition="LONGTEXT") private String snapshotJson;
 @Lob @Column(columnDefinition="LONGBLOB") private byte[] uploadedPdf;
 private String uploadedPdfFilename;
 private String uploadedPdfContentType;
}
