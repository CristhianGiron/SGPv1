/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Grade.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de los grados educativos.
 */

package com.sgp.systemsgp.model;

import java.time.LocalDateTime;
import java.util.List;

import com.sgp.systemsgp.model.listener.AuditEntityListener;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "grades")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditEntityListener.class)
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * DATOS
     */
    @Column(nullable = false)
    private String name;

    /*
     * Ej:
     * 1ro EGB
     * 2do EGB
     * 1ro Bachillerato
     */
    private Integer level;


    private String code;

    /*
     * RELACIONES
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id")
    private Institution institution;

    @OneToMany(mappedBy = "grade")
    private List<Subject> subjects;

    @OneToMany(mappedBy = "grade")
    private List<GradeParallel> parallels;

    /*
     * CONTROL
     */
    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private boolean deleted = false;
    

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}
