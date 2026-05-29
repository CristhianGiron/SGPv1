package com.sgp.systemsgp.dto.career;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerResponse {

    private Long id;

    private String name;

    private String code;

    private String description;

    private Integer durationCycles;

    /*
     * Facultad
     */
    private Long facultyId;

    private String faculty;

    /*
     * Institución
     */
    private Long institutionId;

    private String institution;

    /*
     * Estado
     */
    private boolean active;

    /*
     * Auditoría
     */
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
