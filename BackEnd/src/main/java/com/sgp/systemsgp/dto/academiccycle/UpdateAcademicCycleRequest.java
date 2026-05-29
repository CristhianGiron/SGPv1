package com.sgp.systemsgp.dto.academiccycle;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateAcademicCycleRequest {

    @Size(max = 120, message = "El nombre del ciclo académico no puede superar 120 caracteres")
    private String name;

    @Min(value = 1, message = "El nivel debe ser mayor o igual a 1")
    @Max(value = 20, message = "El nivel no puede superar 20")
    private Integer level;

    private Boolean active;
}
