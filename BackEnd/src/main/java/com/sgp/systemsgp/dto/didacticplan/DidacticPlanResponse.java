package com.sgp.systemsgp.dto.didacticplan;

import com.sgp.systemsgp.enums.DidacticPlanAuthorType;
import com.sgp.systemsgp.enums.DidacticPlanStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class DidacticPlanResponse {

    private Long id;
    private Long enrollmentId;
    private Long studentId;
    private String studentName;
    private Long authorId;
    private String authorName;
    private DidacticPlanAuthorType authorType;
    private Long sourcePlanId;
    private DidacticPlanStatus status;
    private String courseName;
    private String educationalInstitutionName;
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
    private String curricularInsertions;
    private String learningObjectives;
    private String evaluationCriteria;
    private String duaPrinciples;
    private List<DidacticPlanWeekResponse> weekPlans;
    private boolean hasUploadedPdf;
    private String uploadedPdfFilename;
    private Long uploadedPdfSize;
    private String recommendations;
    private String recommendedByName;
    private LocalDateTime recommendedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
