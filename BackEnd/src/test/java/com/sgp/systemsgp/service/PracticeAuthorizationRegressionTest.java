/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeAuthorizationRegressionTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de la autenticación de usuarios mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.enums.ActivityPlanStatus;
import com.sgp.systemsgp.enums.CompletedActivityRecordStatus;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.FinalReportStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.PracticeReportStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.ActivityEvaluation;
import com.sgp.systemsgp.model.ActivityPlan;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.CompletedActivityRecord;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.CourseGroup;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Faculty;
import com.sgp.systemsgp.model.FinalReport;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.PracticeFollowUpReport;
import com.sgp.systemsgp.model.PracticePhoto;
import com.sgp.systemsgp.model.PracticeReport;
import com.sgp.systemsgp.model.PracticeSchedule;
import com.sgp.systemsgp.model.Role;

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

/** Authorization regressions for audit findings H01, H02, H12 and H13. */
@SpringBootTest(properties="debug=false")
@ActiveProfiles("test")
@Transactional
class PracticeAuthorizationRegressionTest {
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

 @Test void directorsCanReadL4AndL5OnlyWithinTheirCareerIncludingPdf() throws Exception {
  var l4=save(ActivityEvaluation.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).evaluatedBy(practiceTutor).build());
  var l5=save(PracticeFollowUpReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).reportedBy(practiceTutor).build());em.flush();
  for(String path:List.of("activity-evaluations/"+l4.getId(),"practice-follow-up-reports/"+l5.getId())) {
   for(String suffix:List.of("","/pdf","/pdf/preview")) {
    mvc.perform(get("/api/"+path+suffix).with(user(foreignDirector.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isForbidden());
    mvc.perform(get("/api/"+path+suffix).with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
    mvc.perform(get("/api/"+path+suffix).with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isOk());
   }
  }
 }
 @Test void allStudentDocumentSubmissionsNotifyOnlyScopedManagersAndAssignedTutor(){
  var l2=save(ActivityPlan.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(ActivityPlanStatus.SUBMITTED).build());
  var l1=save(PracticeReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(PracticeReportStatus.SUBMITTED).build());
  var l6=save(CompletedActivityRecord.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(CompletedActivityRecordStatus.SUBMITTED).build());
  notifications.notifyActivityPlanSubmitted(l2);notifications.notifyPracticeReportSubmitted(l1);notifications.notifyCompletedActivityRecordSubmitted(l6);em.flush();
  assertThat(notifications.getMyNotifications(foreignDirector.getUsername())).isEmpty();
  for(Account viewer:List.of(director,admin,practiceTutor))assertThat(notifications.getMyNotifications(viewer.getUsername())).hasSize(3);
  assertThat(notifications.getMyNotifications(tutor.getUsername())).isEmpty();
 }
 @Test void pendingEnrollmentNoticesStayWithinTheCareer(){
  notifications.notifyEnrollmentPending(enrollment);em.flush();
  assertThat(notifications.getMyNotifications(foreignDirector.getUsername())).isEmpty();
  assertThat(notifications.getMyNotifications(director.getUsername())).hasSize(1);
  assertThat(notifications.getMyNotifications(admin.getUsername())).hasSize(1);
 }
 @Test void l3NotifiesTheEffectiveGroupTutorInsteadOfTheFallbackTutor(){
  var assigned=assignDifferentGroupTutor();
  var report=save(FinalReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(FinalReportStatus.SUBMITTED).build());
  notifications.notifyFinalReportSubmitted(report);em.flush();
  assertThat(notifications.getMyNotifications(assigned.getUsername())).hasSize(1);
  assertThat(notifications.getMyNotifications(tutor.getUsername())).isEmpty();
  assertThat(notifications.getMyNotifications(foreignDirector.getUsername())).isEmpty();
  for(Account viewer:List.of(director,admin,practiceTutor))assertThat(notifications.getMyNotifications(viewer.getUsername())).hasSize(1);
 }
 @Test void l3UsesCourseTutorWhenNoGroupTutorIsAssigned(){
  var report=save(FinalReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(FinalReportStatus.SUBMITTED).build());
  notifications.notifyFinalReportSubmitted(report);em.flush();
  assertThat(notifications.getMyNotifications(tutor.getUsername())).hasSize(1);
 }
 @Test void disabledResponsibleDoesNotReceiveANotification(){
  tutor.setEnabled(false);director.setLocked(true);em.flush();
  var report=save(FinalReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(FinalReportStatus.SUBMITTED).build());
  notifications.notifyFinalReportSubmitted(report);em.flush();
  assertThat(notifications.getMyNotifications(tutor.getUsername())).isEmpty();
  assertThat(notifications.getMyNotifications(director.getUsername())).isEmpty();
  assertThat(notifications.getMyNotifications(admin.getUsername())).hasSize(1);
 }
 @Test void anUnassignedSingleGroupIsNotShownOrUsedForAuthorization(){
  course.setInstitutionalTutor(null);
  save(CourseGroup.builder().name("Único grupo activo").course(course).institutionalTutor(tutor).active(true).build());em.flush();
  var shown=enrollments.myEnrollments(student.getUsername()).get(0);
  assertThat(shown.getGroupId()).isNull();assertThat(shown.getGroupName()).isNull();
  assertThat(shown.getInstitutionalTutor()).isNull();assertThat(shown.getEducationalInstitutionId()).isNull();
  assertThat(InstitutionalAssignmentResolver.institutionalTutor(enrollment)).isNull();
  assertThat(enrollments.managedEnrollments(tutor.getUsername())).isEmpty();
 }
 @Test void displayedTutorAndInstitutionMatchTheExplicitAssignment(){
  var assigned=assignDifferentGroupTutor();em.flush();
  var shown=enrollments.myEnrollments(student.getUsername()).get(0);
  assertThat(shown.getGroupId()).isEqualTo(enrollment.getGroup().getId());
  assertThat(shown.getInstitutionalTutor()).isEqualTo(assigned.getPerson().getNames()+" "+assigned.getPerson().getLastNames());
  assertThat(shown.getEducationalInstitutionId()).isEqualTo(school.getId());
  assertThat(enrollments.managedEnrollments(assigned.getUsername())).hasSize(1);
  assertThat(enrollments.managedEnrollments(tutor.getUsername())).isEmpty();
 }
 @Test void scheduleListsAndDetailsApplyTheSameEffectiveTutor() throws Exception {
  var assigned=assignDifferentGroupTutor();
  var schedule=save(PracticeSchedule.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).scheduledBy(assigned).build());em.flush();
  mvc.perform(get("/api/practice-schedules/managed").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
  mvc.perform(get("/api/practice-schedules/"+schedule.getId()).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isForbidden());
  mvc.perform(get("/api/practice-schedules/managed").with(user(assigned.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(schedule.getId()));
  mvc.perform(get("/api/practice-schedules/"+schedule.getId()).with(user(assigned.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk());
 }
 @Test void l3FullAndSummaryQueuesExcludeAnotherGroupsRecords() throws Exception {
  var assigned=assignDifferentGroupTutor();
  var report=save(FinalReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(FinalReportStatus.SUBMITTED).build());em.flush();
  for(String suffix:List.of("","/summary")){
   mvc.perform(get("/api/final-reports/institutional-review"+suffix).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
   mvc.perform(get("/api/final-reports/institutional-review"+suffix).with(user(assigned.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(report.getId()));
  }
  mvc.perform(get("/api/final-reports/"+report.getId()).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isForbidden());
  mvc.perform(get("/api/final-reports/"+report.getId()).with(user(assigned.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk());
 }
 @Test void photoQueueDoesNotExposeMetadataOrPublicLinksFromAnotherGroup() throws Exception {
  var assigned=assignDifferentGroupTutor();
  var photo=save(PracticePhoto.builder().enrollment(enrollment).student(student).course(course).uploadedBy(student).originalFilename("fixture.png").contentType("image/png").fileSize(1L).data(new byte[]{1}).build());em.flush();
  mvc.perform(get("/api/practice-photos/review").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
  mvc.perform(get("/api/practice-photos/"+photo.getId()).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isForbidden());
  mvc.perform(get("/api/practice-photos/review").with(user(assigned.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(photo.getId()));
 }
 @Test void courseTutorFallbackRetainsListsWhenTheGroupHasNoTutor() throws Exception {
  enrollment.setGroup(save(CourseGroup.builder().name("Grupo sin tutor propio").course(course).active(true).build()));
  var schedule=save(PracticeSchedule.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).scheduledBy(tutor).build());
  var report=save(FinalReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(FinalReportStatus.SUBMITTED).build());em.flush();
  mvc.perform(get("/api/practice-schedules/managed").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(schedule.getId()));
  mvc.perform(get("/api/final-reports/institutional-review/summary").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(report.getId()));
 }
 private Account assignDifferentGroupTutor(){
  var assigned=actor("rw.new-tutor",RoleName.ROLE_TUTOR_INSTITUCIONAL,career,cycle,school);
  enrollment.setGroup(save(CourseGroup.builder().name("Grupo reasignado").course(course).institutionalTutor(assigned).active(true).build()));
  return assigned;
 }
 private Account actor(String name,RoleName roleName,Career assignedCareer,AcademicCycle assignedCycle,Institution institution){
  Role role=em.createQuery("select r from Role r where r.name=:name",Role.class).setParameter("name",roleName.name()).getResultStream().findFirst().orElseGet(()->save(Role.builder().name(roleName.name()).build()));
  Person person=save(Person.builder().names(name).lastNames("Auditoría").build());
  return save(Account.builder().username(name).password("fixture-not-for-login").person(person).roles(Set.of(role)).career(assignedCareer).academicCycle(assignedCycle).institution(institution).build());
 }
 private <T>T save(T value){em.persist(value);return value;}
}
