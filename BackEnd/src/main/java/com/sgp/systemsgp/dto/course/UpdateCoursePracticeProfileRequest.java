package com.sgp.systemsgp.dto.course;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCoursePracticeProfileRequest {

    @Size(max = 150, message = "La unidad curricular no puede superar 150 caracteres")
    private String curricularOrganizationUnit;

    @Size(max = 1200, message = "El proyecto integrador no puede superar 1200 caracteres")
    private String integrativeKnowledgeProject;

    @Pattern(regexp = "^(OBSERVACION|ELABORACION|DOCENTE)?$", message = "El tipo de práctica no es válido")
    private String practiceType;

    @Size(max = 1200, message = "El objetivo general no puede superar 1200 caracteres")
    private String generalObjective;

    @Size(max = 1200, message = "El objetivo específico 1 no puede superar 1200 caracteres")
    private String specificObjective1;

    @Size(max = 1200, message = "El objetivo específico 2 no puede superar 1200 caracteres")
    private String specificObjective2;

    @Size(max = 1200, message = "El objetivo específico 3 no puede superar 1200 caracteres")
    private String specificObjective3;
}
