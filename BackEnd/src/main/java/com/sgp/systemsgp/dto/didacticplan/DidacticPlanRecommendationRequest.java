package com.sgp.systemsgp.dto.didacticplan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DidacticPlanRecommendationRequest {

    @NotBlank
    @Size(max = 6000)
    private String recommendations;
}
