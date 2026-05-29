package com.sgp.systemsgp.dto.enrollment;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EnrollmentResponse {

    private Long id;

    private String student;

    private String studentFullName;

    private String studentIdentification;

    private String studentEmail;

    private String studentPhone;

    private Long courseId;

    private String courseName;

    private boolean courseActive;

    private Long groupId;

    private String groupName;

    private Long subjectId;

    private String subjectName;

    private Long educationalInstitutionId;

    private String educationalInstitutionName;

    private String educationalInstitutionCode;

    private String educationalInstitutionAddress;

    private String educationalInstitutionPhone;

    private String educationalInstitutionEmail;

    private String institutionalTutor;

    private String practiceTutor;

    private String studentAcademicCycle;

    private String courseAcademicCycle;

    private String status;

    private LocalDateTime enrolledAt;
}
