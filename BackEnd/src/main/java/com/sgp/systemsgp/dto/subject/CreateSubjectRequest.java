package com.sgp.systemsgp.dto.subject;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateSubjectRequest {

    @NotBlank(message = "El nombre de la asignatura es obligatorio")
    @Size(max = 120, message = "El nombre de la asignatura no puede superar 120 caracteres")
    private String name;

    @NotBlank(message = "El código de la asignatura es obligatorio")
    @Size(max = 30, message = "El código de la asignatura no puede superar 30 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "El código de la asignatura solo puede contener letras, números, guion y guion bajo")
    private String code;

    @Size(max = 800, message = "La descripción de la asignatura no puede superar 800 caracteres")
    private String description;

    @PositiveOrZero(message = "Los créditos no pueden ser negativos")
    @Max(value = 30, message = "Los créditos no pueden superar 30")
    private Integer credits;

    @PositiveOrZero(message = "Las horas no pueden ser negativas")
    @Max(value = 1000, message = "Las horas no pueden superar 1000")
    private Integer hours;

    /*
     * UNIVERSIDAD
     */
    @Positive(message = "El ciclo académico seleccionado no es válido")
    private Long academicCycleId;

    /*
     * ESCUELA / COLEGIO
     */
    @Positive(message = "El grado seleccionado no es válido")
    private Long gradeId;

    private Boolean active;

    @AssertTrue(message = "Debe seleccionar un ciclo académico o un grado, pero no ambos")
    public boolean isAcademicReferenceValid() {
        return (academicCycleId == null) != (gradeId == null);
    }
}
