package com.sgp.systemsgp.model;

import com.sgp.systemsgp.enums.ActivityPlanStatus;
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
@Table(name = "activity_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditEntityListener.class)
public class ActivityPlan {

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

    private String studentFullName;

    private String studentIdentification;

    private String studentEmail;

    private String studentPhone;

    private String curricularOrganizationUnit;

    private String subjectDenomination;

    private String integrativeKnowledgeProject;

    private String practiceType;

    private String educationalInstitutionName;

    private String educationalInstitutionCode;

    private String educationalInstitutionAddress;

    private String educationalInstitutionPhone;

    private String educationalInstitutionEmail;

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

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String presentation;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String generalObjective;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String specificObjective1;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String specificObjective2;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String specificObjective3;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    @Builder.Default
    private List<ActivityPlanActivityWeek> activityWeeks = new ArrayList<>();

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    @Builder.Default
    private List<ActivityPlanScheduleWeek> scheduleWeeks = new ArrayList<>();

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String legalResources;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String humanResources;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String technologicalResources;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String physicalResources;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String generalInfoFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String presentationFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String objectivesFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String activitiesFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String scheduleFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String resourcesFeedback;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String approvalFeedback;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ActivityPlanStatus status = ActivityPlanStatus.DRAFT;

    @Builder.Default
    private Integer reviewCycle = 0;

    @Builder.Default
    private boolean practiceTutorApproved = false;

    @Builder.Default
    private boolean directorApproved = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private Account reviewedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "director_reviewed_by")
    private Account directorReviewedBy;

    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    private LocalDateTime directorReviewedAt;

    private LocalDateTime approvedAt;

    @Builder.Default
    private boolean deleted = false;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}
