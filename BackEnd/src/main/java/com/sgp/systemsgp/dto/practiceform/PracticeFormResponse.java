package com.sgp.systemsgp.dto.practiceform;

import com.sgp.systemsgp.enums.PracticeFormKind;
import com.sgp.systemsgp.enums.PracticeFormStatus;
import com.sgp.systemsgp.enums.PracticeFormTargetRole;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PracticeFormResponse {

    private Long id;

    private Long enrollmentId;

    private Long courseId;

    private String courseName;

    private String student;

    private String studentFullName;

    private Long educationalInstitutionId;

    private String educationalInstitutionName;

    private PracticeFormTargetRole targetRole;

    private PracticeFormKind formKind;

    private String target;

    private PracticeFormStatus status;

    private String title;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime answeredAt;

    private PracticeFormResponseSummary response;

    private List<PracticeFormQuestionResponse> questions;
}
