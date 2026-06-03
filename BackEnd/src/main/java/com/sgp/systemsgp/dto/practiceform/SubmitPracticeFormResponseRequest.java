package com.sgp.systemsgp.dto.practiceform;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SubmitPracticeFormResponseRequest {

    private Boolean draft;

    @Valid
    @Size(max = 120, message = "No puede enviar más de 120 respuestas")
    private List<PracticeFormAnswerRequest> answers;
}
