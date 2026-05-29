package com.sgp.systemsgp.dto.practiceform;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PracticeFormResponseSummary {

    private Long id;

    private String respondent;

    private LocalDateTime submittedAt;
}
