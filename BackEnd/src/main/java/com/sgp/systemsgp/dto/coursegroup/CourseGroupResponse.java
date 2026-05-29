package com.sgp.systemsgp.dto.coursegroup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CourseGroupResponse {

    private Long id;

    private Long courseId;

    private String courseName;

    private String name;

    private String description;

    private Integer capacity;

    private Long institutionalTutorId;

    private String institutionalTutor;

    private Long educationalInstitutionId;

    private String educationalInstitutionName;

    private boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
