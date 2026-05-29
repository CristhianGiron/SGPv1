package com.sgp.systemsgp.dto.completedactivity;

import com.sgp.systemsgp.dto.feedback.FeedbackCommentResponse;
import com.sgp.systemsgp.dto.feedback.FeedbackHistoryResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompletedActivityRecordResponse {

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

    private String practiceType;

    private String studentFullName;

    private String studentIdentification;

    private String studentEmail;

    private String studentPhone;

    private String academicPeriod;

    private String developmentMode;

    private List<CompletedActivityRecordEntryResponse> entries;

    private Integer totalMinutes;

    private String totalTime;

    private LocalDate deliveryDate;

    private String generalInfoFeedback;

    private String activitiesFeedback;

    private String accreditationFeedback;

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
