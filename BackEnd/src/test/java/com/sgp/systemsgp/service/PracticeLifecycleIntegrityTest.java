/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeLifecycleIntegrityTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Practice Lifecycle Integrity Test mediante pruebas de regresión.
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

/** Lifecycle and attendance regressions for audit findings H03, H05 and H07. */
@SpringBootTest(properties="debug=false")
@ActiveProfiles("test")
@Transactional
class PracticeLifecycleIntegrityTest {
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
  save(CourseStudentMembership.builder().course(course).student(student).active(true).assignedAt(LocalDateTime.now()).build());
  em.flush();mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
 }


 @Test void directorCannotReopenAnArchivedPractice() throws Exception {
  enrollment.setStatus(EnrollmentStatus.COMPLETED);enrollment.setArchived(true);enrollment.setArchivedAt(LocalDateTime.now());em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/reopen").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")))
   .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("desarchivar")));
  assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.COMPLETED);assertThat(enrollment.isArchived()).isTrue();
 }
 @Test void administratorMustUnarchiveBeforeDirectorReopens() throws Exception {
  enrollment.setStatus(EnrollmentStatus.COMPLETED);enrollment.setArchived(true);em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/unarchive").with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isOk());
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/reopen").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED"));
 }
 @Test void reopeningRequiresAnActiveCourse() throws Exception {assertUnavailableCoursePreventsReopening("inactive");}
 @Test void reopeningDoesNotRequireOpeningNewEnrollmentRequests() throws Exception {
  enrollment.setStatus(EnrollmentStatus.COMPLETED);course.setLocked(true);em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/reopen").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
 }
 @Test void reopeningRequiresANotDeletedCourse() throws Exception {assertUnavailableCoursePreventsReopening("deleted");}
 private void assertUnavailableCoursePreventsReopening(String flag) throws Exception {
  enrollment.setStatus(EnrollmentStatus.COMPLETED);
  if(flag.equals("inactive"))course.setActive(false);if(flag.equals("locked"))course.setLocked(true);if(flag.equals("deleted"))course.setDeleted(true);em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/reopen").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isBadRequest());
  assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.COMPLETED);
 }
 @Test void reopeningDoesNotExceedCourseCapacity() throws Exception {
  enrollment.setStatus(EnrollmentStatus.COMPLETED);course.setCapacity(1);
  var other=actor("rw.other-student",RoleName.ROLE_ESTUDIANTE,career,cycle,university);
  save(Enrollment.builder().account(other).course(course).status(EnrollmentStatus.APPROVED).build());em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/reopen").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isBadRequest());
 }
 @Test void reopeningDoesNotExceedGroupCapacity() throws Exception {
  enrollment.setStatus(EnrollmentStatus.COMPLETED);
  var group=save(CourseGroup.builder().name("Grupo lleno").course(course).institutionalTutor(tutor).capacity(1).active(true).build());enrollment.setGroup(group);
  var other=actor("rw.other-student",RoleName.ROLE_ESTUDIANTE,career,cycle,university);save(Enrollment.builder().account(other).course(course).group(group).status(EnrollmentStatus.APPROVED).build());em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/reopen").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isBadRequest());
 }
 @Test void reopeningRejectsAnUnavailableAssignedGroup() throws Exception {
  enrollment.setStatus(EnrollmentStatus.COMPLETED);enrollment.setGroup(save(CourseGroup.builder().name("Grupo inactivo").course(course).institutionalTutor(tutor).active(false).build()));em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/reopen").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isBadRequest());
 }
 @Test void reopenedPracticeAllowsOperationalWork() throws Exception {
  enrollment.setStatus(EnrollmentStatus.COMPLETED);em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/reopen").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
  mvc.perform(post("/api/didactic-plans").with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json").content("{\"enrollmentId\":"+enrollment.getId()+",\"draft\":true}")).andExpect(status().isOk());
 }
 @Test void identicalUnboundAttendanceCannotBeCountedTwice() throws Exception {
  long id=schedule();postAttendance(id,"08:00","10:00",null,200);postAttendance(id,"08:00","10:00",null,400);
  var rows=schedules.getById(id,tutor.getUsername()).getAttendances();assertThat(rows).hasSize(1);assertThat(rows.get(0).getTotalMinutes()).isEqualTo(120);
 }
 @Test void overlappingAttendanceWithoutPeriodIsRejected() throws Exception {
  long id=schedule();postAttendance(id,"08:00","10:00",null,200);postAttendance(id,"09:00","11:00",null,400);
 }
 @Test void overlapCannotBeHiddenByChoosingAnotherPeriod() throws Exception {
  long id=schedule();long period=schedules.getById(id,tutor.getUsername()).getPeriods().get(0).getId();
  postAttendance(id,"08:00","10:00",period,200);postAttendance(id,"09:00","11:00",null,400);
 }
 @Test void adjacentAndDifferentDayAttendancesRemainAllowed() throws Exception {
  long id=schedule();postAttendance(id,"08:00","10:00",null,200);postAttendance(id,"10:00","11:00",null,200);
  mvc.perform(post("/api/practice-schedules/"+id+"/attendances").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL")).contentType("application/json").content("{\"attendanceDate\":\"2026-11-03\",\"startTime\":\"08:00\",\"endTime\":\"10:00\",\"status\":\"PRESENT\"}")).andExpect(status().isOk());
  assertThat(schedules.getById(id,tutor.getUsername()).getAttendances()).hasSize(3);
 }
 @Test void attendanceUpdateExcludesItselfButCannotOverlapAnotherRow() throws Exception {
  long id=schedule();postAttendance(id,"08:00","10:00",null,200);postAttendance(id,"10:00","12:00",null,200);
  long attendanceId=schedules.getById(id,tutor.getUsername()).getAttendances().get(0).getId();
  mvc.perform(put("/api/practice-schedules/"+id+"/attendances/"+attendanceId).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL")).contentType("application/json").content(attendanceJson("08:00","10:00",null))).andExpect(status().isOk());
  mvc.perform(put("/api/practice-schedules/"+id+"/attendances/"+attendanceId).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL")).contentType("application/json").content(attendanceJson("09:00","11:00",null))).andExpect(status().isBadRequest());
 }
 @Test void assignedPracticeTutorCanCloseEnrollmentWhileExistingPracticeContinues() throws Exception {
  mvc.perform(patch("/api/courses/"+course.getId()+"/lock").with(user(practiceTutor.getUsername()).roles("TUTOR_PRACTICAS"))).andExpect(status().isOk());
  var applicant=actor("rw.applicant",RoleName.ROLE_ESTUDIANTE,career,cycle,university);save(CourseStudentMembership.builder().course(course).student(applicant).assignedAt(LocalDateTime.now()).build());em.flush();
  mvc.perform(post("/api/courses/"+course.getId()+"/enroll").with(user(applicant.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
  mvc.perform(post("/api/didactic-plans").with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json").content("{\"enrollmentId\":"+enrollment.getId()+",\"draft\":true}")).andExpect(status().isOk());
  mvc.perform(patch("/api/courses/"+course.getId()+"/unlock").with(user(practiceTutor.getUsername()).roles("TUTOR_PRACTICAS"))).andExpect(status().isOk());
  mvc.perform(post("/api/courses/"+course.getId()+"/enroll").with(user(applicant.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
 }
 @Test void closingEnrollmentDoesNotPreventResolvingExistingPendingRequestsOrAssigningGroups() throws Exception {
  course.setLocked(true);enrollment.setStatus(EnrollmentStatus.PENDING);em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/approve").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
  var group=save(CourseGroup.builder().name("Grupo activo").course(course).institutionalTutor(tutor).active(true).build());em.flush();
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/group/"+group.getId()).with(user(practiceTutor.getUsername()).roles("TUTOR_PRACTICAS"))).andExpect(status().isOk());
 }
 @Test void practiceTutorCannotCloseOtherCoursesOrAdministerTheirActivity() throws Exception {
  var outsider=actor("rw.unassigned-tutor",RoleName.ROLE_TUTOR_PRACTICAS,career,cycle,university);em.flush();
  mvc.perform(patch("/api/courses/"+course.getId()+"/lock").with(user(outsider.getUsername()).roles("TUTOR_PRACTICAS"))).andExpect(status().isBadRequest());
  mvc.perform(patch("/api/courses/"+course.getId()+"/disable").with(user(practiceTutor.getUsername()).roles("TUTOR_PRACTICAS"))).andExpect(status().isForbidden());
  assertThat(course.isLocked()).isFalse();assertThat(course.isActive()).isTrue();
 }
 @Test void manualCompletionWarnsAboutMissingDocumentsAndHoursButDoesNotBlockDirector() throws Exception {
  mvc.perform(get("/api/enrollments/"+enrollment.getId()+"/completion-summary").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")))
   .andExpect(status().isOk()).andExpect(jsonPath("$.warnings",org.hamcrest.Matchers.hasItem("L.1: documento sin registrar.")))
   .andExpect(jsonPath("$.warnings",org.hamcrest.Matchers.hasItem("L.6 no acredita un total positivo de horas aprobado.")));
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/complete").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());em.flush();
  var log=em.createQuery("select a from PracticeAuditLog a where a.enrollment.id=:id",PracticeAuditLog.class).setParameter("id",enrollment.getId()).getResultList();
  assertThat(log).anySatisfy(a->assertThat(a.getDetails()).contains("Cierre manual", "L.1: documento sin registrar."));
 }
 @Test void completionSummaryCannotExposeAnotherCareerOrBeRequestedByStudent() throws Exception {
  mvc.perform(get("/api/enrollments/"+enrollment.getId()+"/completion-summary").with(user(foreignDirector.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isForbidden());
  mvc.perform(get("/api/enrollments/"+enrollment.getId()+"/completion-summary").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
 }
 @Test void expiredDevelopmentPeriodIsAnAdvisoryFactNotAnAutomaticClosure() throws Exception {
  course.setEndDate(LocalDateTime.of(2026,1,1,0,0));em.flush();
  mvc.perform(get("/api/enrollments/"+enrollment.getId()+"/completion-summary").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk()).andExpect(jsonPath("$.periodEnded").value(true));
  assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.APPROVED);
 }
 @Test void completionSummaryDistinguishesApprovedHoursAndDetectsDiscrepancies() throws Exception {
  save(CompletedActivityRecord.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(CompletedActivityRecordStatus.APPROVED).totalMinutes(120).build());
  save(FinalReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(FinalReportStatus.APPROVED).completedPracticeMinutes(180).build());em.flush();
  mvc.perform(get("/api/enrollments/"+enrollment.getId()+"/completion-summary").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")))
   .andExpect(status().isOk()).andExpect(jsonPath("$.approvedRecordMinutes").value(120)).andExpect(jsonPath("$.institutionalReportMinutes").value(180))
   .andExpect(jsonPath("$.warnings",org.hamcrest.Matchers.hasItem("Las horas aprobadas de L.3 y L.6 no coinciden.")));
 }
 private long schedule(){
  var period=new PracticeSchedulePeriodRequest();period.setDayOfWeek(DayOfWeek.MONDAY);period.setStartTime(LocalTime.of(8,0));period.setEndTime(LocalTime.of(12,0));
  var request=new CreatePracticeScheduleRequest();request.setEnrollmentId(enrollment.getId());request.setStartDate(LocalDate.of(2026,11,2));request.setEndDate(LocalDate.of(2026,11,9));request.setPeriods(List.of(period));
  return schedules.create(tutor.getUsername(),request).getId();
 }
 private void postAttendance(long scheduleId,String start,String end,Long periodId,int expectedStatus) throws Exception {
  mvc.perform(post("/api/practice-schedules/"+scheduleId+"/attendances").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL")).contentType("application/json").content(attendanceJson(start,end,periodId))).andExpect(status().is(expectedStatus));
 }
 private String attendanceJson(String start,String end,Long periodId){
  return "{\"attendanceDate\":\"2026-11-02\",\"startTime\":\""+start+"\",\"endTime\":\""+end+"\",\"status\":\"PRESENT\""+(periodId==null?"":",\"schedulePeriodId\":"+periodId)+"}";
 }
 private Account actor(String name,RoleName roleName,Career assignedCareer,AcademicCycle assignedCycle,Institution institution){
  Role role=em.createQuery("select r from Role r where r.name=:name",Role.class).setParameter("name",roleName.name()).getResultStream().findFirst().orElseGet(()->save(Role.builder().name(roleName.name()).build()));
  Person person=save(Person.builder().names(name).lastNames("Auditoría").build());
  return save(Account.builder().username(name).password("fixture-not-for-login").person(person).roles(Set.of(role)).career(assignedCareer).academicCycle(assignedCycle).institution(institution).build());
 }
 private <T>T save(T value){em.persist(value);return value;}
}
