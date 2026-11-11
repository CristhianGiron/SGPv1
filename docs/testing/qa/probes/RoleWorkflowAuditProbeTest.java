/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          RoleWorkflowAuditProbeTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Role Workflow Audit Probe Test mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.didacticplan.DidacticPlanRequest;
import com.sgp.systemsgp.dto.practiceschedule.*;
import com.sgp.systemsgp.dto.practiceform.*;
import com.sgp.systemsgp.enums.*;
import com.sgp.systemsgp.model.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import java.time.*;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Diagnostic probes: assertions describe observed behavior, including defects.
 * Kept outside src/test so a green diagnostic run cannot certify corrected rules.
 * Every test uses synthetic H2 data and rolls its transaction back.
 */
@SpringBootTest(properties="debug=false")
@ActiveProfiles("test")
@Transactional
class RoleWorkflowAuditProbeTest {
 @Autowired EntityManager em;
 @Autowired WebApplicationContext context;
 @Autowired PracticeScheduleService schedules;
 @Autowired DidacticPlanService plans;
 @Autowired NotificationService notifications;
 @Autowired PracticeFormService forms;
 @Autowired EnrollmentService enrollments;
 MockMvc mvc;
 Career career, foreignCareer;
 AcademicCycle cycle, foreignCycle;
 Institution university, foreignUniversity, school;
 Account student, tutor, practiceTutor, director, foreignDirector, admin;
 Course course;
 Enrollment enrollment;
 @BeforeEach void setup(){
  university=save(Institution.builder().name("Universidad local").code("UNL").type(InstitutionType.UNIVERSIDAD).build());
  foreignUniversity=save(Institution.builder().name("Otra universidad").code("RW-U2").type(InstitutionType.UNIVERSIDAD).build());
  career=save(Career.builder().name("Carrera local").code("RW-C1").faculty(save(Faculty.builder().name("Facultad local").code("RW-F1").institution(university).build())).build());
  foreignCareer=save(Career.builder().name("Otra carrera").code("RW-C2").faculty(save(Faculty.builder().name("Otra facultad").code("RW-F2").institution(foreignUniversity).build())).build());
  cycle=save(AcademicCycle.builder().name("Ciclo local").career(career).build());
  foreignCycle=save(AcademicCycle.builder().name("Otro ciclo").career(foreignCareer).build());
  school=save(Institution.builder().name("Escuela de prueba").code("RW-S").type(InstitutionType.ESCUELA).build());
  student=actor("rw.student",RoleName.ROLE_ESTUDIANTE,career,cycle,university);
  tutor=actor("rw.institutional",RoleName.ROLE_TUTOR_INSTITUCIONAL,career,cycle,school);
  practiceTutor=actor("rw.practice",RoleName.ROLE_TUTOR_PRACTICAS,career,cycle,university);
  director=actor("rw.director",RoleName.ROLE_DIRECTOR_PRACTICAS,career,cycle,university);
  foreignDirector=actor("rw.foreign",RoleName.ROLE_DIRECTOR_PRACTICAS,foreignCareer,foreignCycle,foreignUniversity);
  admin=actor("rw.admin",RoleName.ROLE_ADMIN,career,cycle,university);
  course=save(Course.builder().name("Paralelo de prueba").code("RW-P").academicCycle(cycle).institutionalTutor(tutor).practiceTutor(practiceTutor).capacity(10).build());
  enrollment=save(Enrollment.builder().account(student).course(course).status(EnrollmentStatus.APPROVED).build());
  em.flush();mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
 }
 @Test void H01_foreignDirectorCanReadL4ById() throws Exception {
  var doc=save(ActivityEvaluation.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).evaluatedBy(practiceTutor).build());em.flush();
  mvc.perform(get("/api/activity-evaluations/"+doc.getId()).with(user(foreignDirector.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
 }
 @Test void H01_foreignDirectorCanReadL5ById() throws Exception {
  var doc=save(PracticeFollowUpReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).reportedBy(practiceTutor).build());em.flush();
  mvc.perform(get("/api/practice-follow-up-reports/"+doc.getId()).with(user(foreignDirector.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
 }
 @Test void H02_foreignDirectorReceivesSubmissionNotificationWithStudentName(){
  var plan=save(ActivityPlan.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).studentFullName("Estudiante de otra carrera").status(ActivityPlanStatus.SUBMITTED).build());
  notifications.notifyActivityPlanSubmitted(plan);em.flush();
  assertThat(notifications.getMyNotifications(foreignDirector.getUsername())).anySatisfy(n->assertThat(n.getMessage()).contains("Estudiante de otra carrera"));
 }
 @Test void H02_institutionalTutorDoesNotReceiveL3SubmissionNotification(){
  var report=save(FinalReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(FinalReportStatus.SUBMITTED).build());
  notifications.notifyFinalReportSubmitted(report);em.flush();
  assertThat(notifications.getMyNotifications(practiceTutor.getUsername())).isNotEmpty();
  assertThat(notifications.getMyNotifications(tutor.getUsername())).isEmpty();
 }
 @Test void H03_directorCanReopenArchivedPracticeWithoutAdminUnarchiving() throws Exception {
  enrollment.setStatus(EnrollmentStatus.COMPLETED);enrollment.setArchived(true);enrollment.setArchivedAt(LocalDateTime.now());em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/reopen").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")))
   .andExpect(status().isOk()).andExpect(jsonPath("$.archived").value(false)).andExpect(jsonPath("$.status").value("APPROVED"));
 }
 @Test void H04_directorCanCompleteWithoutAnyPracticeDocument() throws Exception {
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/complete").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")))
   .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("COMPLETED"));
 }
 @Test void H05_reopeningInactiveCourseCreatesApprovedButNonOperationalPractice() throws Exception {
  enrollment.setStatus(EnrollmentStatus.COMPLETED);course.setActive(false);em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/reopen").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")))
   .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED")).andExpect(jsonPath("$.courseActive").value(false));
  mvc.perform(post("/api/didactic-plans").with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json")
   .content("{\"enrollmentId\":"+enrollment.getId()+",\"draft\":true}"))
   .andExpect(status().isBadRequest());
 }
 @Test void H06_rejectedStudentCannotApplyAgainToSameCourse() throws Exception {
  enrollment.setStatus(EnrollmentStatus.REJECTED);em.flush();
  mvc.perform(post("/api/courses/"+course.getId()+"/enroll").with(user(student.getUsername()).roles("ESTUDIANTE")))
   .andExpect(status().isBadRequest());
 }
 @Test void H07_duplicateAttendanceWithoutPeriodIsAcceptedAndDoublesMinutes() throws Exception {
  var period=new PracticeSchedulePeriodRequest();period.setDayOfWeek(DayOfWeek.MONDAY);period.setStartTime(LocalTime.of(8,0));period.setEndTime(LocalTime.of(10,0));
  var request=new CreatePracticeScheduleRequest();request.setEnrollmentId(enrollment.getId());request.setStartDate(LocalDate.of(2026,11,2));request.setEndDate(LocalDate.of(2026,11,9));request.setPeriods(List.of(period));
  long id=schedules.create(tutor.getUsername(),request).getId();
  String payload="{\"attendanceDate\":\"2026-11-02\",\"startTime\":\"08:00\",\"endTime\":\"10:00\",\"totalMinutes\":120,\"status\":\"PRESENT\"}";
  for(int i=0;i<2;i++)mvc.perform(post("/api/practice-schedules/"+id+"/attendances").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL")).contentType("application/json").content(payload)).andExpect(status().isOk());
  var rows=schedules.getById(id,tutor.getUsername()).getAttendances();
  assertThat(rows).hasSize(2);assertThat(rows.stream().mapToInt(a->a.getTotalMinutes()).sum()).isEqualTo(240);
 }
 @Test void H08_submittedInstitutionalPlanHasNoCorrectionRoute() throws Exception {
  var request=new DidacticPlanRequest();request.setEnrollmentId(enrollment.getId());request.setDraft(false);request.setPlanningUnitTitle("Unidad de prueba");
  long id=plans.create(tutor.getUsername(),request).getId();
  mvc.perform(put("/api/didactic-plans/"+id).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL")).contentType("application/json").content("{\"enrollmentId\":"+enrollment.getId()+",\"draft\":true,\"title\":\"Corrección\"}"))
   .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("enviada")));
  mvc.perform(patch("/api/didactic-plans/"+id+"/recommendations").with(user(admin.getUsername()).roles("ADMIN")).contentType("application/json").content("{\"recommendations\":\"Corregir\"}"))
   .andExpect(status().isForbidden());
 }
 @Test void H09_lockedCourseStillAllowsNewOperationalRecords() throws Exception {
  course.setLocked(true);em.flush();
  mvc.perform(post("/api/didactic-plans").with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json")
   .content("{\"enrollmentId\":"+enrollment.getId()+",\"draft\":true}"))
   .andExpect(status().isOk());
 }
 @Test void H10_otherUniversityCannotAssignItsOwnPracticeTutor() throws Exception {
  var otherTutor=actor("rw.other-tutor",RoleName.ROLE_TUTOR_PRACTICAS,foreignCareer,foreignCycle,foreignUniversity);
  var otherCourse=save(Course.builder().name("Otro paralelo").code("RW-P2").academicCycle(foreignCycle).capacity(10).build());em.flush();
  mvc.perform(patch("/api/courses/"+otherCourse.getId()+"/practice-tutor/"+otherTutor.getId()).with(user(admin.getUsername()).roles("ADMIN")))
   .andExpect(status().isBadRequest());
 }
 @Test void H11_answeredInterviewDisappearsFromAssignedHistory(){
  var head=actor("rw.school-director",RoleName.ROLE_DIRECTORA_INSTITUCION,career,cycle,school);
  var question=new CreatePracticeFormQuestionRequest();question.setPrompt("¿Autoriza la observación?");question.setType(PracticeFormQuestionType.YES_NO);question.setRequired(true);
  var request=new CreatePracticeFormRequest();request.setEnrollmentId(enrollment.getId());request.setTargetRole(PracticeFormTargetRole.INSTITUTION_DIRECTOR);request.setTitle("Entrevista institucional");request.setDraft(false);request.setQuestions(List.of(question));
  long id=forms.create(student.getUsername(),request).getId();
  assertThat(forms.assignedForms(head.getUsername())).hasSize(1);
  var response=new SubmitPracticeFormResponseRequest();var answer=new PracticeFormAnswerRequest();answer.setQuestionId(forms.getById(id,head.getUsername()).getQuestions().get(0).getId());answer.setBooleanAnswer(true);response.setAnswers(List.of(answer));
  forms.submitResponse(id,head.getUsername(),response);em.flush();
  assertThat(forms.assignedForms(head.getUsername())).isEmpty();
  assertThat(forms.getById(id,head.getUsername()).getStatus()).isEqualTo(PracticeFormStatus.ANSWERED);
 }
 @Test void H12_displayedImplicitGroupIsNotAnActualTutorAssignment(){
  course.setInstitutionalTutor(null);
  var group=save(CourseGroup.builder().name("Único grupo activo").course(course).institutionalTutor(tutor).active(true).build());em.flush();
  var shown=enrollments.myEnrollments(student.getUsername()).get(0);
  assertThat(shown.getGroupId()).isEqualTo(group.getId());
  assertThat(shown.getInstitutionalTutor()).isNotBlank();
  assertThat(InstitutionalAssignmentResolver.institutionalTutor(enrollment)).isNull();
  assertThat(enrollments.managedEnrollments(tutor.getUsername())).isEmpty();
 }
 @Test void H13_courseTutorSeesAnotherGroupsScheduleInListButCannotOpenIt() throws Exception {
  var assigned=actor("rw.new-tutor",RoleName.ROLE_TUTOR_INSTITUCIONAL,career,cycle,school);
  enrollment.setGroup(save(CourseGroup.builder().name("Grupo reasignado").course(course).institutionalTutor(assigned).active(true).build()));
  var schedule=save(PracticeSchedule.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).scheduledBy(assigned).build());em.flush();
  mvc.perform(get("/api/practice-schedules/managed").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL")))
   .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(schedule.getId()));
  mvc.perform(get("/api/practice-schedules/"+schedule.getId()).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isForbidden());
 }
 @Test void H13_courseTutorSeesAnotherGroupsL3InListButCannotOpenIt() throws Exception {
  var assigned=actor("rw.new-tutor",RoleName.ROLE_TUTOR_INSTITUCIONAL,career,cycle,school);
  enrollment.setGroup(save(CourseGroup.builder().name("Grupo reasignado").course(course).institutionalTutor(assigned).active(true).build()));
  var report=save(FinalReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(FinalReportStatus.SUBMITTED).build());em.flush();
  mvc.perform(get("/api/final-reports/institutional-review").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL")))
   .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(report.getId()));
  mvc.perform(get("/api/final-reports/"+report.getId()).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isForbidden());
 }
 private Account actor(String name,RoleName roleName,Career assignedCareer,AcademicCycle assignedCycle,Institution institution){
  Role role=em.createQuery("select r from Role r where r.name=:name",Role.class).setParameter("name",roleName.name()).getResultStream().findFirst().orElseGet(()->save(Role.builder().name(roleName.name()).build()));
  Person person=save(Person.builder().names(name).lastNames("Auditoría").build());
  return save(Account.builder().username(name).password("fixture-not-for-login").person(person).roles(Set.of(role)).career(assignedCareer).academicCycle(assignedCycle).institution(institution).build());
 }
 private <T>T save(T value){em.persist(value);return value;}
}
