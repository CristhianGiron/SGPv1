/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CompletedActivityRecordEntry.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de el registro de actividades cumplidas (L.6).
 */

package com.sgp.systemsgp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "completed_activity_record_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompletedActivityRecordEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "record_id", nullable = false)
    private CompletedActivityRecord record;

    private LocalDate activityDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private Integer totalMinutes;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String developedActivities;

    @Column(length = 2000)
    private String evidenceLink;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String feedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String suggestions;
}
