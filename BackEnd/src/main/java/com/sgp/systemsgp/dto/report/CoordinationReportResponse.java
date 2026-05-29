package com.sgp.systemsgp.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoordinationReportResponse {

    private List<CoordinationMetricResponse> summary;

    private List<DocumentTypeStatusReportResponse> documentsByType;

    private List<CourseApprovalReportResponse> approvalsByCourse;

    private List<ReviewTimeReportResponse> reviewTimes;
}
