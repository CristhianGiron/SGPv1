/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CreateCourseRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para los paralelos académicos.
 */

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

    @Positive(message = "La asignatura seleccionada no es válida")
    private Long subjectId;

    @NotNull(message = "El ciclo académico es obligatorio")
    @Positive(message = "El ciclo académico seleccionado no es válido")
    private Long academicCycleId;

    @AssertTrue(message = "La fecha de fin no puede ser anterior a la fecha de inicio")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}
