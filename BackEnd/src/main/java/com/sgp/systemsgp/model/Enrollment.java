/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Enrollment.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de las inscripciones y prácticas asignadas.
 */

package com.sgp.systemsgp.model;

import jakarta.persistence.*;

import lombok.*;

import java.time.LocalDateTime;

import com.sgp.systemsgp.enums.EnrollmentStatus;

@Entity
@Table(name = "enrollments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {
                "account_id",
                "practice_id"
        })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enrollment {

    @Version
    private long rowVersion;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Usuario inscrito
     */
    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    /*
     * Curso
     */
    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne
    @JoinColumn(name = "practice_id")
    private PracticeOffering practice;

    /*
     * Grupo asignado dentro del curso para gestionar tutor institucional.
     */
    @ManyToOne
    @JoinColumn(name = "course_group_id")
    private CourseGroup group;

    /*
     * Fecha inscripción
     */
    private LocalDateTime enrolledAt;

    /*
     * Estado
     */
    @Enumerated(EnumType.STRING)
    private EnrollmentStatus status;

    /*
     * Archivo histórico de prácticas concluidas.
     */
    @Builder.Default
    private boolean archived = false;

    private LocalDateTime archivedAt;
}
