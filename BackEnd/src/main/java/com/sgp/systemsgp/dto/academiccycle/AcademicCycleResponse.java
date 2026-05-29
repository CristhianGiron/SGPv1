package com.sgp.systemsgp.dto.academiccycle;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicCycleResponse {

    private Long id;

    private String name;

    private Integer level;

    /*
     * Carrera
     */
    private Long careerId;

    private String career;

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