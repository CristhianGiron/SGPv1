/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseStudentMembership.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de la pertenencia académica de estudiantes.
 */

package com.sgp.systemsgp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** Academic roster membership, independent from a practice enrollment decision. */
@Entity
@Table(name="course_student_memberships",uniqueConstraints={@UniqueConstraint(columnNames={"course_id","student_id"}),@UniqueConstraint(name="uk_student_active_cycle",columnNames={"student_id","active_cycle_id"})})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CourseStudentMembership {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="course_id",nullable=false) private Course course;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="student_id",nullable=false) private Account student;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="active_cycle_id") private AcademicCycle activeCycle;
    @Builder.Default @Column(nullable=false) private boolean active=true;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="assigned_by") private Account assignedBy;
    @Column(nullable=false) private LocalDateTime assignedAt;
    private LocalDateTime updatedAt;
}
