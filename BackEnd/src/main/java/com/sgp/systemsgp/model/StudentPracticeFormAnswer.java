package com.sgp.systemsgp.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

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

    @ElementCollection
    @CollectionTable(
            name = "student_practice_form_answer_options",
            joinColumns = @JoinColumn(name = "answer_id"))
    @Column(name = "selected_option", length = 300)
    @Builder.Default
    private List<String> selectedOptions = new ArrayList<>();
}
