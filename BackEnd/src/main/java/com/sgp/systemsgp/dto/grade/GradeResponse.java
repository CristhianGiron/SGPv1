package com.sgp.systemsgp.dto.grade;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeResponse {

    private Long id;

    private String name;

    private String code;

    private Integer level;

    private Long institutionId;

    private String institution;

    private boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
