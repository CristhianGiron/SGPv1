/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeIncidentEvent.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Representa los datos persistentes de el módulo Practice Incident Event.
 */

package com.sgp.systemsgp.model.practiceincident;
import com.sgp.systemsgp.model.Account;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="practice_incident_events") @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PracticeIncidentEvent {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="incident_id",nullable=false) private PracticeIncident incident;
 @ManyToOne(optional=false) @JoinColumn(name="actor_id",nullable=false) private Account actor;
 @Column(length=24) private String previousStatus;
 @Column(nullable=false,length=24) private String newStatus;
 @Column(nullable=false,length=2000) private String reason;
 @Column(nullable=false) private LocalDateTime createdAt;
 @Column(length=1000) private String effects;
}
