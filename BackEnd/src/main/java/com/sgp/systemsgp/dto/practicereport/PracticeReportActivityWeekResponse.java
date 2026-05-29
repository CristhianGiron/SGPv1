package com.sgp.systemsgp.dto.practicereport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticeReportActivityWeekResponse {

    private Long id;

    private Integer weekNumber;

    private LocalDate startDate;

    private LocalDate endDate;

    private String activities;
}
