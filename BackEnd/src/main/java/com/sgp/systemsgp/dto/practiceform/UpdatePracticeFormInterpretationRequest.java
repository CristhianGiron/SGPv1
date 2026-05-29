package com.sgp.systemsgp.dto.practiceform;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePracticeFormInterpretationRequest {

    @Size(max = 5000, message = "La interpretación no puede superar 5000 caracteres")
    private String interpretation;
}
