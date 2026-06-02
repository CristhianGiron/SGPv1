package com.sgp.systemsgp.dto.gradeparallel;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import lombok.Data;

@Data
public class UpdateGradeParallelRequest {

    @Pattern(regexp = "^[A-Z]$", message = "El paralelo debe ser una letra de la A a la Z")
    private String letter;

    @Positive(message = "El grado seleccionado no es válido")
    private Long gradeId;

    private Boolean active;
}
