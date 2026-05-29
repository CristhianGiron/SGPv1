package com.sgp.systemsgp.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewableDocumentSummaryResponse {

    private Long id;
    private String documentType;
    private String status;
    private Integer reviewCycle;

    private Long enrollmentId;
    private Long courseId;
    private String courseName;
    private String courseCode;
    private Boolean courseActive;

    private Long studentId;
    private String studentUsername;
    private String studentFullName;
    private String studentIdentification;
    private String academicCycleName;

    private Long educationalInstitutionId;
    private String educationalInstitutionName;
    private String academicPeriod;

    private String practiceTutorUsername;
    private String practiceTutorName;
    private String institutionalTutorUsername;
    private String institutionalTutorName;

    private Boolean practiceTutorApproved;
    private Boolean institutionalTutorApproved;
    private Boolean directorApproved;

    private String reviewedBy;
    private String reviewedByName;
    private String practiceReviewedBy;
    private String practiceReviewedByName;
    private String institutionalReviewedBy;
    private String institutionalReviewedByName;
    private String directorReviewedBy;
    private String directorReviewedByName;

    private Integer totalMinutes;
    private String totalTime;
    private LocalDate deliveryDate;

    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime practiceReviewedAt;
    private LocalDateTime institutionalReviewedAt;
    private LocalDateTime directorReviewedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
