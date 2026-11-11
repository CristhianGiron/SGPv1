/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          StudentPracticeFormAnswerOption.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de los instrumentos de entrevista y observación.
 */

package com.sgp.systemsgp.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_practice_form_answer_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentPracticeFormAnswerOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id", nullable = false)
    private StudentPracticeFormAnswer answer;

    @Column(name = "selected_option", length = 300, nullable = false)
    private String selectedOption;
}
