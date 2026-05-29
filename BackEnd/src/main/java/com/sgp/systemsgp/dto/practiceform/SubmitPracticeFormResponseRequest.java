package com.sgp.systemsgp.dto.practiceform;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SubmitPracticeFormResponseRequest {

    @Valid
    @NotNull(message = "Las respuestas son obligatorias")
    @Size(min = 1, max = 120, message = "Debe enviar entre 1 y 120 respuestas")
    private List<PracticeFormAnswerRequest> answers;
}
