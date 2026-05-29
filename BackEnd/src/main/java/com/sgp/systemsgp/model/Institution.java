package com.sgp.systemsgp.model;

import com.sgp.systemsgp.enums.*;
import com.sgp.systemsgp.model.listener.AuditEntityListener;

import jakarta.persistence.*;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "institutions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditEntityListener.class)
public class Institution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * CÓDIGO INSTITUCIONAL
     * UNL
     * UEABC
     * UEJBG
     */
    @Column(nullable = false, unique = true)
    private String code;

    /*
     * NOMBRE OFICIAL
     */
    @Column(nullable = false)
    private String name;

    /*
     * TIPO INSTITUCIÓN
     */
    @Enumerated(EnumType.STRING)
    private InstitutionType type;

    /*
     * SOSTENIMIENTO
     */
    @Enumerated(EnumType.STRING)
    private InstitutionSupport support;

    /*
     * DIRECCIÓN
     */
    private String address;

    /*
     * TELÉFONO
     */
    private String phone;

    /*
     * EMAIL
     */
    private String email;

    /*
     * SITIO WEB
     */
    private String website;

    /*
     * UBICACIÓN
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "province_id")
    private Province province;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canton_id")
    private Canton canton;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parish_id")
    private Parish parish;

    /*
     * CONVENIO ACTIVO
     */
    @Builder.Default
    private boolean agreementActive = false;

    /*
     * RECIBE PRACTICANTES
     */
    @Builder.Default
    private boolean acceptsInterns = false;

    /*
     * RÉGIMEN
     */
    @Enumerated(EnumType.STRING)
    private SchoolRegime regime;

    /*
     * MODALIDAD
     */
    @Enumerated(EnumType.STRING)
    private EducationModality modality;

    /*
     * DATOS PROPIOS DE ESCUELAS Y COLEGIOS
     */
    private Integer teacherCount;

    private Integer studentCount;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String mission;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String vision;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String institutionalValues;

    /*
     * NIVELES EDUCATIVOS
     */
    @ElementCollection(targetClass = EducationLevel.class)

    @CollectionTable(name = "institution_education_levels", joinColumns = @JoinColumn(name = "institution_id"))

    @Column(name = "education_level")

    @Enumerated(EnumType.STRING)
    private Set<EducationLevel> educationLevels;

    /*
     * FACULTADES
     */
    @OneToMany(mappedBy = "institution", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Faculty> faculties;

    /*
     * GRADOS
     */
    @OneToMany(mappedBy = "institution", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Grade> grades;
    /*
     * CONTROL
     */
    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private boolean deleted = false;

    /*
     * AUDITORÍA
     */
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}
