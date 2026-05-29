package com.sgp.systemsgp.dto.practicefollowup;

import com.sgp.systemsgp.enums.ActivityDevelopmentMode;
import com.sgp.systemsgp.enums.ActivityEvaluationPracticeType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class CreatePracticeFollowUpReportRequest {

    @NotNull(message = "La inscripción es obligatoria")
    @Positive(message = "La inscripción seleccionada no es válida")
    private Long enrollmentId;

    @Positive(message = "La institución educativa seleccionada no es válida")
    private Long educationalInstitutionId;

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

    private ActivityEvaluationPracticeType practiceType;

    @Size(max = 160, message = "El nombre del estudiante no puede superar 160 caracteres")
    private String studentFullName;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "La identificación del estudiante debe tener 10 dígitos")
    private String studentIdentification;

    @Email(message = "El correo del estudiante no tiene un formato válido")
    @Size(max = 120, message = "El correo del estudiante no puede superar 120 caracteres")
    private String studentEmail;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "El teléfono del estudiante debe tener 10 dígitos")
    private String studentPhone;

    @Size(max = 80, message = "El período académico no puede superar 80 caracteres")
    private String academicPeriod;

    private ActivityDevelopmentMode developmentMode;

    @Valid
    @Size(max = 120, message = "No se pueden registrar más de 120 sesiones")
    private List<PracticeFollowUpSessionRequest> sessions;

    @PositiveOrZero(message = "El total de minutos no puede ser negativo")
    @Max(value = 200000, message = "El total de minutos es demasiado alto")
    private Integer totalMinutes;

    private LocalDate deliveryDate;
}
