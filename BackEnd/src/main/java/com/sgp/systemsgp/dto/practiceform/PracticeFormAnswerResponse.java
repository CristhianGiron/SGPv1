package com.sgp.systemsgp.dto.practiceform;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class PracticeFormAnswerResponse {

    private Long questionId;

    private String textAnswer;

    private BigDecimal numberAnswer;

    private Boolean booleanAnswer;

    private List<String> selectedOptions;
}
