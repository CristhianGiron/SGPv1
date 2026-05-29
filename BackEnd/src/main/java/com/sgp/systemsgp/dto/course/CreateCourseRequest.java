package com.sgp.systemsgp.dto.course;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateCourseRequest {

    @NotBlank
    @Size(max = 120, message = "El nombre del curso no puede superar 120 caracteres")
    private String name;

    @NotBlank
    @Size(max = 1200, message = "La descripción del curso no puede superar 1200 caracteres")
    private String description;

    @NotNull
    @Min(1)
    private Integer capacity;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    @NotNull(message = "La asignatura es obligatoria")
    @Positive(message = "La asignatura seleccionada no es válida")
    private Long subjectId;

    @AssertTrue(message = "La fecha de fin no puede ser anterior a la fecha de inicio")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}
