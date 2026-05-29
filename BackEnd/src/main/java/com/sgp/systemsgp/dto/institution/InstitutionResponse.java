package com.sgp.systemsgp.dto.institution;

import java.time.LocalDateTime;
import java.util.Set;

import com.sgp.systemsgp.enums.EducationLevel;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstitutionResponse {

    private Long id;

    private String code;

    private String name;

    private String type;

    private String support;

    private String address;

    private String phone;

    private String email;

    private String website;

    private boolean agreementActive;

    private boolean acceptsInterns;

    private boolean active;

    private String province;

    private String canton;

    private String parish;

    private String regime;

    private String modality;

    private Integer teacherCount;

    private Integer studentCount;

    private String mission;

    private String vision;

    private String institutionalValues;

    private Set<EducationLevel> educationLevels;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}
