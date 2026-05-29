package com.sgp.systemsgp.dto.practiceform;

import com.sgp.systemsgp.enums.PracticeFormQuestionType;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PracticeFormQuestionResponse {

    private Long id;

    private Integer order;

    private PracticeFormQuestionType type;

    private String prompt;

    private boolean required;

    private boolean tabulable;

    private Integer scaleMin;

    private Integer scaleMax;

    private List<PracticeFormOptionResponse> options;

    private PracticeFormAnswerResponse answer;

    private PracticeFormQuestionTabulationResponse tabulation;

    private String studentInterpretation;
}
