package com.sgp.systemsgp.dto.practiceform;

import com.sgp.systemsgp.enums.PracticeFormQuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreatePracticeFormQuestionRequest {

    @NotNull(message = "El tipo de pregunta es obligatorio")
    private PracticeFormQuestionType type;

    @NotBlank(message = "La pregunta es obligatoria")
    @Size(max = 1000, message = "La pregunta no puede superar 1000 caracteres")
    private String prompt;

    private Boolean required;

    @Min(value = 0, message = "La escala mínima no puede ser negativa")
    @Max(value = 100, message = "La escala mínima no puede superar 100")
    private Integer scaleMin;

    @Min(value = 1, message = "La escala máxima debe ser mayor o igual a 1")
    @Max(value = 100, message = "La escala máxima no puede superar 100")
    private Integer scaleMax;

    @Valid
    @Size(max = 20, message = "Una pregunta no puede tener más de 20 opciones")
    private List<CreatePracticeFormOptionRequest> options;
}
