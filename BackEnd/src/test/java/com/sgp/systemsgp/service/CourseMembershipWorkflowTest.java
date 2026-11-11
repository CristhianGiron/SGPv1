/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseMembershipWorkflowTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de los paralelos académicos mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.CourseGroup;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Faculty;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.PracticeOffering;
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

/** Academic membership and simultaneous practice enrollment rules. */
@SpringBootTest(properties="debug=false")
@ActiveProfiles("test")
@Transactional
class CourseMembershipWorkflowTest {
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


 @Test void sameCycleDoesNotAuthorizeUnassignedParallelEvenWithKnownId() throws Exception {
  mvc.perform(get("/api/courses/search").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
  enrollment.setStatus(EnrollmentStatus.COMPLETED); // A separate unassigned parallel is still unavailable.
  var other=save(Course.builder().name("Paralelo no asignado").code("MEM-P2").academicCycle(cycle).capacity(10).build());em.flush();
  mvc.perform(post("/api/courses/"+other.getId()+"/enroll").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
 }
 @Test void staffAssignsPracticesInDifferentCyclesReadyToWork() throws Exception {
  enrollment.setStatus(EnrollmentStatus.REJECTED);
  var otherCycle=save(AcademicCycle.builder().name("Segundo ciclo local").career(career).build());
  var first=save(Course.builder().name("Paralelo A").code("MEM-A").academicCycle(cycle).practiceTutor(practiceTutor).institutionalTutor(tutor).capacity(10).build());
  var second=save(Course.builder().name("Paralelo B").code("MEM-B").academicCycle(otherCycle).practiceTutor(practiceTutor).institutionalTutor(tutor).capacity(10).build());em.flush();
  for(var c:List.of(first,second)) {
   assign(c.getId());var p=offering(c,10);
   assignPractice(p,student,director,"DIRECTOR_PRACTICAS",200);
  }
  var ready=em.createQuery("select e from Enrollment e where e.account.id=:id and e.status=:status",Enrollment.class).setParameter("id",student.getId()).setParameter("status",EnrollmentStatus.APPROVED).getResultList();
  assertThat(ready).hasSize(2).allSatisfy(e->assertThat(e.getPractice()).isNotNull());
 }
 @Test void membershipCannotBeSelfGrantedOrManagedByTutorOrForeignDirector() throws Exception {
  for(var role:List.of("ESTUDIANTE","TUTOR_PRACTICAS")){
   String name=role.equals("ESTUDIANTE")?student.getUsername():practiceTutor.getUsername();
   mvc.perform(put("/api/courses/"+course.getId()+"/students/"+student.getId()).with(user(name).roles(role))).andExpect(status().isForbidden());
  }
  mvc.perform(put("/api/courses/"+course.getId()+"/students/"+student.getId()).with(user(foreignDirector.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isForbidden());
  mvc.perform(get("/api/courses/"+course.getId()+"/student-candidates").with(user(foreignDirector.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isForbidden());
 }
 @Test void candidateListIsScopedToCareerAndExcludesPersonalIdentifiers() throws Exception {
  actor("mem.foreign-student",RoleName.ROLE_ESTUDIANTE,foreignCareer,foreignCycle,foreignUniversity);em.flush();
  mvc.perform(get("/api/courses/"+course.getId()+"/student-candidates").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")))
   .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].id").value(student.getId()))
   .andExpect(jsonPath("$.content[0].cedula").doesNotExist()).andExpect(jsonPath("$.content[0].institutionalEmail").doesNotExist());
 }
 @Test void academicRosterDoesNotAdmitOtherCareerOrStaffEvenForAdmin() throws Exception {
  var foreign=actor("mem.foreign-student",RoleName.ROLE_ESTUDIANTE,foreignCareer,foreignCycle,foreignUniversity);em.flush();
  for(var candidate:List.of(foreign,practiceTutor))mvc.perform(put("/api/courses/"+course.getId()+"/students/"+candidate.getId()).with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isBadRequest());
 }
 @Test void closedEnrollmentWindowOverridesMembership() throws Exception {
  assign(course.getId());var practice=offering(course,10);course.setLocked(true);em.flush();
  assignPractice(practice,student,practiceTutor,"TUTOR_PRACTICAS",400);
  course.setLocked(false);practice.setEnrollmentOpen(false);em.flush();
  assignPractice(practice,student,director,"DIRECTOR_PRACTICAS",400);
 }
 @Test void removalWithdrawsEligibilityWithoutDeletingExistingPracticeOrOtherCycleMembership() throws Exception {
  assign(course.getId());var otherCycle=save(AcademicCycle.builder().name("Otro ciclo local").career(career).build());
  var second=save(Course.builder().name("Otro paralelo").code("MEM-SECOND").academicCycle(otherCycle).capacity(10).build());em.flush();assign(second.getId());
  mvc.perform(delete("/api/courses/"+course.getId()+"/students/"+student.getId()).with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
  assertThat(em.find(Enrollment.class,enrollment.getId()).getStatus()).isEqualTo(EnrollmentStatus.APPROVED);
  assertThat(enrollments.myEnrollments(student.getUsername())).hasSize(1);
  assignPractice(offering(course,10),student,director,"DIRECTOR_PRACTICAS",400);
 }
 @Test void sameCycleCannotHaveTwoActiveParallelsButTransferPreservesPracticeHistory() throws Exception {
  assign(course.getId());var other=save(Course.builder().name("Paralelo alternativo").code("MEM-ALT").academicCycle(cycle).capacity(10).build());em.flush();
  mvc.perform(put("/api/courses/"+other.getId()+"/students/"+student.getId()).with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message",org.hamcrest.Matchers.containsString("otro paralelo de este ciclo")));
  mvc.perform(delete("/api/courses/"+course.getId()+"/students/"+student.getId()).with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
  assign(other.getId());
  assertThat(em.find(Enrollment.class,enrollment.getId())).isNotNull();
 }
 @Test void studentCannotEnrollCancelCreateOrManagePracticeEvenWithKnownIds() throws Exception {
  var practice=offering(course,10);assign(course.getId());
  assignPractice(practice,student,student,"ESTUDIANTE",403);
  mvc.perform(delete("/api/enrollments/"+enrollment.getId()).with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
  mvc.perform(post("/api/courses/"+course.getId()+"/practice-offerings").with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json").content("{\"name\":\"Fraude\",\"capacity\":10}")).andExpect(status().isForbidden());
  mvc.perform(patch("/api/practice-offerings/"+practice.getId()+"/enrollment?open=true").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
 }
 @Test void assignedTutorCanEnrollOnlyExactRosterAndNotOtherCourses() throws Exception {
  var practice=offering(course,10);
  assignPractice(practice,student,practiceTutor,"TUTOR_PRACTICAS",400);assign(course.getId());
  assignPractice(practice,student,foreignDirector,"DIRECTOR_PRACTICAS",403);
  var outsider=actor("mem.other-tutor",RoleName.ROLE_TUTOR_PRACTICAS,career,cycle,university);em.flush();
  assignPractice(practice,student,outsider,"TUTOR_PRACTICAS",403);
  mvc.perform(get("/api/courses/"+course.getId()+"/practice-roster").with(user(practiceTutor.getUsername()).roles("TUTOR_PRACTICAS"))).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
  assignPractice(practice,student,practiceTutor,"TUTOR_PRACTICAS",200);
 }
 @Test void multiplePracticesOfOneParallelAreIndependentAndDuplicateAssignmentIsRejected() throws Exception {
  assign(course.getId());var p1=offering(course,10);var p2=offering(course,10);
  assignPractice(p1,student,director,"DIRECTOR_PRACTICAS",200);
  assignPractice(p2,student,practiceTutor,"TUTOR_PRACTICAS",200);
  assignPractice(p1,student,admin,"ADMIN",400);
 }
 @Test void assignmentRespectsCapacityAndRequiresConfiguredTutors() throws Exception {
  assign(course.getId());var practice=offering(course,1);assignPractice(practice,student,admin,"ADMIN",200);
  var other=actor("mem.second-student",RoleName.ROLE_ESTUDIANTE,career,cycle,university);em.flush();
  mvc.perform(put("/api/courses/"+course.getId()+"/students/"+other.getId()).with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
  assignPractice(practice,other,admin,"ADMIN",400);
  var noTutor=offering(course,10);course.setInstitutionalTutor(null);em.flush();assignPractice(noTutor,other,admin,"ADMIN",400);
 }
 @Test void practiceCreationAndRosterAreScopedToCareerAndTutorAssignment() throws Exception {
  String path="/api/courses/"+course.getId()+"/practice-offerings";
  mvc.perform(post(path).with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")).contentType("application/json").content("{\"name\":\"Nueva práctica\",\"capacity\":5}")).andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Nueva práctica"));
  for(var actor:List.of(practiceTutor,foreignDirector))mvc.perform(post(path).with(user(actor.getUsername()).roles(actor==practiceTutor?"TUTOR_PRACTICAS":"DIRECTOR_PRACTICAS")).contentType("application/json").content("{\"name\":\"Fuera de alcance\",\"capacity\":5}")).andExpect(status().isForbidden());
 }
 @Test void studentCanStartWorkingImmediatelyAndWeekDatesBelongToThePractice() throws Exception {
  var practice=offering(course,10);practice.setStartDate(LocalDateTime.of(2026,11,9,8,0));practice.setEndDate(LocalDateTime.of(2026,12,1,12,0));
  course.setStartDate(LocalDateTime.of(2026,1,1,8,0));enrollment.setPractice(practice);em.flush();
  mvc.perform(post("/api/activity-plans").with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json").content("{\"enrollmentId\":"+enrollment.getId()+",\"activityWeeks\":[{\"weekNumber\":1,\"activities\":\"Observación\"}]}"))
   .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DRAFT")).andExpect(jsonPath("$.activityWeeks[0].startDate").value("2026-11-09"));
 }
 @Test void enrollmentDoesNotLeaveAStudentWithADisabledTutor() throws Exception {
  assign(course.getId());var practice=offering(course,10);tutor.setLocked(true);em.flush();
  assignPractice(practice,student,admin,"ADMIN",400);
 }
 @Test void twoPracticesOfOneStudentOccupyOnlyOneGroupSeat() throws Exception {
  assign(course.getId());var group=save(CourseGroup.builder().course(course).name("Una plaza").capacity(1).institutionalTutor(tutor).active(true).build());em.flush();
  for(var practice:List.of(offering(course,10),offering(course,10)))
   mvc.perform(post("/api/practice-offerings/"+practice.getId()+"/students").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")).contentType("application/json").content("{\"studentId\":"+student.getId()+",\"groupId\":"+group.getId()+"}")).andExpect(status().isOk());
 }
 private PracticeOffering offering(Course c,int capacity){var p=save(PracticeOffering.builder().course(c).name("Práctica de "+c.getName()).capacity(capacity).createdAt(LocalDateTime.now()).build());em.flush();return p;}
 private void assignPractice(PracticeOffering p,Account target,Account actor,String role,int expected) throws Exception {
  mvc.perform(post("/api/practice-offerings/"+p.getId()+"/students").with(user(actor.getUsername()).roles(role)).contentType("application/json").content("{\"studentId\":"+target.getId()+"}")).andExpect(status().is(expected));
 }
 @Test void pendingRequestCannotBeApprovedAfterMembershipWasRemoved() throws Exception {
  assign(course.getId());enrollment.setStatus(EnrollmentStatus.PENDING);em.flush();
  mvc.perform(delete("/api/courses/"+course.getId()+"/students/"+student.getId()).with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isOk());
  mvc.perform(patch("/api/enrollments/"+enrollment.getId()+"/approve").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isBadRequest());
 }
 @Test void reassigningTheSameStudentRestoresOneMembershipInsteadOfDuplicatingIt() throws Exception {
  assign(course.getId());assign(course.getId());
  mvc.perform(get("/api/courses/"+course.getId()+"/students").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(jsonPath("$.length()").value(1));
  mvc.perform(delete("/api/courses/"+course.getId()+"/students/"+student.getId()).with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
  assign(course.getId());mvc.perform(get("/api/courses/"+course.getId()+"/students").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].active").value(true));
 }
 @Test void multiplePracticesRequireExplicitContextForDocumentDefaults() throws Exception {
  var other=save(Course.builder().name("Segunda práctica").code("MEM-DEFAULT").academicCycle(cycle).capacity(10).build());
  save(Enrollment.builder().account(student).course(other).status(EnrollmentStatus.APPROVED).build());em.flush();
  for(var module:List.of("activity-plans","practice-reports","final-reports","completed-activity-records"))
   mvc.perform(get("/api/"+module+"/defaults").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message",org.hamcrest.Matchers.containsString("varias prácticas")));
 }
 private void assign(Long courseId) throws Exception {
  mvc.perform(put("/api/courses/"+courseId+"/students/"+student.getId()).with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isOk());
 }
 private Account actor(String name,RoleName roleName,Career assignedCareer,AcademicCycle assignedCycle,Institution institution){
  Role role=em.createQuery("select r from Role r where r.name=:name",Role.class).setParameter("name",roleName.name()).getResultStream().findFirst().orElseGet(()->save(Role.builder().name(roleName.name()).build()));
  Person person=save(Person.builder().names(name).lastNames("Auditoría").build());
  return save(Account.builder().username(name).password("fixture-not-for-login").person(person).roles(Set.of(role)).career(assignedCareer).academicCycle(assignedCycle).institution(institution).build());
 }
 private <T>T save(T value){em.persist(value);return value;}
}
