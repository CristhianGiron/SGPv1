package com.sgp.systemsgp.dto.practiceform;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Builder
public class PracticeFormQuestionTabulationResponse {

    private Long questionId;

    private boolean tabulable;

    private Map<String, Long> counts;

    private Long numericCount;

    private BigDecimal numericAverage;

    private BigDecimal numericMin;

    private BigDecimal numericMax;
}
