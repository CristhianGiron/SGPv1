package com.sgp.systemsgp.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = SecurityConfigTest.TestApplication.class, properties = "debug=false")
class SecurityConfigTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void directorCanReachAllDirectorReviewEndpoints() throws Exception {

        assertPatchAllowedForDirector("/api/activity-plans/1/review");
        assertPatchAllowedForDirector("/api/practice-reports/1/review");
        assertPatchAllowedForDirector("/api/completed-activity-records/1/review");
        assertPatchAllowedForDirector("/api/final-reports/1/director-review");
    }

    @Test
    void studentCannotReachReviewerEndpoints() throws Exception {

        assertPatchForbiddenForStudent("/api/activity-plans/1/review");
        assertPatchForbiddenForStudent("/api/practice-reports/1/review");
        assertPatchForbiddenForStudent("/api/completed-activity-records/1/review");
        assertPatchForbiddenForStudent("/api/final-reports/1/director-review");
    }

    @Test
    void documentPdfEndpointsAreReachableForAllowedRoles() throws Exception {

        assertGetAllowed("/api/activity-plans/1/pdf", "DIRECTOR_PRACTICAS");
        assertGetAllowed("/api/practice-reports/1/pdf", "DIRECTOR_PRACTICAS");
        assertGetAllowed("/api/completed-activity-records/1/pdf", "DIRECTOR_PRACTICAS");
        assertGetAllowed("/api/final-reports/1/pdf", "DIRECTOR_PRACTICAS");
        assertGetAllowed("/api/final-reports/1/pdf", "TUTOR_INSTITUCIONAL");
    }

    @Test
    void coordinationReportsAreReachableForAdminAndDirectorOnly() throws Exception {

        assertGetAllowed("/api/reports/coordination", "ADMIN");
        assertGetAllowed("/api/reports/coordination", "DIRECTOR_PRACTICAS");

        mockMvc.perform(get("/api/reports/coordination")
                        .with(user("student01").roles("ESTUDIANTE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void practiceCompletionEndpointsAreOnlyReachableForDirector() throws Exception {

        mockMvc.perform(patch("/api/enrollments/1/complete")
                        .with(user("director.practicas").roles("DIRECTOR_PRACTICAS"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/enrollments/1/complete")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/enrollments/1/reopen")
                        .with(user("tutor.practicas").roles("TUTOR_PRACTICAS"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void archiveBatchEndpointIsOnlyReachableForAdmin() throws Exception {

        mockMvc.perform(patch("/api/enrollments/archive-batch")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/enrollments/archive-batch")
                        .with(user("director.practicas").roles("DIRECTOR_PRACTICAS"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/enrollments/archive-batch")
                        .with(user("tutor.institucional").roles("TUTOR_INSTITUCIONAL"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    private void assertPatchAllowedForDirector(String path) throws Exception {
        mockMvc.perform(patch(path)
                        .with(user("director.practicas").roles("DIRECTOR_PRACTICAS"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());
    }

    private void assertPatchForbiddenForStudent(String path) throws Exception {
        mockMvc.perform(patch(path)
                        .with(user("student01").roles("ESTUDIANTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    private void assertGetAllowed(String path, String role) throws Exception {
        mockMvc.perform(get(path)
                        .with(user("allowed").roles(role)))
                .andExpect(status().isOk());
    }

    @SpringBootConfiguration
    @EnableAutoConfiguration(excludeName = {
            "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
            "org.springframework.boot.data.jpa.autoconfigure.JpaRepositoriesAutoConfiguration",
            "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration",
            "org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration"
    })
    @Import({ SecurityConfig.class, TestSecurityBeans.class, ReviewEndpointController.class })
    static class TestApplication {
    }

    @TestConfiguration
    static class TestSecurityBeans {

        @Bean
        JwtAuthFilter jwtAuthFilter() {
            return new JwtAuthFilter(null, null, null);
        }

        @Bean
        RateLimitingFilter rateLimitingFilter() {
            return new RateLimitingFilter();
        }
    }

    @RestController
    static class ReviewEndpointController {

        @PatchMapping("/api/activity-plans/{id}/review")
        void reviewActivityPlan(@PathVariable Long id) {
        }

        @PatchMapping("/api/practice-reports/{id}/review")
        void reviewPracticeReport(@PathVariable Long id) {
        }

        @PatchMapping("/api/completed-activity-records/{id}/review")
        void reviewCompletedActivityRecord(@PathVariable Long id) {
        }

        @PatchMapping("/api/final-reports/{id}/director-review")
        void reviewFinalReportAsDirector(@PathVariable Long id) {
        }

        @GetMapping("/api/activity-plans/{id}/pdf")
        void exportActivityPlanPdf(@PathVariable Long id) {
        }

        @GetMapping("/api/practice-reports/{id}/pdf")
        void exportPracticeReportPdf(@PathVariable Long id) {
        }

        @GetMapping("/api/completed-activity-records/{id}/pdf")
        void exportCompletedActivityRecordPdf(@PathVariable Long id) {
        }

        @GetMapping("/api/final-reports/{id}/pdf")
        void exportFinalReportPdf(@PathVariable Long id) {
        }

        @GetMapping("/api/reports/coordination")
        void coordinationReport() {
        }

        @PatchMapping("/api/enrollments/archive-batch")
        void archivePracticeBatch() {
        }

        @PatchMapping("/api/enrollments/{id}/complete")
        void completePractice(@PathVariable Long id) {
        }

        @PatchMapping("/api/enrollments/{id}/reopen")
        void reopenPractice(@PathVariable Long id) {
        }
    }
}
