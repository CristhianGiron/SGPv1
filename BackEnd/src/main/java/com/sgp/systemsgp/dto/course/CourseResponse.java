package com.sgp.systemsgp.dto.course;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CourseResponse {

    private Long id;

    private String name;

    private String description;

    private String curricularOrganizationUnit;

    private String integrativeKnowledgeProject;

    private String practiceType;

    private String generalObjective;

    private String specificObjective1;

    private String specificObjective2;

    private String specificObjective3;

    private String code;

    private Integer capacity;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private boolean active;

    private boolean locked;

    /*
     * ADMIN
     */
    private String createdBy;

    /*
     * TUTORES
     */
    private String institutionalTutor;

    private String practiceTutor;

    private Long subjectId;

    private String subject;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
