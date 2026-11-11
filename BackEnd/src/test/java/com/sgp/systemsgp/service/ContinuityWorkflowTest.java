/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ContinuityWorkflowTest.java
 * @fecha         2026-11-10 21:24:04
 * @nota          Comprueba el comportamiento de el módulo Continuity Workflow Test mediante pruebas de regresión.
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

/** Academic membership and simultaneous practice enrollment rules. */
@SpringBootTest(properties="debug=false")
@ActiveProfiles("test")
@Transactional
class ContinuityWorkflowTest {
 @Autowired EntityManager em;
 @Autowired WebApplicationContext context;
 @Autowired PracticeScheduleService schedules;
 @Autowired DidacticPlanService plans;
 @Autowired NotificationService notifications;
 @Autowired PracticeFormService forms;
 @Autowired EnrollmentService enrollments;
 @Autowired AuthSessionService sessions;
 @Autowired com.sgp.systemsgp.config.JwtService jwt;
 @Autowired org.springframework.security.crypto.password.PasswordEncoder passwords;
 @Autowired AccountService accountService;

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



 private DidacticPlan submittedPlan(){
  return save(DidacticPlan.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school)
    .author(tutor).authorType(DidacticPlanAuthorType.INSTITUTIONAL_TUTOR).title("Versión original")
    .status(DidacticPlanStatus.SUBMITTED).build());
 }
 private void returnPlan(DidacticPlan plan,Account actor,String role,int status,String reason)throws Exception{
  em.flush();mvc.perform(patch("/api/didactic-plans/"+plan.getId()+"/return").with(user(actor.getUsername()).roles(role)).contentType("application/json").content("{\"reason\":\""+reason+"\"}")).andExpect(status().is(status));
 }
 @Test void institutionalReturnPreservesSnapshotAndPdfAndAllowsAuthorCorrection()throws Exception{
  var plan=submittedPlan();plan.setUploadedPdf("immutable-original-pdf".getBytes());plan.setUploadedPdfFilename("original.pdf");plan.setUploadedPdfContentType("application/pdf");
  plan.getWeekPlans().add(DidacticPlanWeek.builder().plan(plan).weekNumber(1).contents("Contenido original").build());
  returnPlan(plan,practiceTutor,"TUTOR_PRACTICAS",200,"Precisar objetivos y fechas");
  assertThat(em.find(DidacticPlan.class,plan.getId()).getStatus()).isEqualTo(DidacticPlanStatus.NEEDS_CORRECTION);
  var change=new DidacticPlanRequest();change.setTitle("Versión corregida");change.setDraft(true);plans.update(plan.getId(),tutor.getUsername(),change);
  mvc.perform(get("/api/didactic-plans/"+plan.getId()+"/revisions").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].reason").value("Precisar objetivos y fechas"));
  var revision=em.createQuery("select r from DidacticPlanRevision r where r.plan.id=:id",DidacticPlanRevision.class).setParameter("id",plan.getId()).getSingleResult();
  mvc.perform(get("/api/didactic-plans/"+plan.getId()+"/revisions/"+revision.getId()).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Versión original")).andExpect(jsonPath("$.status").value("SUBMITTED")).andExpect(jsonPath("$.weekPlans[0].contents").value("Contenido original"));
  mvc.perform(get("/api/didactic-plans/"+plan.getId()+"/revisions/"+revision.getId()+"/pdf").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(content().bytes("immutable-original-pdf".getBytes()));
  assertThat(em.find(DidacticPlan.class,plan.getId()).getTitle()).isEqualTo("Versión corregida");
 }
 @Test void onlyAssignedPracticeTutorOrCareerDirectorCanReturnInstitutionalPlan()throws Exception{
  var plan=submittedPlan();returnPlan(plan,student,"ESTUDIANTE",403,"No autorizado");returnPlan(plan,tutor,"TUTOR_INSTITUCIONAL",403,"No auto-devolver");returnPlan(plan,foreignDirector,"DIRECTOR_PRACTICAS",403,"Otra carrera");
  var foreignTutor=actor("continuity.other-tutor",RoleName.ROLE_TUTOR_PRACTICAS,career,cycle,university);returnPlan(plan,foreignTutor,"TUTOR_PRACTICAS",403,"Otro tutor");
  returnPlan(plan,director,"DIRECTOR_PRACTICAS",200,"Corregir el alcance");
 }
 @Test void returnRequiresReasonSubmittedInstitutionalPlanAndOperationalPractice()throws Exception{
  var plan=submittedPlan();returnPlan(plan,director,"DIRECTOR_PRACTICAS",400," ");
  plan.setStatus(DidacticPlanStatus.DRAFT);returnPlan(plan,director,"DIRECTOR_PRACTICAS",400,"Falta enviar");
  plan.setStatus(DidacticPlanStatus.SUBMITTED);enrollment.setStatus(EnrollmentStatus.COMPLETED);returnPlan(plan,director,"DIRECTOR_PRACTICAS",400,"Expediente concluido");
 }
 @Test void revisionHistoryDoesNotExposeAnotherCareersPractice()throws Exception{
  var plan=submittedPlan();returnPlan(plan,director,"DIRECTOR_PRACTICAS",200,"Corregir");
  mvc.perform(get("/api/didactic-plans/"+plan.getId()+"/revisions").with(user(foreignDirector.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isForbidden());
 }
 @Test void answeredInterviewRemainsAssignedToExactlyItsRecipient()throws Exception{
  var form=save(StudentPracticeForm.builder().enrollment(enrollment).student(student).educationalInstitution(school).targetAccount(tutor)
   .targetRole(PracticeFormTargetRole.INSTITUTIONAL_TUTOR).formKind(PracticeFormKind.INTERVIEW).status(PracticeFormStatus.ANSWERED).title("Entrevista respondida").build());em.flush();
  mvc.perform(get("/api/practice-forms/assigned").with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(form.getId()));
  mvc.perform(get("/api/practice-forms/assigned").with(user(practiceTutor.getUsername()).roles("TUTOR_PRACTICAS"))).andExpect(status().isForbidden());
  assertThat(forms.assignedForms(director.getUsername())).isEmpty();
 }
 @Test void refreshRotatesSecretAndRejectsOldRefreshAndAccessAsRefresh()throws Exception{
  var original=sessions.create(student.getUsername());var renewed=sessions.refresh(original.getRefreshToken());
  assertThat(renewed.getRefreshToken()).isNotEqualTo(original.getRefreshToken());
  org.assertj.core.api.Assertions.assertThatThrownBy(()->sessions.refresh(original.getRefreshToken())).isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class);
  org.assertj.core.api.Assertions.assertThatThrownBy(()->sessions.refresh(renewed.getAccessToken())).isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class);
  mvc.perform(get("/api/account/me").header("Authorization","Bearer "+renewed.getAccessToken())).andExpect(status().isOk());
  var stored=em.find(AuthSession.class,jwt.extractClaims(renewed.getAccessToken()).get("sid",String.class));
  assertThat(stored.getRefreshHash()).hasSize(64).isNotEqualTo(renewed.getRefreshToken());
 }
 @Test void logoutRevokesCurrentSessionButLeavesOtherDevicesValid()throws Exception{
  var first=sessions.create(student.getUsername());var other=sessions.create(student.getUsername());
  mvc.perform(post("/api/auth/logout").header("Authorization","Bearer "+first.getAccessToken())).andExpect(status().isOk());
  mvc.perform(get("/api/account/me").header("Authorization","Bearer "+first.getAccessToken())).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/account/me").header("Authorization","Bearer "+other.getAccessToken())).andExpect(status().isOk());
  org.assertj.core.api.Assertions.assertThatThrownBy(()->sessions.refresh(first.getRefreshToken())).isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class);
 }
 @Test void logoutAllInvalidatesOtherDevicesAndLegacyTokens()throws Exception{
  var first=sessions.create(student.getUsername());var other=sessions.create(student.getUsername());
  var details=org.springframework.security.core.userdetails.User.withUsername(student.getUsername()).password(student.getPassword()).roles("ESTUDIANTE").build();String legacy=jwt.generateToken(details);
  mvc.perform(post("/api/auth/logout-all").header("Authorization","Bearer "+first.getAccessToken())).andExpect(status().isOk());
  for(var token:List.of(first.getAccessToken(),other.getAccessToken(),legacy))mvc.perform(get("/api/account/me").header("Authorization","Bearer "+token)).andExpect(status().isUnauthorized());
 }
 @Test void passwordChangeRevokesAllPreviouslyIssuedTokens()throws Exception{
  student.setPassword(passwords.encode("OldPassword-123!"));em.flush();var first=sessions.create(student.getUsername());
  var request=new com.sgp.systemsgp.dto.account.ChangePasswordRequest();request.setCurrentPassword("OldPassword-123!");request.setNewPassword("NewPassword-123!");request.setConfirmPassword("NewPassword-123!");
  accountService.changePassword(student.getUsername(),request);
  mvc.perform(get("/api/account/me").header("Authorization","Bearer "+first.getAccessToken())).andExpect(status().isUnauthorized());
  mvc.perform(post("/api/auth/login").contentType("application/json").content("{\"username\":\""+student.getUsername()+"\",\"password\":\"NewPassword-123!\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.refreshToken").isNotEmpty());
 }
 @Test void disabledAccountCannotRefreshOrReceiveSessionNotifications()throws Exception{
  var first=sessions.create(student.getUsername());student.setLocked(true);em.flush();
  assertThat(sessions.isAccessAllowed(first.getAccessToken())).isFalse();
  org.assertj.core.api.Assertions.assertThatThrownBy(()->sessions.refresh(first.getRefreshToken())).isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class);
 }
 @Test void institutionalEmailAuthenticatesToCanonicalUserAndUnknownUserRemainsUnauthorized()throws Exception{
  student.getPerson().setInstitutionalEmail("continuity.student@example.test");student.setPassword(passwords.encode("ValidPassword-123!"));em.flush();
  mvc.perform(post("/api/auth/login").contentType("application/json").content("{\"username\":\"CONTINUITY.STUDENT@example.test\",\"password\":\"ValidPassword-123!\"}"))
   .andExpect(status().isOk()).andExpect(jsonPath("$.username").value(student.getUsername()));
  mvc.perform(post("/api/auth/login").contentType("application/json").content("{\"username\":\"no-such-user\",\"password\":\"InvalidPassword-123!\"}"))
   .andExpect(status().isUnauthorized());
 }
 private Account actor(String name,RoleName roleName,Career assignedCareer,AcademicCycle assignedCycle,Institution institution){
  Role role=em.createQuery("select r from Role r where r.name=:name",Role.class).setParameter("name",roleName.name()).getResultStream().findFirst().orElseGet(()->save(Role.builder().name(roleName.name()).build()));
  Person person=save(Person.builder().names(name).lastNames("Auditoría").build());
  return save(Account.builder().username(name).password("fixture-not-for-login").person(person).roles(Set.of(role)).career(assignedCareer).academicCycle(assignedCycle).institution(institution).build());
 }
 private <T>T save(T value){em.persist(value);return value;}
}
