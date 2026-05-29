package com.sgp.systemsgp.dto.faculty;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyResponse {

    private Long id;

    private String name;

    private String code;

    private String description;

    private Long institutionId;

    private String institutionName;

    private boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
