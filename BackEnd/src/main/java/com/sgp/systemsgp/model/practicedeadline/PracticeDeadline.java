/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDeadline.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Representa los datos persistentes de el módulo Practice Deadline.
 */

package com.sgp.systemsgp.model.practicedeadline;
import com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind;
import com.sgp.systemsgp.enums.practicedeadline.PracticeDeadlineStage;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Enrollment;
import jakarta.persistence.*;
import lombok.*;
import com.sgp.systemsgp.enums.*;
import java.time.LocalDateTime;
@Entity @Table(name="practice_deadlines",uniqueConstraints=@UniqueConstraint(columnNames={"enrollment_id","document_kind","stage"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PracticeDeadline {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="enrollment_id",nullable=false) private Enrollment enrollment;
 @Enumerated(EnumType.STRING) @Column(name="document_kind",length=4,nullable=false) private PracticeDocumentKind kind;
 @Enumerated(EnumType.STRING) @Column(length=32,nullable=false) private PracticeDeadlineStage stage;
 @Column(nullable=false) private LocalDateTime dueAt;
 @Column(nullable=false) private int reminderHours;
 @Column(nullable=false,length=2000) private String reason;
 @ManyToOne(optional=false) @JoinColumn(name="updated_by",nullable=false) private Account updatedBy;
 @Column(nullable=false) private LocalDateTime updatedAt;
 @Column(nullable=false) private long revision;
}
