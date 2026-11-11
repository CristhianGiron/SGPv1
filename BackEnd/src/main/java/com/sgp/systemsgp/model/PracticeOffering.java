/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeOffering.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de las prácticas ofrecidas a un paralelo.
 */

package com.sgp.systemsgp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** A practice offered to the roster of one academic parallel. */
@Entity
@Table(name = "practice_offerings")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PracticeOffering {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "course_id", nullable = false) private Course course;
    @Column(nullable = false, length = 160) private String name;
    @Column(nullable = false) private Integer capacity;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    @Builder.Default @Column(nullable = false) private boolean enrollmentOpen = true;
    @ManyToOne @JoinColumn(name = "created_by") private Account createdBy;
    @Column(nullable = false) private LocalDateTime createdAt;
}
