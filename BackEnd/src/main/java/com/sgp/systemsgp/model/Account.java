package com.sgp.systemsgp.model;

import com.sgp.systemsgp.model.listener.AuditEntityListener;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners({
        AuditingEntityListener.class,
        AuditEntityListener.class
})
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Builder.Default
    private boolean enabled = true;

    @Builder.Default
    private boolean locked = false;

    @Builder.Default
    private boolean deleted = false;

    @Builder.Default
    private boolean passwordChangeRequired = false;

    private LocalDateTime deletedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
    /*
     * Relación con persona
     */
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "person_id")
    private Person person;

    /*
     * Relación con roles
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "account_roles", joinColumns = @JoinColumn(name = "account_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    /*
     * Imagen BLOB
     */

    @Lob
    @Column(name = "profile_image", columnDefinition = "LONGBLOB")
    private byte[] profileImage;

    private String profileImageType;
    
    @ManyToOne(fetch = FetchType.LAZY)

    @JoinColumn(name = "institution_id")

    private Institution institution;

    /*
     * Ciclo academico al que pertenece el estudiante.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_cycle_id")
    private AcademicCycle academicCycle;

    /*
     * Carrera que delimita la gestión del director de prácticas.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "career_id")
    private Career career;

    /*
     * Grado que delimita la gestión de la directora institucional.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_id")
    private Grade grade;

    /*
     * Paralelo que delimita la gestión del tutor institucional.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_parallel_id")
    private GradeParallel gradeParallel;

    
}
