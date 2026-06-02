package com.sgp.systemsgp.model;

import com.sgp.systemsgp.model.listener.AuditEntityListener;

import jakarta.persistence.*;

import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditEntityListener.class)
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * NOMBRE CURSO
     */
    @Column(nullable = false)
    private String name;

    /*
     * DESCRIPCIÓN
     */
    @Column(length = 3000)
    private String description;

    /*
     * Datos comunes de la practica definidos por el tutor de practicas.
     */
    private String curricularOrganizationUnit;

    private String integrativeKnowledgeProject;

    private String practiceType;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String generalObjective;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String specificObjective1;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String specificObjective2;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String specificObjective3;

    /*
     * CÓDIGO ÚNICO
     */
    @Column(unique = true)
    private String code;

    /*
     * CUPOS
     */
    private Integer capacity;

    /*
     * FECHAS
     */
    private LocalDateTime startDate;

    private LocalDateTime endDate;

    /*
     * ESTADO
     */
    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private boolean locked = false;

    @Builder.Default
    private boolean deleted = false;

    /*
     * FECHAS CONTROL
     */
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    /*
     * ADMIN CREADOR
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Account createdBy;

    /*
     * TUTOR INSTITUCIONAL
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institutional_tutor_id")
    private Account institutionalTutor;

    /*
     * TUTOR DE PRÁCTICAS
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "practice_tutor_id")
    private Account practiceTutor;

    /*
     * Ciclo academico al que pertenece este paralelo.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_cycle_id")
    private AcademicCycle academicCycle;

    /*
     * Asignatura heredada. Se mantiene para compatibilidad con datos previos;
     * la jerarquia nueva cuelga asignaturas desde este paralelo.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;
}
