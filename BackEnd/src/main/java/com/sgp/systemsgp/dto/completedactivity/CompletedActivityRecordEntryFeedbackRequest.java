package com.sgp.systemsgp.dto.completedactivity;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompletedActivityRecordEntryFeedbackRequest {

    @NotNull
    @Positive(message = "La actividad seleccionada no es válida")
    private Long entryId;

    @Size(max = 1500, message = "El feedback de la actividad no puede superar 1500 caracteres")
    private String feedback;

    @Size(max = 1500, message = "Las sugerencias de la actividad no pueden superar 1500 caracteres")
    private String suggestions;
}
