/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDeadlineNotice.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Representa los datos persistentes de el módulo Practice Deadline Notice.
 */

package com.sgp.systemsgp.model.practicedeadline;
import com.sgp.systemsgp.model.Account;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="practice_deadline_notices",uniqueConstraints=@UniqueConstraint(columnNames={"deadline_id","deadline_revision","recipient_id","phase"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PracticeDeadlineNotice {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="deadline_id",nullable=false) private PracticeDeadline deadline;
 @Column(nullable=false) private long deadlineRevision;
 @ManyToOne(optional=false) @JoinColumn(name="recipient_id",nullable=false) private Account recipient;
 @Column(nullable=false,length=16) private String phase;
 @Column(nullable=false) private LocalDateTime sentAt;
}
