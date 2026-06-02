package com.sgp.systemsgp.dto.gradeparallel;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GradeParallelResponse {

    private Long id;

    private String letter;

    private String name;

    private Long gradeId;

    private String grade;

    private Long institutionId;

    private String institution;

    private boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
