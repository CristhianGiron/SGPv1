package com.sgp.systemsgp.model;

import java.time.LocalDateTime;
import java.util.List;

import com.sgp.systemsgp.model.listener.AuditEntityListener;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "academic_cycles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditEntityListener.class)
public class AcademicCycle {

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
     * 1 = Primer ciclo
     * 2 = Segundo ciclo
     */
    private Integer orderNumber;

    /*
     * RELACIONES
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "career_id")
    private Career career;

    @OneToMany(mappedBy = "academicCycle")
    private List<Subject> subjects;

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
