package com.sgp.systemsgp.dto.practiceform;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePracticeFormOptionRequest {

    @NotBlank(message = "La opción no puede estar vacía")
    @Size(max = 300, message = "La opción no puede superar 300 caracteres")
    private String label;
}
