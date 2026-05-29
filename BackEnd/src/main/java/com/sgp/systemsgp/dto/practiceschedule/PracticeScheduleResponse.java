package com.sgp.systemsgp.dto.practiceschedule;

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
public class PracticeScheduleResponse {

    private Long id;

    private Long enrollmentId;

    private Long courseId;

    private String courseName;

    private Long studentId;

    private String studentUsername;

    private String studentFullName;

    private String studentIdentification;

    private Long educationalInstitutionId;

    private String educationalInstitutionName;

    private String educationalInstitutionCode;

    private LocalDate startDate;

    private LocalDate endDate;

    private String observations;

    private List<PracticeSchedulePeriodResponse> periods;

    private List<PracticeAttendanceResponse> attendances;

    private String scheduledBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
