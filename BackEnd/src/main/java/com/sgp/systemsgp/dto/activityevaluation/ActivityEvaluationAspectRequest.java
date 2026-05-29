package com.sgp.systemsgp.dto.activityevaluation;

import com.sgp.systemsgp.enums.ActivityEvaluationAspectType;
import com.sgp.systemsgp.enums.ActivityEvaluationLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActivityEvaluationAspectRequest {

    @NotNull
    private ActivityEvaluationAspectType aspectType;

    @NotBlank
    @Size(max = 500, message = "El criterio de evaluación no puede superar 500 caracteres")
    private String item;

    @NotNull
    private ActivityEvaluationLevel level;
}
