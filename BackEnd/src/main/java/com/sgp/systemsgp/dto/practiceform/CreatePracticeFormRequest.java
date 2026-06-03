package com.sgp.systemsgp.dto.practiceform;

import com.sgp.systemsgp.enums.PracticeFormTargetRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreatePracticeFormRequest {

    @NotNull(message = "La inscripción es obligatoria")
    @Positive(message = "La inscripción seleccionada no es válida")
    private Long enrollmentId;

    @NotNull(message = "Debe seleccionar quién responderá el formulario")
    private PracticeFormTargetRole targetRole;

    @NotBlank(message = "El título del formulario es obligatorio")
    @Size(max = 160, message = "El título no puede superar 160 caracteres")
    private String title;

    @Size(max = 2000, message = "La descripción no puede superar 2000 caracteres")
    private String description;

    private Boolean draft;

    @Valid
    @NotNull(message = "Debe agregar al menos una pregunta")
    @Size(min = 1, max = 80, message = "El formulario debe tener entre 1 y 80 preguntas")
    private List<CreatePracticeFormQuestionRequest> questions;
}
