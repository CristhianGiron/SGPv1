package com.sgp.systemsgp.dto.career;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCareerRequest {

    @NotBlank(message = "El nombre de la carrera es obligatorio")
    @Size(max = 120, message = "El nombre de la carrera no puede superar 120 caracteres")
    private String name;

    @NotBlank(message = "El código de la carrera es obligatorio")
    @Size(max = 30, message = "El código de la carrera no puede superar 30 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "El código de la carrera solo puede contener letras, números, guion y guion bajo")
    private String code;

    @Size(max = 500, message = "La descripción de la carrera no puede superar 500 caracteres")
    private String description;

    @Min(value = 1, message = "La cantidad de ciclos debe ser mayor o igual a 1")
    @Max(value = 30, message = "La cantidad de ciclos no puede superar 30")
    private Integer durationCycles;

    @NotNull(message = "La facultad es obligatoria")
    @Positive(message = "La facultad seleccionada no es válida")
    private Long facultyId;
}
