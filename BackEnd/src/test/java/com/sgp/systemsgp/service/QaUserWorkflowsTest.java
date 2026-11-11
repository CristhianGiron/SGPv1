/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          QaUserWorkflowsTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Qa User Workflows Test mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.didacticplan.*;
import com.sgp.systemsgp.dto.practiceform.*;
import com.sgp.systemsgp.enums.*;
import com.sgp.systemsgp.model.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "debug=false")
@ActiveProfiles("test")
@Transactional
class QaUserWorkflowsTest {
    @Autowired EntityManager em;
    @Autowired EnrollmentService enrollments;
    @Autowired DidacticPlanService plans;
    @Autowired PracticeFormService forms;
    @Autowired WebApplicationContext context;
    @Autowired WorkspaceDraftService serverDrafts;
    @Autowired PracticeArchiveExportService archiveExport;
    @Autowired ActivityPlanService activityPlans;
    @Autowired FinalReportService finalReports;
    Account student, tutor, practiceTutor, director, admin, outsider, institutionDirector;
    Course course;
    Enrollment enrollment;

    @Test void validationResponseIdentifiesTheFieldAndNestedQuestionWithoutLosingTheSummary() throws Exception {
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        String json = "{\"enrollmentId\":" + enrollment.getId() + ",\"targetRole\":\"INSTITUTIONAL_TUTOR\",\"title\":\"\",\"questions\":[{\"type\":\"OPEN_TEXT\",\"prompt\":\"\"}]}";
        var result = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/practice-forms")
                .with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json").content(json))
                .andExpect(status().isBadRequest()).andReturn();
        var response = new com.fasterxml.jackson.databind.ObjectMapper().readTree(result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
        assertThat(response.get("message").asText()).contains("título");
        assertThat(response.get("fieldErrors").get("title").asText()).contains("título");
        assertThat(response.get("fieldErrors").get("questions[0].prompt").asText()).isNotBlank();
    }

    @Test void serverDraftsArePrivateAndRejectStaleWritesIncludingAfterClearing() throws Exception {
        String scope = "activity-plans:" + enrollment.getId() + ":new";
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        String content = "{\"presentation\":\"Educación de María Muñoz\"}";
        var request = mapper.writeValueAsString(java.util.Map.of("revision", 0, "content", content));
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/drafts/" + scope)
                .with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json").content(request))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.revision").value(1));
        mvc.perform(get("/api/drafts/" + scope).with(user(outsider.getUsername()).roles("ESTUDIANTE")))
                .andExpect(status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.content").doesNotExist());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/drafts/" + scope)
                .with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json").content(request))
                .andExpect(status().isConflict());
        assertThat(serverDrafts.get(student.getUsername(), scope).content()).isEqualTo(content);
        var cleared = serverDrafts.save(student.getUsername(), scope, 1, null);
        assertThat(cleared.revision()).isEqualTo(2);
        assertThatThrownBy(() -> serverDrafts.save(student.getUsername(), scope, 1, content))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThat(serverDrafts.get(student.getUsername(), scope).content()).isNull();
    }

    @Test void draftPdfPreviewWorksBeforeApprovalAndCannotBypassAccessOrFinalExport() throws Exception {
        var plan = persist(ActivityPlan.builder().student(student).course(course).enrollment(enrollment)
                .educationalInstitution(student.getInstitution()).presentation("Presentación académica: María Muñoz")
                .studentFullName("María Muñoz").status(ActivityPlanStatus.DRAFT).build());
        var report = persist(FinalReport.builder().student(student).course(course).enrollment(enrollment)
                .educationalInstitution(student.getInstitution()).studentFullName("María Muñoz")
                .status(FinalReportStatus.DRAFT).build());
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        var result = mvc.perform(get("/api/activity-plans/" + plan.getId() + "/pdf/preview")
                .with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isOk()).andReturn();
        try (var pdf = org.apache.pdfbox.Loader.loadPDF(result.getResponse().getContentAsByteArray())) {
            assertThat(new org.apache.pdfbox.text.PDFTextStripper().getText(pdf)).contains("VISTA PREVIA", "María Muñoz");
        }
        mvc.perform(get("/api/activity-plans/" + plan.getId() + "/pdf/preview")
                .with(user(outsider.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/activity-plans/" + plan.getId() + "/pdf")
                .with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isBadRequest());
        assertThat(finalReports.previewPdf(report.getId(), student.getUsername())).isNotEmpty();
        assertThat(plan.getStatus()).isEqualTo(ActivityPlanStatus.DRAFT);
    }

    @Test void archiveContainsOnlyThisPracticesApprovedDocumentsEvidenceAndAnHonestIndex() throws Exception {
        var plan = persist(ActivityPlan.builder().student(student).course(course).enrollment(enrollment)
                .educationalInstitution(student.getInstitution()).presentation("Documento definitivo de educación")
                .studentFullName("María Muñoz").status(ActivityPlanStatus.APPROVED).build());
        persist(PracticeReport.builder().student(student).course(course).enrollment(enrollment)
                .educationalInstitution(student.getInstitution()).status(PracticeReportStatus.DRAFT).build());
        byte[] photoBytes = new byte[]{1,2,3,4};
        var photo = persist(PracticePhoto.builder().student(student).course(course).enrollment(enrollment)
                .uploadedBy(student).description("Evidencia académica de Muñoz").contentType("image/png")
                .originalFilename("../../imagen.png").fileSize(4L).data(photoBytes).build());
        var otherEnrollment = persist(Enrollment.builder().account(outsider).course(course).status(EnrollmentStatus.APPROVED).build());
        persist(PracticePhoto.builder().student(outsider).course(course).enrollment(otherEnrollment)
                .uploadedBy(outsider).description("PRIVADO_OTRA_PRACTICA").contentType("image/png")
                .originalFilename("privado.png").fileSize(4L).data(photoBytes).build());
        var entries = new java.util.LinkedHashMap<String, byte[]>();
        try (var zip = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(archiveExport.export(enrollment.getId(), student.getUsername())), java.nio.charset.StandardCharsets.UTF_8)) {
            java.util.zip.ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) entries.put(entry.getName(), zip.readAllBytes());
        }
        assertThat(entries.keySet()).containsExactlyInAnyOrder("documentos/L2-plan-actividades-" + plan.getId() + ".pdf", "evidencias/evidencia-" + photo.getId() + ".png", "00-INDICE.txt");
        String index = new String(entries.get("00-INDICE.txt"), java.nio.charset.StandardCharsets.UTF_8);
        assertThat(index).contains("pendiente de aprobación", "L.3: sin registrar", "Muñoz").doesNotContain("PRIVADO_OTRA_PRACTICA", "../");
        assertThatThrownBy(() -> archiveExport.export(enrollment.getId(), outsider.getUsername())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test void allSixPdfPreviewsAndTheCompleteArchiveWorkThroughTheSecuredHttpEndpoints() throws Exception {
        var school = student.getInstitution();
        var l1 = persist(PracticeReport.builder().student(student).course(course).enrollment(enrollment).educationalInstitution(school).status(PracticeReportStatus.APPROVED).build());
        var l2 = persist(ActivityPlan.builder().student(student).course(course).enrollment(enrollment).educationalInstitution(school).status(ActivityPlanStatus.APPROVED).build());
        var image = new java.awt.image.BufferedImage(20, 10, java.awt.image.BufferedImage.TYPE_INT_RGB);
        var png = new java.io.ByteArrayOutputStream(); javax.imageio.ImageIO.write(image, "png", png);
        var letterhead = persist(EntityImageService.decode(new org.springframework.mock.web.MockMultipartFile("image", "membrete.png", "image/png", png.toByteArray())));
        var l3 = persist(FinalReport.builder().student(student).course(course).enrollment(enrollment).educationalInstitution(school).letterheadImage(letterhead).status(FinalReportStatus.APPROVED).build());
        var l4 = persist(ActivityEvaluation.builder().student(student).course(course).enrollment(enrollment).educationalInstitution(school).evaluatedBy(practiceTutor).build());
        var l5 = persist(PracticeFollowUpReport.builder().student(student).course(course).enrollment(enrollment).educationalInstitution(school).reportedBy(practiceTutor).build());
        var l6 = persist(CompletedActivityRecord.builder().student(student).course(course).enrollment(enrollment).educationalInstitution(school).status(CompletedActivityRecordStatus.APPROVED).build());
        var paths = List.of("activity-plans/" + l2.getId(), "practice-reports/" + l1.getId(), "final-reports/" + l3.getId(),
                "activity-evaluations/" + l4.getId(), "practice-follow-up-reports/" + l5.getId(), "completed-activity-records/" + l6.getId());
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        for (String path : paths) {
            var result = mvc.perform(get("/api/" + path + "/pdf/preview").with(user(student.getUsername()).roles("ESTUDIANTE")))
                    .andExpect(status().isOk()).andReturn();
            try (var pdf = org.apache.pdfbox.Loader.loadPDF(result.getResponse().getContentAsByteArray())) {
                assertThat(new org.apache.pdfbox.text.PDFTextStripper().getText(pdf)).contains("VISTA PREVIA");
            }
        }
        var result = mvc.perform(get("/api/enrollments/" + enrollment.getId() + "/archive.zip")
                .with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isOk()).andReturn();
        int pdfCount = 0;
        try (var zip = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(result.getResponse().getContentAsByteArray()))) {
            java.util.zip.ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) if (entry.getName().endsWith(".pdf")) {
                pdfCount++;
                try (var pdf = org.apache.pdfbox.Loader.loadPDF(zip.readAllBytes())) {
                    assertThat(new org.apache.pdfbox.text.PDFTextStripper().getText(pdf)).doesNotContain("VISTA PREVIA");
                }
            }
        }
        assertThat(pdfCount).isEqualTo(6);
        mvc.perform(get("/api/enrollments/" + enrollment.getId() + "/archive.zip")
                .with(user(outsider.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
    }

    @BeforeEach void fixtures() {
        Career career = persist(Career.builder().name("QA Carrera").code("QA-C").build());
        AcademicCycle cycle = persist(AcademicCycle.builder().name("QA Ciclo").career(career).build());
        Institution school = persist(Institution.builder().name("QA Escuela").code("QA-E").type(InstitutionType.ESCUELA).build());
        student = account("qa.student", RoleName.ROLE_ESTUDIANTE, career, cycle, school);
        tutor = account("qa.tutor", RoleName.ROLE_TUTOR_INSTITUCIONAL, career, cycle, school);
        practiceTutor = account("qa.practice", RoleName.ROLE_TUTOR_PRACTICAS, career, cycle, school);
        director = account("qa.director", RoleName.ROLE_DIRECTOR_PRACTICAS, career, cycle, school);
        admin = account("qa.admin", RoleName.ROLE_ADMIN, career, cycle, school);
        outsider = account("qa.other", RoleName.ROLE_ESTUDIANTE, career, cycle, school);
        institutionDirector = account("qa.school-director", RoleName.ROLE_DIRECTORA_INSTITUCION, career, cycle, school);
        course = persist(Course.builder().name("QA Paralelo").code("QA-P").academicCycle(cycle)
                .practiceTutor(practiceTutor).institutionalTutor(tutor).capacity(10).build());
        enrollment = persist(Enrollment.builder().account(student).course(course).status(EnrollmentStatus.APPROVED).build());
        persist(CourseStudentMembership.builder().course(course).student(student).active(true).assignedAt(java.time.LocalDateTime.now()).build());
        em.flush();
    }

    @Test void enrollmentConclusionArchiveRecoveryAndReopeningPersistCorrectly() {
        enrollment.setStatus(EnrollmentStatus.PENDING);
        assertThat(enrollments.approve(admin.getUsername(), enrollment.getId()).getStatus()).isEqualTo("APPROVED");
        assertThat(enrollments.complete(director.getUsername(), enrollment.getId()).getStatus()).isEqualTo("COMPLETED");
        assertThat(enrollments.archive(admin.getUsername(), enrollment.getId()).isArchived()).isTrue();
        assertThat(enrollments.unarchive(admin.getUsername(), enrollment.getId()).isArchived()).isFalse();
        assertThat(enrollments.reopen(director.getUsername(), enrollment.getId()).getStatus()).isEqualTo("APPROVED");
        em.flush(); em.clear();
        assertThat(em.find(Enrollment.class, enrollment.getId()).getStatus()).isEqualTo(EnrollmentStatus.APPROVED);
    }

    @Test void pendingEnrollmentCanBeWithdrawnAndAnApprovedEnrollmentCanBeAssignedToAGroup() {
        CourseGroup group = persist(CourseGroup.builder().name("QA Grupo").course(course).institutionalTutor(tutor).capacity(10).build());
        assertThat(enrollments.assignGroup(practiceTutor.getUsername(), enrollment.getId(), group.getId()).getGroupId()).isEqualTo(group.getId());
        assertThat(InstitutionalAssignmentResolver.institutionalTutor(enrollment).getId()).isEqualTo(tutor.getId());
        enrollment.setGroup(null); enrollment.setStatus(EnrollmentStatus.PENDING);
        Long id = enrollment.getId();
        assertThatThrownBy(() -> enrollments.cancel(id, student.getUsername())).isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        assertThat(em.find(Enrollment.class, id)).isNotNull();
    }

    @Test void institutionalDirectorCanAnswerTheirInterviewAndFalseIsAValidResponse() {
        Long id = forms.create(student.getUsername(), formRequest(PracticeFormTargetRole.INSTITUTION_DIRECTOR, PracticeFormQuestionType.YES_NO)).getId();
        var form = forms.getById(id, institutionDirector.getUsername());
        PracticeFormAnswerRequest answer = new PracticeFormAnswerRequest(); answer.setQuestionId(form.getQuestions().get(0).getId()); answer.setBooleanAnswer(false);
        SubmitPracticeFormResponseRequest response = new SubmitPracticeFormResponseRequest(); response.setAnswers(List.of(answer));
        forms.submitResponse(id, institutionDirector.getUsername(), response);
        em.flush(); em.clear();
        var question = forms.getById(id, student.getUsername()).getQuestions().get(0);
        assertThat(question.getAnswer().getBooleanAnswer()).isFalse();
        assertThat(question.getTabulation().getCounts()).containsEntry("No", 1L).containsEntry("Sí", 0L);
    }

    @Test void didacticPlanGoesFromDraftToRecommendationsCorrectionAndResubmission() {
        DidacticPlanRequest request = planRequest();
        Long id = plans.create(student.getUsername(), request).getId();
        assertThat(plans.submit(id, student.getUsername()).getStatus()).isEqualTo(DidacticPlanStatus.SUBMITTED);
        DidacticPlanRecommendationRequest recommendation = new DidacticPlanRecommendationRequest();
        recommendation.setRecommendations("Añadir evaluación formativa");
        assertThat(plans.addRecommendations(id, tutor.getUsername(), recommendation).getStatus()).isEqualTo(DidacticPlanStatus.NEEDS_CORRECTION);
        request.setLearningObjectives("Objetivo corregido"); request.setDraft(false);
        assertThat(plans.update(id, student.getUsername(), request).getStatus()).isEqualTo(DidacticPlanStatus.SUBMITTED);
        em.flush(); em.clear();
        assertThat(plans.getById(id, student.getUsername()).getLearningObjectives()).isEqualTo("Objetivo corregido");
        assertThat(plans.getById(id, practiceTutor.getUsername()).getRecommendedByName()).isNotBlank();
    }

    @Test void foreignStudentCannotReadAnotherStudentsSubmittedPlan() {
        DidacticPlanRequest request = planRequest(); request.setDraft(false);
        Long id = plans.create(student.getUsername(), request).getId();
        assertThatThrownBy(() -> plans.getById(id, outsider.getUsername())).isInstanceOf(AccessDeniedException.class);
    }

    @Test void spanishTextSurvivesUtf8HttpAndDatabasePersistence() throws Exception {
        student.getPerson().setNames("María José");
        student.getPerson().setLastNames("Muñoz Peñafiel");
        em.flush();
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        String title = "Entrevista: educación, pedagogía y lingüística";
        String prompt = "¿Qué actividades realizó el niño? ¡Incluya la evaluación del año!";
        String json = "{\"enrollmentId\":" + enrollment.getId() + ",\"targetRole\":\"INSTITUTIONAL_TUTOR\",\"title\":\"" + title
                + "\",\"draft\":true,\"questions\":[{\"type\":\"OPEN_TEXT\",\"prompt\":\"" + prompt + "\",\"required\":true}]}";
        var result = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/practice-forms")
                .with(user(student.getUsername()).roles("ESTUDIANTE"))
                .contentType("application/json; charset=UTF-8").content(json.getBytes(java.nio.charset.StandardCharsets.UTF_8)))
                .andExpect(status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().encoding("UTF-8"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.title").value(title)).andReturn();
        Long id = new com.fasterxml.jackson.databind.ObjectMapper().readTree(result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8)).get("id").asLong();
        em.flush(); em.clear();
        var persisted = forms.getById(id, student.getUsername());
        assertThat(persisted.getTitle()).isEqualTo(title);
        assertThat(persisted.getQuestions().get(0).getPrompt()).isEqualTo(prompt);
        assertThat(persisted.getStudentFullName()).contains("María José", "Muñoz Peñafiel");
        mvc.perform(get("/api/practice-forms/" + id).with(user(student.getUsername()).roles("ESTUDIANTE")))
                .andExpect(status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.questions[0].prompt").value(prompt));
    }

    @Test void interviewCanBeAnsweredInterpretedAndReadByItsSupervisors() {
        CreatePracticeFormRequest request = formRequest(PracticeFormTargetRole.INSTITUTIONAL_TUTOR, PracticeFormQuestionType.OPEN_TEXT);
        Long id = forms.create(student.getUsername(), request).getId();
        var form = forms.getById(id, tutor.getUsername());
        PracticeFormAnswerRequest answer = new PracticeFormAnswerRequest();
        answer.setQuestionId(form.getQuestions().get(0).getId()); answer.setTextAnswer("Trabajo colaborativo");
        SubmitPracticeFormResponseRequest response = new SubmitPracticeFormResponseRequest(); response.setAnswers(List.of(answer));
        assertThat(forms.submitResponse(id, tutor.getUsername(), response).getStatus()).isEqualTo(PracticeFormStatus.ANSWERED);
        UpdatePracticeFormInterpretationRequest interpretation = new UpdatePracticeFormInterpretationRequest();
        interpretation.setInterpretation("La comunidad participa activamente");
        forms.updateInterpretation(id, answer.getQuestionId(), student.getUsername(), interpretation);
        em.flush(); em.clear();
        for (Account viewer : List.of(student, tutor, practiceTutor, director, admin)) {
            assertThat(forms.getById(id, viewer.getUsername()).getQuestions().get(0).getAnswer().getTextAnswer()).isEqualTo("Trabajo colaborativo");
        }
        assertThat(forms.getById(id, student.getUsername()).getQuestions().get(0).getStudentInterpretation()).isNotBlank();
    }

    @Test void quantitativeInterviewsKeepTheirCountsAndTheStudentsQualitativeInterpretation() {
        for (var type : List.of(PracticeFormQuestionType.NUMBER, PracticeFormQuestionType.YES_NO)) {
            Long id = forms.create(student.getUsername(), formRequest(PracticeFormTargetRole.INSTITUTIONAL_TUTOR, type)).getId();
            var question = forms.getById(id, tutor.getUsername()).getQuestions().get(0);
            var answer = new PracticeFormAnswerRequest();
            answer.setQuestionId(question.getId());
            if (type == PracticeFormQuestionType.NUMBER) answer.setNumberAnswer(BigDecimal.ZERO);
            else answer.setBooleanAnswer(false);
            var response = new SubmitPracticeFormResponseRequest();
            response.setAnswers(List.of(answer));
            forms.submitResponse(id, tutor.getUsername(), response);
            var interpretation = new UpdatePracticeFormInterpretationRequest();
            interpretation.setInterpretation("Análisis cualitativo del resultado cuantitativo");
            forms.updateInterpretation(id, question.getId(), student.getUsername(), interpretation);
            em.flush(); em.clear();
            var saved = forms.getById(id, practiceTutor.getUsername()).getQuestions().get(0);
            assertThat(saved.getStudentInterpretation()).isEqualTo(interpretation.getInterpretation());
            assertThat(saved.getTabulation().getCounts()).containsEntry(type == PracticeFormQuestionType.NUMBER ? "0" : "No", 1L);
            assertThatThrownBy(() -> forms.updateInterpretation(id, question.getId(), tutor.getUsername(), interpretation))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Test void observationNumericTabulationSurvivesPersistenceAndCountsZero() {
        Long id = forms.createObservation(student.getUsername(), formRequest(PracticeFormTargetRole.STUDENT_SELF, PracticeFormQuestionType.NUMBER)).getId();
        var form = forms.getById(id, student.getUsername());
        PracticeFormAnswerRequest answer = new PracticeFormAnswerRequest();
        answer.setQuestionId(form.getQuestions().get(0).getId()); answer.setNumberAnswer(BigDecimal.ZERO);
        SubmitPracticeFormResponseRequest response = new SubmitPracticeFormResponseRequest(); response.setAnswers(List.of(answer));
        forms.submitResponse(id, student.getUsername(), response);
        em.flush(); em.clear();
        var tabulation = forms.getById(id, director.getUsername()).getQuestions().get(0).getTabulation();
        assertThat(tabulation.getNumericCount()).isEqualTo(1);
        assertThat(tabulation.getNumericAverage()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test void pdfUploadRejectsRenamedTextAndAcceptsAnActualPdf() throws Exception {
        Long id = plans.create(student.getUsername(), planRequest()).getId();
        var fake = new org.springframework.mock.web.MockMultipartFile("file", "fake.pdf", "application/pdf", "not a PDF".getBytes());
        assertThatThrownBy(() -> plans.uploadPdf(id, student.getUsername(), fake))
                .isInstanceOf(com.sgp.systemsgp.exception.BadRequestException.class);
        byte[] bytes;
        try (var pdf = new org.apache.pdfbox.pdmodel.PDDocument(); var output = new java.io.ByteArrayOutputStream()) {
            pdf.addPage(new org.apache.pdfbox.pdmodel.PDPage()); pdf.save(output); bytes = output.toByteArray();
        }
        var valid = new org.springframework.mock.web.MockMultipartFile("file", "plan.pdf", "application/pdf", bytes);
        plans.uploadPdf(id, student.getUsername(), valid);
        assertThat(plans.uploadedPdf(id, student.getUsername()).content()).isEqualTo(bytes);
    }

    @Test void methodSecurityRejectsForeignRolesOnAccountsAndCoordination() throws Exception {
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        mvc.perform(get("/api/reports/coordination")).andExpect(status().isUnauthorized());
        for (Account actor : List.of(student, tutor, practiceTutor, institutionDirector)) {
            String role = actor.getRoles().iterator().next().getName().replace("ROLE_", "");
            mvc.perform(get("/api/reports/coordination").with(user(actor.getUsername()).roles(role))).andExpect(status().isForbidden());
            mvc.perform(get("/api/account").with(user(actor.getUsername()).roles(role))).andExpect(status().isForbidden());
        }
        mvc.perform(get("/api/reports/coordination").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
        mvc.perform(get("/api/reports/coordination").with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isOk());
    }

    @Autowired com.sgp.systemsgp.config.JwtService jwt;
    @Autowired CustomUserDetailsService users;

    @Test void bearerAuthenticationRejectsRefreshTokensAndBlockedAccounts() throws Exception {
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        var details = users.loadUserByUsername(student.getUsername());
        String access = jwt.generateToken(details);
        mvc.perform(get("/api/account/me").header("Authorization", "Bearer " + access)).andExpect(status().isOk());
        mvc.perform(get("/api/account/me").header("Authorization", "Bearer " + jwt.generateRefreshToken(details))).andExpect(status().isUnauthorized());
        student.setLocked(true); em.flush();
        mvc.perform(get("/api/account/me").header("Authorization", "Bearer " + access)).andExpect(status().isForbidden());
    }

    private DidacticPlanRequest planRequest() {
        DidacticPlanRequest request = new DidacticPlanRequest(); request.setEnrollmentId(enrollment.getId());
        request.setPlanningUnitTitle("QA Unidad"); request.setLearningObjectives("Desarrollar pensamiento crítico"); return request;
    }
    private CreatePracticeFormRequest formRequest(PracticeFormTargetRole target, PracticeFormQuestionType type) {
        CreatePracticeFormQuestionRequest question = new CreatePracticeFormQuestionRequest();
        question.setPrompt("Pregunta QA"); question.setType(type); question.setRequired(true);
        CreatePracticeFormRequest request = new CreatePracticeFormRequest(); request.setEnrollmentId(enrollment.getId());
        request.setTargetRole(target); request.setTitle("Formulario QA"); request.setDraft(false); request.setQuestions(List.of(question)); return request;
    }
    private Account account(String username, RoleName roleName, Career career, AcademicCycle cycle, Institution school) {
        String name = roleName.name();
        Role role = em.createQuery("select r from Role r where r.name = :name", Role.class).setParameter("name", name)
                .getResultStream().findFirst().orElseGet(() -> persist(Role.builder().name(name).build()));
        Person person = persist(Person.builder().names(username).lastNames("QA").build());
        return persist(Account.builder().username(username).password("not-used-for-http-login").person(person)
                .roles(Set.of(role)).career(career).academicCycle(cycle).institution(school).build());
    }
    private <T> T persist(T entity) { em.persist(entity); return entity; }
}
