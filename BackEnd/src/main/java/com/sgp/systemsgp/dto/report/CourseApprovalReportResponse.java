package com.sgp.systemsgp.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseApprovalReportResponse {

    private String courseName;

    private long pending;

    private long needsCorrection;

    private long approved;

    private Double averageReviewHours;
}
