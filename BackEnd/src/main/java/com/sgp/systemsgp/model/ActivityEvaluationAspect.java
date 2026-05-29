package com.sgp.systemsgp.model;

import com.sgp.systemsgp.enums.ActivityEvaluationAspectType;
import com.sgp.systemsgp.enums.ActivityEvaluationLevel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "activity_evaluation_aspects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityEvaluationAspect {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private ActivityEvaluation evaluation;

    @Enumerated(EnumType.STRING)
    private ActivityEvaluationAspectType aspectType;

    @Column(length = 1000)
    private String item;

    @Enumerated(EnumType.STRING)
    private ActivityEvaluationLevel level;
}
