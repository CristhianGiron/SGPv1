package com.sgp.systemsgp.dto.practiceschedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticeAttendanceResponse {

    private Long id;

    private Long scheduleId;

    private Long schedulePeriodId;

    private DayOfWeek scheduledDayOfWeek;

    private LocalTime scheduledStartTime;

    private LocalTime scheduledEndTime;

    private LocalDate attendanceDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private Integer totalMinutes;

    private String totalTime;

    private String status;

    private String observations;

    private String registeredBy;

    private LocalDateTime registeredAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
