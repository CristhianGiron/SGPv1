/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          StudentPracticeFormAnswer.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de los instrumentos de entrevista y observación.
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "student_practice_form_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentPracticeFormAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "response_id", nullable = false)
    private StudentPracticeFormResponse response;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private StudentPracticeFormQuestion question;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String textAnswer;

    @Column(precision = 19, scale = 4)
    private BigDecimal numberAnswer;

    private Boolean booleanAnswer;

    /*
     * OPCIONES SELECCIONADAS (entidad intermedia)
     */
    @Builder.Default
    @OneToMany(mappedBy = "answer", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<StudentPracticeFormAnswerOption> selectedOptionEntries = new HashSet<>();

    public List<String> getSelectedOptions() {
      if (this.selectedOptionEntries == null) {
        return new ArrayList<>();
      }
      List<String> list = new ArrayList<>();
      for (StudentPracticeFormAnswerOption e : this.selectedOptionEntries) {
        list.add(e.getSelectedOption());
      }
      return list;
    }

    public void setSelectedOptions(List<String> selectedOptions) {
      if (this.selectedOptionEntries == null) {
        this.selectedOptionEntries = new HashSet<>();
      }
      if (selectedOptions == null || selectedOptions.isEmpty()) {
        this.selectedOptionEntries.clear();
        return;
      }

      // remove entries not present
      this.selectedOptionEntries.removeIf(entry -> !selectedOptions.contains(entry.getSelectedOption()));

      // add new entries
      for (String opt : selectedOptions) {
        boolean exists = this.selectedOptionEntries.stream()
            .anyMatch(e -> e.getSelectedOption().equals(opt));
        if (!exists) {
          StudentPracticeFormAnswerOption entry = StudentPracticeFormAnswerOption.builder()
              .selectedOption(opt)
              .answer(this)
              .build();
          this.selectedOptionEntries.add(entry);
        }
      }
    }

    public void setSelectedOptions(Set<String> selectedOptions) {
      if (this.selectedOptionEntries == null) {
        this.selectedOptionEntries = new HashSet<>();
      }
      if (selectedOptions == null || selectedOptions.isEmpty()) {
        this.selectedOptionEntries.clear();
        return;
      }

      // remove entries not present
      this.selectedOptionEntries.removeIf(entry -> !selectedOptions.contains(entry.getSelectedOption()));

      // add new entries
      for (String opt : selectedOptions) {
        boolean exists = this.selectedOptionEntries.stream()
            .anyMatch(e -> e.getSelectedOption().equals(opt));
        if (!exists) {
          StudentPracticeFormAnswerOption entry = StudentPracticeFormAnswerOption.builder()
              .selectedOption(opt)
              .answer(this)
              .build();
          this.selectedOptionEntries.add(entry);
        }
      }
    }

}
