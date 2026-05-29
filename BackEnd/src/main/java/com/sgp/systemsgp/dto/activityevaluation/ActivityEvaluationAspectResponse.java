package com.sgp.systemsgp.dto.activityevaluation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityEvaluationAspectResponse {

    private Long id;

    private String aspectType;

    private String item;

    private String level;

    private Integer score;
}
