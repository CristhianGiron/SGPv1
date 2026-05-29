package com.sgp.systemsgp.dto.practicereport;

import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewPracticeReportRequest {

    private Boolean approved;

    @Size(max = 1500, message = "El feedback de información general no puede superar 1500 caracteres")
    private String generalInfoFeedback;

    @Size(max = 1500, message = "El feedback de presentación no puede superar 1500 caracteres")
    private String presentationFeedback;

    @Size(max = 1500, message = "El feedback de objetivos no puede superar 1500 caracteres")
    private String objectivesFeedback;

    @Size(max = 1500, message = "El feedback de metodología no puede superar 1500 caracteres")
    private String methodologyFeedback;

    @Size(max = 1500, message = "El feedback de actividades no puede superar 1500 caracteres")
    private String activitiesFeedback;

    @Size(max = 1500, message = "El feedback de conclusiones no puede superar 1500 caracteres")
    private String conclusionsFeedback;

    @Size(max = 1500, message = "El feedback de recomendaciones no puede superar 1500 caracteres")
    private String recommendationsFeedback;

    @Size(max = 1500, message = "El feedback de aprobación no puede superar 1500 caracteres")
    private String approvalFeedback;
}
