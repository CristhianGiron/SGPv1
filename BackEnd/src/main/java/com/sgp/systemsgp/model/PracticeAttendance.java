package com.sgp.systemsgp.model;

import com.sgp.systemsgp.enums.PracticeAttendanceStatus;
import com.sgp.systemsgp.model.listener.AuditEntityListener;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "practice_attendances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditEntityListener.class)
public class PracticeAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private PracticeSchedule schedule;

    private Long schedulePeriodId;

    @Enumerated(EnumType.STRING)
    private DayOfWeek scheduledDayOfWeek;

    private LocalTime scheduledStartTime;

    private LocalTime scheduledEndTime;

    private LocalDate attendanceDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private Integer totalMinutes;

    @Enumerated(EnumType.STRING)
    private PracticeAttendanceStatus status;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String observations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registered_by", nullable = false)
    private Account registeredBy;

    private LocalDateTime registeredAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
