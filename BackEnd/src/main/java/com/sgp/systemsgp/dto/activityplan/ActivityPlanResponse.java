package com.sgp.systemsgp.dto.activityplan;

import com.sgp.systemsgp.dto.feedback.FeedbackCommentResponse;
import com.sgp.systemsgp.dto.feedback.FeedbackHistoryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityPlanResponse {

    private Long id;

    private Long enrollmentId;

    private Long courseId;

    private String courseName;

    private Long studentId;

    private String studentUsername;

    private Long educationalInstitutionId;

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

    private String mission;

    private String vision;

    private String institutionalValues;

    private String presentation;

    private String generalObjective;

    private String specificObjective1;

    private String specificObjective2;

    private String specificObjective3;

    private List<ActivityPlanActivityWeekResponse> activityWeeks;

    private List<ActivityPlanScheduleWeekResponse> scheduleWeeks;

    private String legalResources;

    private String humanResources;

    private String technologicalResources;

    private String physicalResources;

    private String generalInfoFeedback;

    private String presentationFeedback;

    private String objectivesFeedback;

    private String activitiesFeedback;

    private String scheduleFeedback;

    private String resourcesFeedback;

    private String approvalFeedback;

    private List<FeedbackCommentResponse> feedbackComments;

    private List<FeedbackHistoryResponse> feedbackHistory;

    private String status;

    private Integer reviewCycle;

    private boolean practiceTutorApproved;

    private boolean directorApproved;

    private String reviewedBy;

    private String directorReviewedBy;

    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    private LocalDateTime directorReviewedAt;

    private LocalDateTime approvedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
