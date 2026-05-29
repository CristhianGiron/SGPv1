package com.sgp.systemsgp.dto.activityplan;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateActivityPlanRequest {

    @Positive(message = "La institución educativa seleccionada no es válida")
    private Long educationalInstitutionId;

    @Size(max = 160, message = "El nombre del estudiante no puede superar 160 caracteres")
    private String studentFullName;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "La identificación del estudiante debe tener 10 dígitos")
    private String studentIdentification;

    @Email(message = "El correo del estudiante no tiene un formato válido")
    @Size(max = 120, message = "El correo del estudiante no puede superar 120 caracteres")
    private String studentEmail;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "El teléfono del estudiante debe tener 10 dígitos")
    private String studentPhone;

    @Size(max = 150, message = "La unidad curricular no puede superar 150 caracteres")
    private String curricularOrganizationUnit;

    @Size(max = 150, message = "La denominación de la asignatura no puede superar 150 caracteres")
    private String subjectDenomination;

    @Size(max = 1200, message = "El proyecto integrador no puede superar 1200 caracteres")
    private String integrativeKnowledgeProject;

    @Size(max = 80, message = "El tipo de práctica no puede superar 80 caracteres")
    private String practiceType;

    @Size(max = 180, message = "El nombre de la institución no puede superar 180 caracteres")
    private String educationalInstitutionName;

    @Size(max = 30, message = "El código de la institución no puede superar 30 caracteres")
    private String educationalInstitutionCode;

    @Size(max = 255, message = "La dirección de la institución no puede superar 255 caracteres")
    private String educationalInstitutionAddress;

    @Pattern(regexp = "^$|^[0-9+()\\s-]{7,20}$", message = "El teléfono institucional no tiene un formato válido")
    private String educationalInstitutionPhone;

    @Email(message = "El correo institucional no tiene un formato válido")
    @Size(max = 120, message = "El correo institucional no puede superar 120 caracteres")
    private String educationalInstitutionEmail;

    @PositiveOrZero(message = "La cantidad de docentes no puede ser negativa")
    @Max(value = 100000, message = "La cantidad de docentes es demasiado alta")
    private Integer teacherCount;

    @PositiveOrZero(message = "La cantidad de estudiantes no puede ser negativa")
    @Max(value = 1000000, message = "La cantidad de estudiantes es demasiado alta")
    private Integer studentCount;

    @Size(max = 2000, message = "La misión no puede superar 2000 caracteres")
    private String mission;

    @Size(max = 2000, message = "La visión no puede superar 2000 caracteres")
    private String vision;

    @Size(max = 2000, message = "Los valores institucionales no pueden superar 2000 caracteres")
    private String institutionalValues;

    @Size(max = 2500, message = "La presentación no puede superar 2500 caracteres")
    private String presentation;

    @Size(max = 1200, message = "El objetivo general no puede superar 1200 caracteres")
    private String generalObjective;

    @Size(max = 1200, message = "El objetivo específico 1 no puede superar 1200 caracteres")
    private String specificObjective1;

    @Size(max = 1200, message = "El objetivo específico 2 no puede superar 1200 caracteres")
    private String specificObjective2;

    @Size(max = 1200, message = "El objetivo específico 3 no puede superar 1200 caracteres")
    private String specificObjective3;

    @Valid
    @Size(max = 60, message = "No se pueden registrar más de 60 semanas de actividades")
    private List<ActivityPlanActivityWeekRequest> activityWeeks;

    @Valid
    @Size(max = 60, message = "No se pueden registrar más de 60 semanas de cronograma")
    private List<ActivityPlanScheduleWeekRequest> scheduleWeeks;

    @Size(max = 2000, message = "Los recursos legales no pueden superar 2000 caracteres")
    private String legalResources;

    @Size(max = 2000, message = "Los recursos humanos no pueden superar 2000 caracteres")
    private String humanResources;

    @Size(max = 2000, message = "Los recursos tecnológicos no pueden superar 2000 caracteres")
    private String technologicalResources;

    @Size(max = 2000, message = "Los recursos físicos no pueden superar 2000 caracteres")
    private String physicalResources;
}
