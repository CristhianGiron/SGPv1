package com.sgp.systemsgp.dto.practiceform;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class PracticeFormAnswerRequest {

    @NotNull(message = "La pregunta respondida es obligatoria")
    @Positive(message = "La pregunta seleccionada no es válida")
    private Long questionId;

    @Size(max = 5000, message = "La respuesta abierta no puede superar 5000 caracteres")
    private String textAnswer;

    @DecimalMin(value = "-1000000.0", message = "El valor numérico es demasiado bajo")
    @DecimalMax(value = "1000000.0", message = "El valor numérico es demasiado alto")
    private BigDecimal numberAnswer;

    private Boolean booleanAnswer;

    @Size(max = 20, message = "No se pueden seleccionar más de 20 opciones")
    private List<@Size(max = 300, message = "Una opción seleccionada no puede superar 300 caracteres") String> selectedOptions;
}
