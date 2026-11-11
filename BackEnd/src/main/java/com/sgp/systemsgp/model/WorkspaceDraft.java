/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          WorkspaceDraft.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de los borradores de trabajo.
 */

package com.sgp.systemsgp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workspace_drafts", uniqueConstraints = @UniqueConstraint(columnNames = {"owner_id", "scope"}))
@Getter @Setter @NoArgsConstructor
public class WorkspaceDraft {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "owner_id", nullable = false) private Account owner;
    @Column(nullable = false, length = 200) private String scope;
    @Lob @Column(columnDefinition = "LONGTEXT") private String content;
    @Column(nullable = false) private long revision;
    @Column(nullable = false) private LocalDateTime savedAt;
}
