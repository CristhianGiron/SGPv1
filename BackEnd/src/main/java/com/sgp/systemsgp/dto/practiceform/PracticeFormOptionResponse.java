package com.sgp.systemsgp.dto.practiceform;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PracticeFormOptionResponse {

    private Long id;

    private String label;

    private Integer order;
}
