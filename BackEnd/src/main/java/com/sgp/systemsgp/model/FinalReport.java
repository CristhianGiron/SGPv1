package com.sgp.systemsgp.model;

import com.sgp.systemsgp.enums.FinalReportStatus;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "final_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditEntityListener.class)
public class FinalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrollment_id", nullable = false, unique = true)
    private Enrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Account student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "educational_institution_id", nullable = false)
    private Institution educationalInstitution;

    private String educationalInstitutionName;

    private String educationalInstitutionCode;

    private String educationalInstitutionAddress;

    private String educationalInstitutionPhone;

    private String educationalInstitutionEmail;

    private String studentFullName;

    private String studentIdentification;

    private String studentEmail;

    private String studentPhone;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String antecedents;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String objective;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    @Builder.Default
    private List<FinalReportActivityWeek> activityWeeks = new ArrayList<>();

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String conclusion1;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String conclusion2;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String conclusion3;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String recommendation1;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String recommendation2;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String recommendation3;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String practiceGeneralInfoFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String practiceAntecedentsFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String practiceObjectiveFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String practiceActivitiesFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String practiceConclusionsFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String practiceRecommendationsFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String practiceApprovalFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String institutionalGeneralInfoFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String institutionalAntecedentsFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String institutionalObjectiveFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String institutionalActivitiesFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String institutionalConclusionsFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String institutionalRecommendationsFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String institutionalApprovalFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String directorGeneralInfoFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String directorAntecedentsFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String directorObjectiveFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String directorActivitiesFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String directorConclusionsFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String directorRecommendationsFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String directorApprovalFeedback;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private FinalReportStatus status = FinalReportStatus.DRAFT;

    @Builder.Default
    private Integer reviewCycle = 0;

    @Builder.Default
    private boolean practiceTutorApproved = false;

    @Builder.Default
    private boolean institutionalTutorApproved = false;

    @Builder.Default
    private boolean directorApproved = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "practice_reviewed_by")
    private Account practiceReviewedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institutional_reviewed_by")
    private Account institutionalReviewedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "director_reviewed_by")
    private Account directorReviewedBy;

    private LocalDateTime submittedAt;

    private LocalDateTime practiceReviewedAt;

    private LocalDateTime institutionalReviewedAt;

    private LocalDateTime directorReviewedAt;

    private LocalDateTime approvedAt;

    @Builder.Default
    private boolean deleted = false;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}
