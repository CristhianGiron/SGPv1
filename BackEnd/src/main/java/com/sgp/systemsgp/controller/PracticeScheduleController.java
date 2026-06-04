package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.practiceschedule.CreatePracticeScheduleRequest;
import com.sgp.systemsgp.dto.practiceschedule.PracticeAttendanceRequest;
import com.sgp.systemsgp.dto.practiceschedule.PracticeAttendanceResponse;
import com.sgp.systemsgp.dto.practiceschedule.PracticeScheduleResponse;
import com.sgp.systemsgp.dto.practiceschedule.UpdatePracticeScheduleRequest;
import com.sgp.systemsgp.service.PracticeScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/practice-schedules")
@RequiredArgsConstructor
public class PracticeScheduleController {

    private final PracticeScheduleService practiceScheduleService;

    @PostMapping
    @PreAuthorize("hasRole('TUTOR_INSTITUCIONAL')")
    public PracticeScheduleResponse create(
            Authentication authentication,
            @Valid @RequestBody CreatePracticeScheduleRequest request) {

        return practiceScheduleService.create(
                authentication.getName(),
                request);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<PracticeScheduleResponse> mySchedules(
            Authentication authentication) {

        return practiceScheduleService.mySchedules(
                authentication.getName());
    }

    @GetMapping("/managed")
    @PreAuthorize("hasRole('TUTOR_INSTITUCIONAL')")
    public List<PracticeScheduleResponse> managedSchedules(
            Authentication authentication) {

        return practiceScheduleService.managedSchedules(
                authentication.getName());
    }

    @GetMapping("/institution-review")
    @PreAuthorize("hasRole('DIRECTORA_INSTITUCION')")
    public List<PracticeScheduleResponse> institutionReviewQueue(
            Authentication authentication) {

        return practiceScheduleService.institutionReviewQueue(
                authentication.getName());
    }

    @GetMapping("/review")
    @PreAuthorize("hasAnyRole('TUTOR_PRACTICAS','DIRECTOR_PRACTICAS','ADMIN')")
    public List<PracticeScheduleResponse> reviewQueue(
            Authentication authentication) {

        return practiceScheduleService.reviewQueue(
                authentication.getName());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_INSTITUCIONAL','TUTOR_PRACTICAS','DIRECTORA_INSTITUCION','DIRECTOR_PRACTICAS','ADMIN')")
    public PracticeScheduleResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        return practiceScheduleService.getById(
                id,
                authentication.getName());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TUTOR_INSTITUCIONAL')")
    public PracticeScheduleResponse update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePracticeScheduleRequest request) {

        return practiceScheduleService.update(
                id,
                authentication.getName(),
                request);
    }

    @PostMapping("/{id}/attendances")
    @PreAuthorize("hasRole('TUTOR_INSTITUCIONAL')")
    public PracticeAttendanceResponse registerAttendance(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody PracticeAttendanceRequest request) {

        return practiceScheduleService.registerAttendance(
                id,
                authentication.getName(),
                request);
    }

    @PutMapping("/{id}/attendances/{attendanceId}")
    @PreAuthorize("hasRole('TUTOR_INSTITUCIONAL')")
    public PracticeAttendanceResponse updateAttendance(
            Authentication authentication,
            @PathVariable Long id,
            @PathVariable Long attendanceId,
            @Valid @RequestBody PracticeAttendanceRequest request) {

        return practiceScheduleService.updateAttendance(
                id,
                attendanceId,
                authentication.getName(),
                request);
    }
}
