package com.sgp.systemsgp.model;

import jakarta.persistence.*;

import lombok.*;

import java.time.LocalDateTime;

import com.sgp.systemsgp.enums.EnrollmentStatus;

@Entity
@Table(name = "enrollments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {
                "account_id",
                "course_id"
        })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enrollment {

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
