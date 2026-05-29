package com.sgp.systemsgp.model;

import com.sgp.systemsgp.enums.PracticeFormQuestionType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "student_practice_form_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentPracticeFormQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    private StudentPracticeForm form;

    @Column(nullable = false)
    private Integer questionOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PracticeFormQuestionType type;

    @Column(nullable = false, length = 1000)
    private String prompt;

    @Builder.Default
    private boolean required = true;

    private Integer scaleMin;

    private Integer scaleMax;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    @Builder.Default
    private List<StudentPracticeFormOption> options = new ArrayList<>();

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String studentInterpretation;
}
