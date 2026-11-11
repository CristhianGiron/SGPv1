/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeWorkflowRegressionTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Practice Workflow Regression Test mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.didacticplan.DidacticPlanRequest;
import com.sgp.systemsgp.dto.practiceschedule.CreatePracticeScheduleRequest;
import com.sgp.systemsgp.dto.practiceschedule.PracticeSchedulePeriodRequest;
import com.sgp.systemsgp.enums.*;
import com.sgp.systemsgp.model.*;
import jakarta.persistence.EntityManager;
import javax.sql.DataSource;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.mock.web.MockMultipartFile;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Regressions for archived practices, inactive courses, attendance dates and form data.
@SpringBootTest(properties="debug=false")
@ActiveProfiles("test")
@Transactional
class PracticeWorkflowRegressionTest {
 @Autowired EntityManager em;
 @Autowired WebApplicationContext context;
 @Autowired DataSource dataSource;
 @Autowired EnrollmentService enrollmentService;
 @Autowired PracticeScheduleService schedules;
 @Autowired DidacticPlanService plans;
 MockMvc mvc;
 Account student,tutor,director,admin;
 Course course;
 Enrollment enrollment;
 @BeforeEach void setup(){
  Career career=save(Career.builder().name("Auditoría carrera").code("AUD-C").build());
  AcademicCycle cycle=save(AcademicCycle.builder().name("Auditoría ciclo").career(career).build());
  Institution school=save(Institution.builder().name("Auditoría escuela").code("AUD-E").type(InstitutionType.ESCUELA).build());
  student=actor("audit.student",RoleName.ROLE_ESTUDIANTE,career,cycle,school);
  tutor=actor("audit.tutor",RoleName.ROLE_TUTOR_INSTITUCIONAL,career,cycle,school);
  director=actor("audit.director",RoleName.ROLE_DIRECTOR_PRACTICAS,career,cycle,school);
  admin=actor("audit.admin",RoleName.ROLE_ADMIN,career,cycle,school);
  course=save(Course.builder().name("Auditoría paralelo").code("AUD-P").academicCycle(cycle).institutionalTutor(tutor).capacity(10).build());
  enrollment=save(Enrollment.builder().account(student).course(course).status(EnrollmentStatus.APPROVED).build());
  em.flush();mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
 }
 @Test void rejectsAttendanceOutsideScheduleDateRange() throws Exception {
  long id=schedule();
  mvc.perform(post("/api/practice-schedules/"+id+"/attendances").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))
   .contentType("application/json").content("{\"attendanceDate\":\"2027-01-04\",\"startTime\":\"08:00\",\"endTime\":\"10:00\",\"totalMinutes\":120,\"status\":\"PRESENT\"}"))
   .andExpect(status().isBadRequest());
 }
 @Test void rejectsAttendanceForAnArchivedPractice() throws Exception {
  long id=schedule();closePractice();
  mvc.perform(post("/api/practice-schedules/"+id+"/attendances").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))
   .contentType("application/json").content("{\"attendanceDate\":\"2026-11-02\",\"startTime\":\"08:00\",\"endTime\":\"10:00\",\"totalMinutes\":120,\"status\":\"PRESENT\"}"))
   .andExpect(status().isBadRequest());
 }
 @Test void rejectsDidacticPlanCreationForInactiveCourse() throws Exception {
  course.setActive(false);em.flush();
  mvc.perform(post("/api/didactic-plans").with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json")
   .content("{\"enrollmentId\":"+enrollment.getId()+",\"draft\":true,\"title\":\"Creación con paralelo inactivo\"}"))
   .andExpect(status().isBadRequest());
 }
 @Test void rejectsDidacticPlanUpdatesAfterPracticeIsArchived() throws Exception {
  DidacticPlanRequest request=new DidacticPlanRequest();request.setEnrollmentId(enrollment.getId());request.setDraft(true);request.setTitle("Borrador antes de concluir");
  long id=plans.create(student.getUsername(),request).getId();closePractice();
  mvc.perform(put("/api/didactic-plans/"+id).with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json")
   .content("{\"enrollmentId\":"+enrollment.getId()+",\"draft\":true,\"title\":\"Cambio dentro del archivo\"}"))
   .andExpect(status().isBadRequest());
 }
 @Test void rejectsTextUploadedAsAnEvidencePng() throws Exception {
  var file=new MockMultipartFile("file","texto.png","image/png","this is not image data".getBytes(java.nio.charset.StandardCharsets.UTF_8));
  mvc.perform(multipart("/api/practice-photos").file(file).param("enrollmentId",String.valueOf(enrollment.getId()))
   .param("description","Archivo que no es una imagen").with(user(student.getUsername()).roles("ESTUDIANTE")))
   .andExpect(status().isBadRequest());
 }
 @Test void flywayResolvesMigrationVersionsWithoutDuplicates(){
  assertDoesNotThrow(()->org.flywaydb.core.Flyway.configure().dataSource(dataSource).locations("classpath:db/migration").load().info());
 }
 @Test void allowsClearingOptionalPeriodCount() throws Exception {
  var request=new DidacticPlanRequest();request.setEnrollmentId(enrollment.getId());request.setDraft(true);request.setPeriods(4);request.setTitle("Plan con períodos");
  long id=plans.create(student.getUsername(),request).getId();
  mvc.perform(put("/api/didactic-plans/"+id).with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json")
   .content("{\"enrollmentId\":"+enrollment.getId()+",\"draft\":true,\"periods\":null}"))
   .andExpect(status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.periods").doesNotExist());
 }
 @Test void preservesOmittedOptionalValuesAndAcceptsZero() throws Exception {
  var request=new DidacticPlanRequest();request.setEnrollmentId(enrollment.getId());request.setDraft(true);
  request.setPeriods(4);request.setWeeks(3);request.setStartWeek(LocalDate.of(2026,11,2));request.setEndWeek(LocalDate.of(2026,11,9));
  long id=plans.create(student.getUsername(),request).getId();
  mvc.perform(put("/api/didactic-plans/"+id).with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json")
   .content("{\"enrollmentId\":"+enrollment.getId()+",\"draft\":true,\"periods\":0}"))
   .andExpect(status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.periods").value(0))
   .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.weeks").value(3));
  mvc.perform(put("/api/didactic-plans/"+id).with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json")
   .content("{\"enrollmentId\":"+enrollment.getId()+",\"draft\":true,\"weeks\":null,\"startWeek\":null,\"endWeek\":null}"))
   .andExpect(status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.weeks").doesNotExist())
   .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.startWeek").doesNotExist())
   .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.endWeek").doesNotExist());
 }
 private long schedule(){
  var period=new PracticeSchedulePeriodRequest();period.setDayOfWeek(DayOfWeek.MONDAY);period.setStartTime(LocalTime.of(8,0));period.setEndTime(LocalTime.of(10,0));
  var request=new CreatePracticeScheduleRequest();request.setEnrollmentId(enrollment.getId());request.setStartDate(LocalDate.of(2026,11,2));request.setEndDate(LocalDate.of(2026,11,9));request.setPeriods(List.of(period));
  return schedules.create(tutor.getUsername(),request).getId();
 }
 private void closePractice(){enrollmentService.complete(director.getUsername(),enrollment.getId());enrollmentService.archive(admin.getUsername(),enrollment.getId());em.flush();}
 private Account actor(String name,RoleName roleName,Career career,AcademicCycle cycle,Institution school){
  Role role=em.createQuery("select r from Role r where r.name=:name",Role.class).setParameter("name",roleName.name()).getResultStream().findFirst().orElseGet(()->save(Role.builder().name(roleName.name()).build()));
  Person person=save(Person.builder().names(name).lastNames("Auditoría").build());
  return save(Account.builder().username(name).password("fixture-not-for-login").person(person).roles(Set.of(role)).career(career).academicCycle(cycle).institution(school).build());
 }
 private <T>T save(T value){em.persist(value);return value;}
}
