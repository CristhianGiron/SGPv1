package com.sgp.systemsgp.dto.completedactivity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompletedActivityRecordEntryResponse {

    private Long id;

    private LocalDate activityDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private Integer totalMinutes;

    private String totalTime;

    private String developedActivities;

    private String evidenceLink;

    private String feedback;

    private String suggestions;
}
