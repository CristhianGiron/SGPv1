/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Institution.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de las instituciones.
 */

package com.sgp.systemsgp.model;

import com.sgp.systemsgp.enums.*;
import com.sgp.systemsgp.model.listener.AuditEntityListener;

import jakarta.persistence.*;

import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "institutions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditEntityListener.class)
public class Institution {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "logo_image_id", unique = true)
    private EntityImage logoImage;

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
   /*
     * NIVELES EDUCATIVOS
     */
    /*
     * NIVELES EDUCATIVOS (entidad intermedia)
     */
    @Builder.Default
    @OneToMany(mappedBy = "institution", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<InstitutionEducationLevel> educationLevelEntries = new HashSet<>();

    public Set<EducationLevel> getEducationLevels() {
      if (this.educationLevelEntries == null) {
        return null;
      }
      return this.educationLevelEntries.stream().map(InstitutionEducationLevel::getEducationLevel)
          .collect(Collectors.toSet());
    }

    public void setEducationLevels(Set<EducationLevel> educationLevels) {
      if (this.educationLevelEntries == null) {
        this.educationLevelEntries = new HashSet<>();
      }
      if (educationLevels == null || educationLevels.isEmpty()) {
        this.educationLevelEntries.clear();
        return;
      }

      // remove entries not present
      this.educationLevelEntries.removeIf(entry -> !educationLevels.contains(entry.getEducationLevel()));

      // add new entries
      for (EducationLevel level : educationLevels) {
        boolean exists = this.educationLevelEntries.stream()
            .anyMatch(e -> e.getEducationLevel() == level);
        if (!exists) {
          InstitutionEducationLevel entry = InstitutionEducationLevel.builder()
              .educationLevel(level)
              .institution(this)
              .build();
          this.educationLevelEntries.add(entry);
        }
      }
    }

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
