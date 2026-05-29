package com.sgp.systemsgp.dto.grade;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateGradeRequest {

    @Size(max = 80, message = "El nombre del grado no puede superar 80 caracteres")
    private String name;

    @Size(max = 30, message = "El código del grado no puede superar 30 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "El código del grado solo puede contener letras, números, guion y guion bajo")
    private String code;

    @Min(value = 1, message = "El nivel debe ser mayor o igual a 1")
    @Max(value = 20, message = "El nivel no puede superar 20")
    private Integer level;

    @Positive(message = "La institución seleccionada no es válida")
    private Long institutionId;

    private Boolean active;
}
