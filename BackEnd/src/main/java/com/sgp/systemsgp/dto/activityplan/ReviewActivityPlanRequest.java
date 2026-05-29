package com.sgp.systemsgp.dto.activityplan;

import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewActivityPlanRequest {

    private Boolean approved;

    @Size(max = 1500, message = "El feedback de información general no puede superar 1500 caracteres")
    private String generalInfoFeedback;

    @Size(max = 1500, message = "El feedback de presentación no puede superar 1500 caracteres")
    private String presentationFeedback;

    @Size(max = 1500, message = "El feedback de objetivos no puede superar 1500 caracteres")
    private String objectivesFeedback;

    @Size(max = 1500, message = "El feedback de actividades no puede superar 1500 caracteres")
    private String activitiesFeedback;

    @Size(max = 1500, message = "El feedback de cronograma no puede superar 1500 caracteres")
    private String scheduleFeedback;

    @Size(max = 1500, message = "El feedback de recursos no puede superar 1500 caracteres")
    private String resourcesFeedback;

    @Size(max = 1500, message = "El feedback de aprobación no puede superar 1500 caracteres")
    private String approvalFeedback;
}
