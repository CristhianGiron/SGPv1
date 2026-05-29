package com.sgp.systemsgp.dto.practicereport;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreatePracticeReportRequest {

    @NotNull(message = "La inscripción es obligatoria")
    @Positive(message = "La inscripción seleccionada no es válida")
    private Long enrollmentId;

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

    @Size(max = 2500, message = "La metodología no puede superar 2500 caracteres")
    private String methodology;

    @Valid
    @Size(max = 60, message = "No se pueden registrar más de 60 semanas de actividades")
    private List<PracticeReportActivityWeekRequest> activityWeeks;

    @Size(max = 1200, message = "La conclusión 1 no puede superar 1200 caracteres")
    private String conclusion1;

    @Size(max = 1200, message = "La conclusión 2 no puede superar 1200 caracteres")
    private String conclusion2;

    @Size(max = 1200, message = "La conclusión 3 no puede superar 1200 caracteres")
    private String conclusion3;

    @Size(max = 1200, message = "La recomendación 1 no puede superar 1200 caracteres")
    private String recommendation1;

    @Size(max = 1200, message = "La recomendación 2 no puede superar 1200 caracteres")
    private String recommendation2;

    @Size(max = 1200, message = "La recomendación 3 no puede superar 1200 caracteres")
    private String recommendation3;
}
