package com.sgp.systemsgp.dto.practicereport;

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
public class PracticeReportResponse {

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

    private String educationalInstitutionName;

    private String educationalInstitutionCode;

    private String educationalInstitutionAddress;

    private String educationalInstitutionPhone;

    private String educationalInstitutionEmail;

    private String presentation;

    private String generalObjective;

    private String specificObjective1;

    private String specificObjective2;

    private String specificObjective3;

    private String methodology;

    private List<PracticeReportActivityWeekResponse> activityWeeks;

    private String conclusion1;

    private String conclusion2;

    private String conclusion3;

    private String recommendation1;

    private String recommendation2;

    private String recommendation3;

    private String generalInfoFeedback;

    private String presentationFeedback;

    private String objectivesFeedback;

    private String methodologyFeedback;

    private String activitiesFeedback;

    private String conclusionsFeedback;

    private String recommendationsFeedback;

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
