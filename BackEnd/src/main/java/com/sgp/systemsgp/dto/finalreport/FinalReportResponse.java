package com.sgp.systemsgp.dto.finalreport;

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
public class FinalReportResponse {

    private Long id;

    private Long enrollmentId;

    private Long courseId;

    private String courseName;

    private Long studentId;

    private String studentUsername;

    private Long educationalInstitutionId;

    private String educationalInstitutionName;

    private String educationalInstitutionCode;

    private String educationalInstitutionAddress;

    private String educationalInstitutionPhone;

    private String educationalInstitutionEmail;

    private String studentFullName;

    private String studentIdentification;

    private String studentEmail;

    private String studentPhone;

    private String antecedents;

    private String objective;

    private List<FinalReportActivityWeekResponse> activityWeeks;

    private String conclusion1;

    private String conclusion2;

    private String conclusion3;

    private String recommendation1;

    private String recommendation2;

    private String recommendation3;

    private String practiceGeneralInfoFeedback;

    private String practiceAntecedentsFeedback;

    private String practiceObjectiveFeedback;

    private String practiceActivitiesFeedback;

    private String practiceConclusionsFeedback;

    private String practiceRecommendationsFeedback;

    private String practiceApprovalFeedback;

    private String institutionalGeneralInfoFeedback;

    private String institutionalAntecedentsFeedback;

    private String institutionalObjectiveFeedback;

    private String institutionalActivitiesFeedback;

    private String institutionalConclusionsFeedback;

    private String institutionalRecommendationsFeedback;

    private String institutionalApprovalFeedback;

    private String directorGeneralInfoFeedback;

    private String directorAntecedentsFeedback;

    private String directorObjectiveFeedback;

    private String directorActivitiesFeedback;

    private String directorConclusionsFeedback;

    private String directorRecommendationsFeedback;

    private String directorApprovalFeedback;

    private List<FeedbackCommentResponse> feedbackComments;

    private List<FeedbackHistoryResponse> feedbackHistory;

    private String status;

    private Integer reviewCycle;

    private boolean practiceTutorApproved;

    private boolean institutionalTutorApproved;

    private boolean directorApproved;

    private String practiceReviewedBy;

    private String institutionalReviewedBy;

    private String directorReviewedBy;

    private LocalDateTime submittedAt;

    private LocalDateTime practiceReviewedAt;

    private LocalDateTime institutionalReviewedAt;

    private LocalDateTime directorReviewedAt;

    private LocalDateTime approvedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
