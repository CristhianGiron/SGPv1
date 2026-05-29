package com.sgp.systemsgp.dto.subject;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectResponse {

    private Long id;

    private String name;

    private String code;

    private String description;

    private Integer credits;

    private Integer hours;

    /*
     * UNIVERSIDAD
     */
    private Long academicCycleId;

    private String academicCycle;

    private Long careerId;

    private String career;

    private Long facultyId;

    private String faculty;

    /*
     * ESCUELA / COLEGIO
     */
    private Long gradeId;

    private String grade;

    private Long institutionId;

    private String institution;

    private boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
