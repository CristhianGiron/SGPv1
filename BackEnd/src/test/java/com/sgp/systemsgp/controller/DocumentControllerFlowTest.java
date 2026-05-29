package com.sgp.systemsgp.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgp.systemsgp.config.JacksonConfig;
import com.sgp.systemsgp.dto.activityplan.ActivityPlanResponse;
import com.sgp.systemsgp.dto.activityplan.CreateActivityPlanRequest;
import com.sgp.systemsgp.dto.activityplan.ReviewActivityPlanRequest;
import com.sgp.systemsgp.dto.activityplan.UpdateActivityPlanRequest;
import com.sgp.systemsgp.dto.completedactivity.CompletedActivityRecordResponse;
import com.sgp.systemsgp.dto.completedactivity.CreateCompletedActivityRecordRequest;
import com.sgp.systemsgp.dto.completedactivity.ReviewCompletedActivityRecordRequest;
import com.sgp.systemsgp.dto.completedactivity.UpdateCompletedActivityRecordRequest;
import com.sgp.systemsgp.dto.finalreport.CreateFinalReportRequest;
import com.sgp.systemsgp.dto.finalreport.FinalReportResponse;
import com.sgp.systemsgp.dto.finalreport.ReviewFinalReportRequest;
import com.sgp.systemsgp.dto.finalreport.UpdateFinalReportRequest;
import com.sgp.systemsgp.dto.practicereport.CreatePracticeReportRequest;
import com.sgp.systemsgp.dto.practicereport.PracticeReportResponse;
import com.sgp.systemsgp.dto.practicereport.ReviewPracticeReportRequest;
import com.sgp.systemsgp.dto.practicereport.UpdatePracticeReportRequest;
import com.sgp.systemsgp.service.ActivityPlanService;
import com.sgp.systemsgp.service.CompletedActivityRecordService;
import com.sgp.systemsgp.service.FinalReportService;
import com.sgp.systemsgp.service.PracticeReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DocumentControllerFlowTest {

    private static final String STUDENT = "student01";
    private static final String PRACTICE_TUTOR = "tutor.practicas";
    private static final String INSTITUTIONAL_TUTOR = "tutor.institucional";
    private static final String DIRECTOR = "director.practicas";

    @Mock
    private ActivityPlanService activityPlanService;

    @Mock
    private PracticeReportService practiceReportService;

    @Mock
    private CompletedActivityRecordService completedActivityRecordService;

    @Mock
    private FinalReportService finalReportService;

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new JacksonConfig().objectMapper();
        mockMvc = MockMvcBuilders
                .standaloneSetup(
                        new ActivityPlanController(activityPlanService),
                        new PracticeReportController(practiceReportService),
                        new CompletedActivityRecordController(completedActivityRecordService),
                        new FinalReportController(finalReportService))
                .build();
    }

    @Test
    void activityPlanHttpFlowCoversCorrectionAndDirectorApproval() throws Exception {
        when(activityPlanService.create(eq(STUDENT), any(CreateActivityPlanRequest.class)))
                .thenReturn(activityPlan(10L, "DRAFT", 0, false, false));
        when(activityPlanService.submit(10L, STUDENT))
                .thenReturn(activityPlan(10L, "SUBMITTED", 0, false, false))
                .thenReturn(activityPlan(10L, "SUBMITTED", 1, false, false));
        when(activityPlanService.review(eq(10L), eq(PRACTICE_TUTOR), any(ReviewActivityPlanRequest.class)))
                .thenReturn(activityPlan(10L, "NEEDS_CORRECTION", 0, false, false, "Ajustar actividades"))
                .thenReturn(activityPlan(10L, "SUBMITTED", 1, true, false));
        when(activityPlanService.update(eq(10L), eq(STUDENT), any(UpdateActivityPlanRequest.class)))
                .thenReturn(activityPlan(10L, "DRAFT", 1, false, false));
        when(activityPlanService.review(eq(10L), eq(DIRECTOR), any(ReviewActivityPlanRequest.class)))
                .thenReturn(activityPlan(10L, "APPROVED", 1, true, true));

        postJson("/api/activity-plans", STUDENT, Map.of("enrollmentId", 77))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        patchJson("/api/activity-plans/10/submit", STUDENT, Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        patchJson("/api/activity-plans/10/review", PRACTICE_TUTOR,
                Map.of("approved", false, "activitiesFeedback", "Ajustar actividades"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEEDS_CORRECTION"))
                .andExpect(jsonPath("$.activitiesFeedback").value("Ajustar actividades"));

        putJson("/api/activity-plans/10", STUDENT, Map.of("presentation", "Version corregida"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        patchJson("/api/activity-plans/10/submit", STUDENT, Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewCycle").value(1));

        patchJson("/api/activity-plans/10/review", PRACTICE_TUTOR, Map.of("approved", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.practiceTutorApproved").value(true))
                .andExpect(jsonPath("$.directorApproved").value(false));

        patchJson("/api/activity-plans/10/review", DIRECTOR, Map.of("approved", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.directorApproved").value(true));

        ArgumentCaptor<ReviewActivityPlanRequest> reviewCaptor =
                ArgumentCaptor.forClass(ReviewActivityPlanRequest.class);
        verify(activityPlanService, times(2)).submit(10L, STUDENT);
        verify(activityPlanService, times(2))
                .review(eq(10L), eq(PRACTICE_TUTOR), reviewCaptor.capture());
        assertThat(reviewCaptor.getAllValues().get(0).getApproved()).isFalse();
        assertThat(reviewCaptor.getAllValues().get(0).getActivitiesFeedback())
                .isEqualTo("Ajustar actividades");
        assertThat(reviewCaptor.getAllValues().get(1).getApproved()).isTrue();
        verify(activityPlanService).review(eq(10L), eq(DIRECTOR), any(ReviewActivityPlanRequest.class));
    }

    @Test
    void activityPlanReviewAcceptsFeedbackWithoutDecision() throws Exception {
        when(activityPlanService.review(eq(10L), eq(PRACTICE_TUTOR), any(ReviewActivityPlanRequest.class)))
                .thenReturn(activityPlan(10L, "SUBMITTED", 0, false, false, "Revisar cronograma"));

        patchJson("/api/activity-plans/10/review", PRACTICE_TUTOR,
                Map.of("activitiesFeedback", "Revisar cronograma"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.activitiesFeedback").value("Revisar cronograma"));

        ArgumentCaptor<ReviewActivityPlanRequest> reviewCaptor =
                ArgumentCaptor.forClass(ReviewActivityPlanRequest.class);
        verify(activityPlanService).review(eq(10L), eq(PRACTICE_TUTOR), reviewCaptor.capture());
        assertThat(reviewCaptor.getValue().getApproved()).isNull();
        assertThat(reviewCaptor.getValue().getActivitiesFeedback()).isEqualTo("Revisar cronograma");
    }

    @Test
    void practiceReportHttpFlowCoversCorrectionAndDirectorApproval() throws Exception {
        when(practiceReportService.create(eq(STUDENT), any(CreatePracticeReportRequest.class)))
                .thenReturn(practiceReport(20L, "DRAFT", 0, false, false));
        when(practiceReportService.submit(20L, STUDENT))
                .thenReturn(practiceReport(20L, "SUBMITTED", 0, false, false))
                .thenReturn(practiceReport(20L, "SUBMITTED", 1, false, false));
        when(practiceReportService.review(eq(20L), eq(PRACTICE_TUTOR), any(ReviewPracticeReportRequest.class)))
                .thenReturn(practiceReport(20L, "NEEDS_CORRECTION", 0, false, false, "Mejorar metodologia"))
                .thenReturn(practiceReport(20L, "SUBMITTED", 1, true, false));
        when(practiceReportService.update(eq(20L), eq(STUDENT), any(UpdatePracticeReportRequest.class)))
                .thenReturn(practiceReport(20L, "DRAFT", 1, false, false));
        when(practiceReportService.review(eq(20L), eq(DIRECTOR), any(ReviewPracticeReportRequest.class)))
                .thenReturn(practiceReport(20L, "APPROVED", 1, true, true));

        postJson("/api/practice-reports", STUDENT, Map.of("enrollmentId", 77))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        patchJson("/api/practice-reports/20/submit", STUDENT, Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        patchJson("/api/practice-reports/20/review", PRACTICE_TUTOR,
                Map.of("approved", false, "methodologyFeedback", "Mejorar metodologia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEEDS_CORRECTION"))
                .andExpect(jsonPath("$.methodologyFeedback").value("Mejorar metodologia"));

        putJson("/api/practice-reports/20", STUDENT, Map.of("methodology", "Metodologia corregida"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        patchJson("/api/practice-reports/20/submit", STUDENT, Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewCycle").value(1));

        patchJson("/api/practice-reports/20/review", PRACTICE_TUTOR, Map.of("approved", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.practiceTutorApproved").value(true));

        patchJson("/api/practice-reports/20/review", DIRECTOR, Map.of("approved", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.directorApproved").value(true));

        ArgumentCaptor<ReviewPracticeReportRequest> reviewCaptor =
                ArgumentCaptor.forClass(ReviewPracticeReportRequest.class);
        verify(practiceReportService, times(2)).submit(20L, STUDENT);
        verify(practiceReportService, times(2))
                .review(eq(20L), eq(PRACTICE_TUTOR), reviewCaptor.capture());
        assertThat(reviewCaptor.getAllValues().get(0).getMethodologyFeedback())
                .isEqualTo("Mejorar metodologia");
        assertThat(reviewCaptor.getAllValues().get(1).getApproved()).isTrue();
        verify(practiceReportService).review(eq(20L), eq(DIRECTOR), any(ReviewPracticeReportRequest.class));
    }

    @Test
    void completedActivityRecordHttpFlowCoversCorrectionAndDirectorApproval() throws Exception {
        when(completedActivityRecordService.create(eq(STUDENT), any(CreateCompletedActivityRecordRequest.class)))
                .thenReturn(completedRecord(30L, "DRAFT", 0, false, false));
        when(completedActivityRecordService.submit(30L, STUDENT))
                .thenReturn(completedRecord(30L, "SUBMITTED", 0, false, false))
                .thenReturn(completedRecord(30L, "SUBMITTED", 1, false, false));
        when(completedActivityRecordService.review(eq(30L), eq(PRACTICE_TUTOR),
                any(ReviewCompletedActivityRecordRequest.class)))
                .thenReturn(completedRecord(30L, "NEEDS_CORRECTION", 0, false, false, "Completar evidencias"))
                .thenReturn(completedRecord(30L, "SUBMITTED", 1, true, false));
        when(completedActivityRecordService.update(eq(30L), eq(STUDENT),
                any(UpdateCompletedActivityRecordRequest.class)))
                .thenReturn(completedRecord(30L, "DRAFT", 1, false, false));
        when(completedActivityRecordService.review(eq(30L), eq(DIRECTOR),
                any(ReviewCompletedActivityRecordRequest.class)))
                .thenReturn(completedRecord(30L, "APPROVED", 1, true, true));

        postJson("/api/completed-activity-records", STUDENT, Map.of("enrollmentId", 77))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        patchJson("/api/completed-activity-records/30/submit", STUDENT, Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        patchJson("/api/completed-activity-records/30/review", PRACTICE_TUTOR,
                Map.of("approved", false, "activitiesFeedback", "Completar evidencias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEEDS_CORRECTION"))
                .andExpect(jsonPath("$.activitiesFeedback").value("Completar evidencias"));

        putJson("/api/completed-activity-records/30", STUDENT, Map.of("academicPeriod", "2026-1 corregido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        patchJson("/api/completed-activity-records/30/submit", STUDENT, Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewCycle").value(1));

        patchJson("/api/completed-activity-records/30/review", PRACTICE_TUTOR, Map.of("approved", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.practiceTutorApproved").value(true));

        patchJson("/api/completed-activity-records/30/review", DIRECTOR, Map.of("approved", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.directorApproved").value(true));

        ArgumentCaptor<ReviewCompletedActivityRecordRequest> reviewCaptor =
                ArgumentCaptor.forClass(ReviewCompletedActivityRecordRequest.class);
        verify(completedActivityRecordService, times(2)).submit(30L, STUDENT);
        verify(completedActivityRecordService, times(2))
                .review(eq(30L), eq(PRACTICE_TUTOR), reviewCaptor.capture());
        assertThat(reviewCaptor.getAllValues().get(0).getActivitiesFeedback())
                .isEqualTo("Completar evidencias");
        assertThat(reviewCaptor.getAllValues().get(1).getApproved()).isTrue();
        verify(completedActivityRecordService)
                .review(eq(30L), eq(DIRECTOR), any(ReviewCompletedActivityRecordRequest.class));
    }

    @Test
    void finalReportHttpFlowCoversPracticeInstitutionalAndDirectorApproval() throws Exception {
        when(finalReportService.create(eq(STUDENT), any(CreateFinalReportRequest.class)))
                .thenReturn(finalReport(40L, "DRAFT", 0, false, false, false));
        when(finalReportService.submit(40L, STUDENT))
                .thenReturn(finalReport(40L, "SUBMITTED", 0, false, false, false))
                .thenReturn(finalReport(40L, "SUBMITTED", 1, false, false, false));
        when(finalReportService.reviewByPracticeTutor(eq(40L), eq(PRACTICE_TUTOR),
                any(ReviewFinalReportRequest.class)))
                .thenReturn(finalReport(40L, "NEEDS_CORRECTION", 0, false, false, false,
                        "Revisar objetivo"))
                .thenReturn(finalReport(40L, "SUBMITTED", 1, true, false, false));
        when(finalReportService.update(eq(40L), eq(STUDENT), any(UpdateFinalReportRequest.class)))
                .thenReturn(finalReport(40L, "DRAFT", 1, false, false, false));
        when(finalReportService.reviewByInstitutionalTutor(eq(40L), eq(INSTITUTIONAL_TUTOR),
                any(ReviewFinalReportRequest.class)))
                .thenReturn(finalReport(40L, "SUBMITTED", 1, true, true, false));
        when(finalReportService.reviewByDirector(eq(40L), eq(DIRECTOR), any(ReviewFinalReportRequest.class)))
                .thenReturn(finalReport(40L, "APPROVED", 1, true, true, true));

        postJson("/api/final-reports", STUDENT, Map.of("enrollmentId", 77))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        patchJson("/api/final-reports/40/submit", STUDENT, Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUBMITTED"));

        patchJson("/api/final-reports/40/practice-review", PRACTICE_TUTOR,
                Map.of("approved", false, "objectiveFeedback", "Revisar objetivo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEEDS_CORRECTION"))
                .andExpect(jsonPath("$.practiceObjectiveFeedback").value("Revisar objetivo"));

        putJson("/api/final-reports/40", STUDENT, Map.of("objective", "Objetivo corregido"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        patchJson("/api/final-reports/40/submit", STUDENT, Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewCycle").value(1));

        patchJson("/api/final-reports/40/practice-review", PRACTICE_TUTOR, Map.of("approved", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.practiceTutorApproved").value(true))
                .andExpect(jsonPath("$.directorApproved").value(false));

        patchJson("/api/final-reports/40/institutional-review", INSTITUTIONAL_TUTOR, Map.of("approved", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.institutionalTutorApproved").value(true));

        patchJson("/api/final-reports/40/director-review", DIRECTOR, Map.of("approved", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.directorApproved").value(true));

        ArgumentCaptor<ReviewFinalReportRequest> practiceReviewCaptor =
                ArgumentCaptor.forClass(ReviewFinalReportRequest.class);
        verify(finalReportService, times(2)).submit(40L, STUDENT);
        verify(finalReportService, times(2))
                .reviewByPracticeTutor(eq(40L), eq(PRACTICE_TUTOR), practiceReviewCaptor.capture());
        assertThat(practiceReviewCaptor.getAllValues().get(0).getObjectiveFeedback())
                .isEqualTo("Revisar objetivo");
        assertThat(practiceReviewCaptor.getAllValues().get(1).getApproved()).isTrue();
        verify(finalReportService)
                .reviewByInstitutionalTutor(eq(40L), eq(INSTITUTIONAL_TUTOR), any(ReviewFinalReportRequest.class));
        verify(finalReportService)
                .reviewByDirector(eq(40L), eq(DIRECTOR), any(ReviewFinalReportRequest.class));
    }

    private org.springframework.test.web.servlet.ResultActions postJson(
            String path,
            String username,
            Map<String, Object> body) throws Exception {
        return mockMvc.perform(post(path)
                .principal(authentication(username))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(body)));
    }

    private org.springframework.test.web.servlet.ResultActions putJson(
            String path,
            String username,
            Map<String, Object> body) throws Exception {
        return mockMvc.perform(put(path)
                .principal(authentication(username))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(body)));
    }

    private org.springframework.test.web.servlet.ResultActions patchJson(
            String path,
            String username,
            Map<String, Object> body) throws Exception {
        return mockMvc.perform(patch(path)
                .principal(authentication(username))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(body)));
    }

    private String json(Map<String, Object> body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    private Authentication authentication(String username) {
        return new UsernamePasswordAuthenticationToken(
                username,
                null,
                AuthorityUtils.createAuthorityList("ROLE_TEST"));
    }

    private ActivityPlanResponse activityPlan(
            Long id,
            String status,
            int reviewCycle,
            boolean practiceTutorApproved,
            boolean directorApproved) {
        return activityPlan(id, status, reviewCycle, practiceTutorApproved, directorApproved, null);
    }

    private ActivityPlanResponse activityPlan(
            Long id,
            String status,
            int reviewCycle,
            boolean practiceTutorApproved,
            boolean directorApproved,
            String activitiesFeedback) {
        return ActivityPlanResponse.builder()
                .id(id)
                .status(status)
                .reviewCycle(reviewCycle)
                .practiceTutorApproved(practiceTutorApproved)
                .directorApproved(directorApproved)
                .activitiesFeedback(activitiesFeedback)
                .build();
    }

    private PracticeReportResponse practiceReport(
            Long id,
            String status,
            int reviewCycle,
            boolean practiceTutorApproved,
            boolean directorApproved) {
        return practiceReport(id, status, reviewCycle, practiceTutorApproved, directorApproved, null);
    }

    private PracticeReportResponse practiceReport(
            Long id,
            String status,
            int reviewCycle,
            boolean practiceTutorApproved,
            boolean directorApproved,
            String methodologyFeedback) {
        return PracticeReportResponse.builder()
                .id(id)
                .status(status)
                .reviewCycle(reviewCycle)
                .practiceTutorApproved(practiceTutorApproved)
                .directorApproved(directorApproved)
                .methodologyFeedback(methodologyFeedback)
                .build();
    }

    private CompletedActivityRecordResponse completedRecord(
            Long id,
            String status,
            int reviewCycle,
            boolean practiceTutorApproved,
            boolean directorApproved) {
        return completedRecord(id, status, reviewCycle, practiceTutorApproved, directorApproved, null);
    }

    private CompletedActivityRecordResponse completedRecord(
            Long id,
            String status,
            int reviewCycle,
            boolean practiceTutorApproved,
            boolean directorApproved,
            String activitiesFeedback) {
        return CompletedActivityRecordResponse.builder()
                .id(id)
                .status(status)
                .reviewCycle(reviewCycle)
                .practiceTutorApproved(practiceTutorApproved)
                .directorApproved(directorApproved)
                .activitiesFeedback(activitiesFeedback)
                .build();
    }

    private FinalReportResponse finalReport(
            Long id,
            String status,
            int reviewCycle,
            boolean practiceTutorApproved,
            boolean institutionalTutorApproved,
            boolean directorApproved) {
        return finalReport(
                id,
                status,
                reviewCycle,
                practiceTutorApproved,
                institutionalTutorApproved,
                directorApproved,
                null);
    }

    private FinalReportResponse finalReport(
            Long id,
            String status,
            int reviewCycle,
            boolean practiceTutorApproved,
            boolean institutionalTutorApproved,
            boolean directorApproved,
            String practiceObjectiveFeedback) {
        return FinalReportResponse.builder()
                .id(id)
                .status(status)
                .reviewCycle(reviewCycle)
                .practiceTutorApproved(practiceTutorApproved)
                .institutionalTutorApproved(institutionalTutorApproved)
                .directorApproved(directorApproved)
                .practiceObjectiveFeedback(practiceObjectiveFeedback)
                .build();
    }
}
