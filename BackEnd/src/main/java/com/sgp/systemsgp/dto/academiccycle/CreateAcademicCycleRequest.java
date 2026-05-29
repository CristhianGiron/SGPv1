package com.sgp.systemsgp.dto.academiccycle;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateAcademicCycleRequest {

    @NotBlank(message = "El nombre del ciclo académico es obligatorio")
    @Size(max = 120, message = "El nombre del ciclo académico no puede superar 120 caracteres")
    private String name;

    @NotNull(message = "El nivel del ciclo académico es obligatorio")
    @Min(value = 1, message = "El nivel debe ser mayor o igual a 1")
    @Max(value = 20, message = "El nivel no puede superar 20")
    private Integer level;

    @NotNull(message = "La carrera es obligatoria")
    @Positive(message = "La carrera seleccionada no es válida")
    private Long careerId;
}
