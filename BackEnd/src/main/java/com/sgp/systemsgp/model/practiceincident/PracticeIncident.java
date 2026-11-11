/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeIncident.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Representa los datos persistentes de el módulo Practice Incident.
 */

package com.sgp.systemsgp.model.practiceincident;
import com.sgp.systemsgp.enums.practiceincident.PracticeIncidentStatus;
import com.sgp.systemsgp.enums.practiceincident.PracticeIncidentType;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="practice_incidents") @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PracticeIncident {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="enrollment_id",nullable=false) private Enrollment enrollment;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=40) private PracticeIncidentType type;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=24) private PracticeIncidentStatus status;
 @Column(nullable=false,length=160) private String title;
 @Column(nullable=false,length=4000) private String description;
 @ManyToOne(optional=false) @JoinColumn(name="created_by",nullable=false) private Account createdBy;
 @ManyToOne @JoinColumn(name="responsible_id") private Account responsible;
 @Column(nullable=false) private LocalDateTime createdAt;
 @Column(nullable=false) private LocalDateTime updatedAt;
}
