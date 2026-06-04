package com.sgp.systemsgp.model;

import com.sgp.systemsgp.enums.DidacticPlanAuthorType;
import com.sgp.systemsgp.enums.DidacticPlanStatus;
import com.sgp.systemsgp.model.listener.AuditEntityListener;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "didactic_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditEntityListener.class)
public class DidacticPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Account student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "educational_institution_id")
    private Institution educationalInstitution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Account author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DidacticPlanAuthorType authorType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_plan_id")
    private DidacticPlan sourcePlan;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DidacticPlanStatus status = DidacticPlanStatus.DRAFT;

    private String title;

    private String teacherName;

    private String areaSubject;

    private Integer periods;

    private Integer weeks;

    private LocalDate startWeek;

    private LocalDate endWeek;

    private String gradeCourse;

    private String parallel;

    private String planningUnitTitle;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String curricularInsertions;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String learningObjectives;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String evaluationCriteria;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String duaPrinciples;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    @Builder.Default
    private List<DidacticPlanWeek> weekPlans = new ArrayList<>();

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] uploadedPdf;

    private String uploadedPdfFilename;

    private String uploadedPdfContentType;

    private Long uploadedPdfSize;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String recommendations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommended_by")
    private Account recommendedBy;

    private LocalDateTime recommendedAt;

    private LocalDateTime submittedAt;

    @Builder.Default
    private boolean deleted = false;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}
