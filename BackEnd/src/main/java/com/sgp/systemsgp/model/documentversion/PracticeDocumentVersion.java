/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDocumentVersion.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Representa los datos persistentes de el módulo Practice Document Version.
 */

package com.sgp.systemsgp.model.documentversion;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Enrollment;
import jakarta.persistence.*;
import lombok.*;
import com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind;
import java.time.LocalDateTime;
@Entity @Table(name="practice_document_versions",uniqueConstraints=@UniqueConstraint(columnNames={"document_kind","document_id","revision_number"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PracticeDocumentVersion {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="enrollment_id",nullable=false) private Enrollment enrollment;
 @Enumerated(EnumType.STRING) @Column(name="document_kind",nullable=false,length=4) private PracticeDocumentKind kind;
 @Column(nullable=false) private Long documentId;
 @Column(nullable=false) private int revisionNumber;
 @ManyToOne(optional=false) @JoinColumn(name="actor_id",nullable=false) private Account actor;
 @Column(nullable=false) private LocalDateTime createdAt;
 @Column(nullable=false,length=40) private String event;
 @Column(nullable=false,length=40) private String documentStatus;
 @Column(nullable=false,columnDefinition="LONGTEXT") private String snapshotJson;
 @Column(nullable=false,length=64) private String snapshotHash;
 @Lob @Column(columnDefinition="LONGBLOB") private byte[] pdf;
 @Column(length=64) private String pdfHash;
}
