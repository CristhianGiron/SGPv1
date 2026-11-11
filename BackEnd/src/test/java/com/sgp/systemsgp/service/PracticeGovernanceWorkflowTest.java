/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeGovernanceWorkflowTest.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Comprueba el comportamiento de el módulo Practice Governance Workflow Test mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.enums.ActivityDevelopmentMode;
import com.sgp.systemsgp.enums.ActivityEvaluationAspectType;
import com.sgp.systemsgp.enums.ActivityEvaluationLevel;
import com.sgp.systemsgp.enums.ActivityEvaluationPracticeType;
import com.sgp.systemsgp.enums.ActivityPlanStatus;
import com.sgp.systemsgp.enums.CompletedActivityRecordStatus;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.FinalReportStatus;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.PracticeReportStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind;
import com.sgp.systemsgp.enums.practicedeadline.PracticeDeadlineStage;
import com.sgp.systemsgp.enums.practiceincident.PracticeIncidentType;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.ActivityPlan;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.CompletedActivityRecord;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.CourseGroup;
import com.sgp.systemsgp.model.CourseStudentMembership;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.EntityImage;
import com.sgp.systemsgp.model.Faculty;
import com.sgp.systemsgp.model.FinalReport;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Notification;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.PracticeReport;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.model.documentversion.PracticeDocumentVersion;
import com.sgp.systemsgp.service.AccountService;
import com.sgp.systemsgp.service.ActivityEvaluationService;
import com.sgp.systemsgp.service.ActivityPlanService;
import com.sgp.systemsgp.service.AuthSessionService;
import com.sgp.systemsgp.service.CompletedActivityRecordService;
import com.sgp.systemsgp.service.DidacticPlanService;
import com.sgp.systemsgp.service.EnrollmentService;
import com.sgp.systemsgp.service.FinalReportService;
import com.sgp.systemsgp.service.InstitutionalAssignmentResolver;
import com.sgp.systemsgp.service.NotificationService;
import com.sgp.systemsgp.service.PracticeAccessService;
import com.sgp.systemsgp.service.PracticeArchiveExportService;
import com.sgp.systemsgp.service.PracticeCompletionService;
import com.sgp.systemsgp.service.PracticeFollowUpReportService;
import com.sgp.systemsgp.service.PracticeFormService;
import com.sgp.systemsgp.service.PracticeReportService;
import com.sgp.systemsgp.service.PracticeScheduleService;
import com.sgp.systemsgp.service.documentversion.PracticeDocumentBaselineService;
import com.sgp.systemsgp.service.documentversion.PracticeDocumentVersionService;
import com.sgp.systemsgp.service.practicedeadline.PracticeDeadlineService;
import com.sgp.systemsgp.service.practiceincident.PracticeIncidentService;

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
class PracticeGovernanceWorkflowTest {
 @Autowired EntityManager em;
 @Autowired WebApplicationContext context;
 @Autowired PracticeScheduleService schedules;
 @Autowired DidacticPlanService plans;
 @Autowired NotificationService notifications;
 @Autowired PracticeFormService forms;
 @Autowired EnrollmentService enrollments;
 @Autowired PracticeIncidentService incidents;
 @Autowired PracticeDocumentVersionService versions;
 @Autowired PracticeDeadlineService deadlines;
 @Autowired ActivityPlanService activityPlans;
 @Autowired PracticeReportService reports;
 @Autowired CompletedActivityRecordService records;
 @Autowired FinalReportService finals;
 @Autowired ActivityEvaluationService evaluations;
 @Autowired PracticeFollowUpReportService followUps;
 @Autowired PracticeArchiveExportService archive;
 @Autowired PracticeDocumentBaselineService baseline;
 @Autowired PracticeCompletionService completion;

 @Autowired com.fasterxml.jackson.databind.ObjectMapper mapper;

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




 private com.sgp.systemsgp.dto.enrollment.practiceincident.PracticeIncidentResponse incident(PracticeIncidentType type){
  return incidents.create(student.getUsername(),enrollment.getId(),new com.sgp.systemsgp.dto.enrollment.practiceincident.PracticeIncidentRequests.Create(type,"Situación de práctica","Descripción que requiere evaluación"));
 }
 private void ready(Long id){
  incidents.assign(director.getUsername(),id,new com.sgp.systemsgp.dto.enrollment.practiceincident.PracticeIncidentRequests.Assign(practiceTutor.getId(),"Tutor asignado para evaluar"));
  incidents.evaluate(practiceTutor.getUsername(),id,new com.sgp.systemsgp.dto.enrollment.practiceincident.PracticeIncidentRequests.Reason("Evaluación documentada"));
 }
 private void decide(Long id,boolean approve,Long groupId){incidents.decide(director.getUsername(),id,new com.sgp.systemsgp.dto.enrollment.practiceincident.PracticeIncidentRequests.Decide(approve,"Decisión académica justificada",groupId));}
 private ActivityPlan plan(ActivityPlanStatus status){return save(ActivityPlan.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(status).presentation("Contenido de prueba aprobado").build());}
 @Test void incidentHistoryTracksAssignmentEvaluationAndRejectionWithoutChangingPractice(){
  var i=incident(PracticeIncidentType.SUSPENSION);ready(i.id());decide(i.id(),false,null);
  var result=incidents.list(student.getUsername(),enrollment.getId()).get(0);
  assertThat(result.status()).isEqualTo("REJECTED");assertThat(result.events()).hasSize(4);
  assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.APPROVED);
 }
 @Test void directorCanSuspendAndResumeWithoutErasingEarlierRecords()throws Exception{
  var oldPlan=plan(ActivityPlanStatus.DRAFT);em.flush();var i=incident(PracticeIncidentType.SUSPENSION);ready(i.id());decide(i.id(),true,null);
  assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.SUSPENDED);
  mvc.perform(put("/api/activity-plans/"+oldPlan.getId()).with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json").content("{\"presentation\":\"Intento durante suspensión\"}")).andExpect(status().isBadRequest());
  mvc.perform(get("/api/enrollments/practices").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("SUSPENDED"));
  save(CourseStudentMembership.builder().course(course).student(student).activeCycle(cycle).assignedAt(LocalDateTime.now()).build());em.flush();
  var resume=incident(PracticeIncidentType.RESUMPTION);ready(resume.id());decide(resume.id(),true,null);
  assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.APPROVED);assertThat(em.find(ActivityPlan.class,oldPlan.getId()).getPresentation()).isEqualTo("Contenido de prueba aprobado");
 }
 @Test void withdrawalPreservesThePracticeAndHistoryButDisallowsFurtherOperationalRecords(){
  var i=incident(PracticeIncidentType.WITHDRAWAL);ready(i.id());decide(i.id(),true,null);
  assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.WITHDRAWN);
  assertThat(incidents.list(student.getUsername(),enrollment.getId())).hasSize(1);
  org.assertj.core.api.Assertions.assertThatThrownBy(()->PracticeAccessService.requireOperationalEnrollment(enrollment)).isInstanceOf(com.sgp.systemsgp.exception.BadRequestException.class);
 }
 @Test void studentAndOtherCareerCannotAssignOrResolveEvenWithKnownIdentifiers()throws Exception{
  var i=incident(PracticeIncidentType.OTHER);
  mvc.perform(patch("/api/incidents/"+i.id()+"/assign").with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json").content("{\"responsibleId\":"+practiceTutor.getId()+",\"reason\":\"Intento indebido\"}")).andExpect(status().isForbidden());
  mvc.perform(get("/api/enrollments/"+enrollment.getId()+"/incidents").with(user(foreignDirector.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isForbidden());
  ready(i.id());mvc.perform(patch("/api/incidents/"+i.id()+"/decide").with(user(practiceTutor.getUsername()).roles("TUTOR_PRACTICAS")).contentType("application/json").content("{\"approved\":true,\"reason\":\"No sustituye a dirección\"}")).andExpect(status().isForbidden());
 }
 @Test void incidentMustHaveResponsibleAndEvaluationBeforeDecision(){
  var i=incident(PracticeIncidentType.OTHER);
  org.assertj.core.api.Assertions.assertThatThrownBy(()->decide(i.id(),true,null)).isInstanceOf(com.sgp.systemsgp.exception.BadRequestException.class);
 }
 @Test void secondDecisionCannotApplyAnAcademicChangeTwice(){
  var i=incident(PracticeIncidentType.SUSPENSION);ready(i.id());decide(i.id(),true,null);
  org.assertj.core.api.Assertions.assertThatThrownBy(()->decide(i.id(),true,null)).isInstanceOf(com.sgp.systemsgp.exception.BadRequestException.class);
  assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.SUSPENDED);
 }
 @Test void unassignedAccountsCannotBeMadeResponsible(){
  var i=incident(PracticeIncidentType.OTHER);
  for(var candidate:List.of(student,foreignDirector,admin))org.assertj.core.api.Assertions.assertThatThrownBy(()->incidents.assign(director.getUsername(),i.id(),new com.sgp.systemsgp.dto.enrollment.practiceincident.PracticeIncidentRequests.Assign(candidate.getId(),"Asignación inválida"))).isInstanceOf(com.sgp.systemsgp.exception.BadRequestException.class);
 }
 @Test void institutionalTutorReplacementMustKeepTheInstitutionAndChangesOnlyThisPractice(){
  var newTutor=actor("replacement.tutor",RoleName.ROLE_TUTOR_INSTITUCIONAL,career,cycle,school);
  var group=save(CourseGroup.builder().course(course).institutionalTutor(newTutor).name("Grupo nuevo").capacity(10).build());em.flush();
  var i=incident(PracticeIncidentType.CHANGE_INSTITUTIONAL_TUTOR);ready(i.id());decide(i.id(),true,group.getId());
  assertThat(InstitutionalAssignmentResolver.institutionalTutor(enrollment)).isEqualTo(newTutor);
  assertThat(course.getInstitutionalTutor()).isEqualTo(tutor);
  assertThat(incidents.list(student.getUsername(),enrollment.getId()).get(0).events().get(3).effects()).contains(tutor.getUsername(),newTutor.getUsername());
 }
 @Test void changeOfInstitutionRequiresAnotherReceivingInstitutionAndTheSameAcademicParallel(){
  var otherSchool=save(Institution.builder().name("Nuevo centro").code("NEW-S").type(InstitutionType.ESCUELA).build());
  var newTutor=actor("new.school.tutor",RoleName.ROLE_TUTOR_INSTITUCIONAL,career,cycle,otherSchool);
  var group=save(CourseGroup.builder().course(course).institutionalTutor(newTutor).name("Nuevo centro receptor").capacity(10).build());em.flush();
  var old=plan(ActivityPlanStatus.APPROVED);em.flush();var i=incident(PracticeIncidentType.CHANGE_INSTITUTION);ready(i.id());decide(i.id(),true,group.getId());
  assertThat(InstitutionalAssignmentResolver.educationalInstitution(enrollment)).isEqualTo(otherSchool);
  assertThat(old.getEducationalInstitution()).isEqualTo(school);
 }
 @Test void archivedOrCompletedPracticeDoesNotAdmitNewIncidents(){
  enrollment.setStatus(EnrollmentStatus.COMPLETED);em.flush();
  org.assertj.core.api.Assertions.assertThatThrownBy(()->incident(PracticeIncidentType.OTHER)).isInstanceOf(com.sgp.systemsgp.exception.BadRequestException.class);
 }
 @Test void approvedDocumentVersionRetainsEveryReviewDecisionAndTheExactPdf()throws Exception{
  var plan=plan(ActivityPlanStatus.SUBMITTED);em.flush();
  var review=new com.sgp.systemsgp.dto.activityplan.ReviewActivityPlanRequest();review.setApproved(true);
  activityPlans.review(plan.getId(),practiceTutor.getUsername(),review);activityPlans.review(plan.getId(),director.getUsername(),review);
  var snapshots=versions.list(enrollment.getId(),student.getUsername());assertThat(snapshots).hasSize(3);
  var latest=snapshots.get(0);assertThat(latest.documentStatus()).isEqualTo("APPROVED");assertThat(latest.hasPdf()).isTrue();
  var snapshot=mapper.readTree(versions.snapshot(enrollment.getId(),latest.id(),student.getUsername()));
  assertThat(snapshot.get("practiceTutorApproved").asBoolean()).isTrue();assertThat(snapshot.get("directorApproved").asBoolean()).isTrue();
  var originalPdf=versions.pdf(enrollment.getId(),latest.id(),student.getUsername());assertThat(originalPdf).startsWith((byte)'%',(byte)'P',(byte)'D',(byte)'F');
  course.setName("Nombre posterior");em.flush();assertThat(versions.pdf(enrollment.getId(),latest.id(),student.getUsername())).isEqualTo(originalPdf);assertThat(activityPlans.exportApprovedPdf(plan.getId(),student.getUsername())).isEqualTo(originalPdf);
 }
 @Test void versionReadsPreserveDocumentSpecificPermissionsAndPracticeIsolation()throws Exception{
  var plan=plan(ActivityPlanStatus.SUBMITTED);em.flush();var request=new com.sgp.systemsgp.dto.activityplan.ReviewActivityPlanRequest();request.setApproved(true);activityPlans.review(plan.getId(),practiceTutor.getUsername(),request);
  assertThat(versions.list(enrollment.getId(),tutor.getUsername())).isEmpty();
  var id=versions.list(enrollment.getId(),student.getUsername()).get(0).id();
  mvc.perform(get("/api/enrollments/"+enrollment.getId()+"/document-versions/"+id).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isForbidden());
  mvc.perform(get("/api/enrollments/"+enrollment.getId()+"/document-versions").with(user(foreignDirector.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isForbidden());
 }
 @Test void privateDraftBaselineIsNotDisclosedToReviewers(){
  var plan=plan(ActivityPlanStatus.DRAFT);em.flush();
  versions.record(PracticeDocumentKind.L2,plan.getId(),enrollment,student.getUsername(),"BASELINE",Map.of("status","DRAFT","presentation","Privado"),null);
  assertThat(versions.list(enrollment.getId(),student.getUsername())).hasSize(1);assertThat(versions.list(enrollment.getId(),director.getUsername())).isEmpty();
 }
 @Test void contentHashRejectsTamperedHistoricalContent(){
  var plan=plan(ActivityPlanStatus.SUBMITTED);em.flush();versions.record(PracticeDocumentKind.L2,plan.getId(),enrollment,student.getUsername(),"SUBMITTED",Map.of("status","SUBMITTED","presentation","Original"),null);
  var v=em.createQuery("select v from PracticeDocumentVersion v",PracticeDocumentVersion.class).getSingleResult();v.setSnapshotJson("{}");em.flush();
  org.assertj.core.api.Assertions.assertThatThrownBy(()->versions.snapshot(enrollment.getId(),v.getId(),student.getUsername())).isInstanceOf(IllegalStateException.class);
 }
 private com.sgp.systemsgp.dto.enrollment.practicedeadline.PracticeDeadlineResponse deadline(PracticeDocumentKind kind,PracticeDeadlineStage stage,LocalDateTime due){
  return deadlines.save(director.getUsername(),enrollment.getId(),new com.sgp.systemsgp.dto.enrollment.practicedeadline.PracticeDeadlineRequest(kind,stage,due,48,"Plazo de evaluación del período"));
 }
 @Test void deadlineRemindersGoToTheResponsibleAndAreNotRepeated(){
  var due=deadline(PracticeDocumentKind.L2,PracticeDeadlineStage.SUBMISSION,LocalDateTime.now(java.time.ZoneId.of("America/Guayaquil")).minusHours(1));
  assertThat(due.state()).isEqualTo("OVERDUE");assertThat(due.responsibleUsers()).containsExactly(student.getUsername());
  assertThat(deadlines.remind(due.id())).isEqualTo(1);assertThat(deadlines.remind(due.id())).isZero();
  assertThat(em.createQuery("select n from Notification n where n.type='PRACTICE_DEADLINE'",Notification.class).getResultList()).hasSize(1);
 }
 @Test void reviewerDeadlineWaitsForSubmissionAndCompletesOnlyThatReviewersDecision(){
  var p=plan(ActivityPlanStatus.DRAFT);em.flush();var due=deadline(PracticeDocumentKind.L2,PracticeDeadlineStage.PRACTICE_REVIEW,LocalDateTime.now().minusDays(1));
  assertThat(due.state()).isEqualTo("WAITING_SUBMISSION");assertThat(deadlines.remind(due.id())).isZero();
  p.setStatus(ActivityPlanStatus.SUBMITTED);em.flush();assertThat(deadlines.list(student.getUsername(),enrollment.getId()).get(0).state()).isEqualTo("OVERDUE");
  p.setPracticeTutorApproved(true);em.flush();assertThat(deadlines.list(student.getUsername(),enrollment.getId()).get(0).state()).isEqualTo("FULFILLED");
 }
 @Test void pauseStopsDeadlineRemindersAndNeverAutoConcludesAPractice(){
  var d=deadline(PracticeDocumentKind.L1,PracticeDeadlineStage.SUBMISSION,LocalDateTime.now().minusDays(1));
  assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.APPROVED);
  enrollment.setStatus(EnrollmentStatus.SUSPENDED);em.flush();assertThat(deadlines.list(student.getUsername(),enrollment.getId()).get(0).state()).isEqualTo("PAUSED");assertThat(deadlines.remind(d.id())).isZero();
 }
 @Test void changedDeadlineHasNewRevisionAndAuditAndFreshReminder(){
  var d=deadline(PracticeDocumentKind.L2,PracticeDeadlineStage.SUBMISSION,LocalDateTime.now().minusDays(1));deadlines.remind(d.id());
  var changed=deadline(PracticeDocumentKind.L2,PracticeDeadlineStage.SUBMISSION,LocalDateTime.now().minusHours(1));
  assertThat(changed.id()).isEqualTo(d.id());assertThat(changed.revision()).isEqualTo(d.revision()+1);assertThat(deadlines.remind(d.id())).isEqualTo(1);
 }
 @Test void studentsCannotSetDeadlinesAndL4CannotAcquireInventedApprovalStages()throws Exception{
  mvc.perform(put("/api/enrollments/"+enrollment.getId()+"/deadlines").with(user(student.getUsername()).roles("ESTUDIANTE")).contentType("application/json").content("{\"kind\":\"L2\",\"stage\":\"SUBMISSION\",\"dueAt\":\"2026-12-01T12:00:00\",\"reminderHours\":48,\"reason\":\"Cambiar plazo\"}")).andExpect(status().isForbidden());
  org.assertj.core.api.Assertions.assertThatThrownBy(()->deadline(PracticeDocumentKind.L4,PracticeDeadlineStage.DIRECTOR_REVIEW,LocalDateTime.now().plusDays(1))).isInstanceOf(com.sgp.systemsgp.exception.BadRequestException.class);
 }
 @Test void L1AndL6PreserveBothApprovalsAndIncludeHistoricalPdfsInTheArchive()throws Exception{
  var l1=save(PracticeReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(PracticeReportStatus.SUBMITTED).build());
  var l6=save(CompletedActivityRecord.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(CompletedActivityRecordStatus.SUBMITTED).build());em.flush();
  var review1=new com.sgp.systemsgp.dto.practicereport.ReviewPracticeReportRequest();review1.setApproved(true);
  reports.review(l1.getId(),practiceTutor.getUsername(),review1);reports.review(l1.getId(),director.getUsername(),review1);
  var review6=new com.sgp.systemsgp.dto.completedactivity.ReviewCompletedActivityRecordRequest();review6.setApproved(true);
  records.review(l6.getId(),practiceTutor.getUsername(),review6);records.review(l6.getId(),director.getUsername(),review6);
  var rows=versions.list(enrollment.getId(),student.getUsername());
  assertThat(rows.stream().filter(v->v.documentStatus().equals("APPROVED")).map(v->v.kind()).toList()).containsExactlyInAnyOrder("L1","L6");
  var names=new ArrayList<String>();try(var zip=new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(archive.export(enrollment.getId(),student.getUsername())))){java.util.zip.ZipEntry entry;while((entry=zip.getNextEntry())!=null)names.add(entry.getName());}
  assertThat(names).anyMatch(n->n.startsWith("versiones/L1-")).anyMatch(n->n.startsWith("versiones/L6-"));
 }
 @Test void L3RetainsItsThreeDistinctApprovals()throws Exception{
  var image=new java.awt.image.BufferedImage(2,2,java.awt.image.BufferedImage.TYPE_INT_RGB);var bytes=new java.io.ByteArrayOutputStream();javax.imageio.ImageIO.write(image,"png",bytes);
  var l3=save(FinalReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(FinalReportStatus.SUBMITTED)
   .letterheadImage(save(EntityImage.builder().contentType("image/png").data(bytes.toByteArray()).build())).completedPracticeMinutes(120)
   .conclusion1("Conclusión uno").conclusion2("Conclusión dos").conclusion3("Conclusión tres")
   .recommendation1("Recomendación uno").recommendation2("Recomendación dos").recommendation3("Recomendación tres").build());em.flush();
  var request=new com.sgp.systemsgp.dto.finalreport.ReviewFinalReportRequest();request.setApproved(true);
  finals.reviewByInstitutionalTutor(l3.getId(),tutor.getUsername(),request);finals.reviewByPracticeTutor(l3.getId(),practiceTutor.getUsername(),request);finals.reviewByDirector(l3.getId(),director.getUsername(),request);
  var rows=versions.list(enrollment.getId(),tutor.getUsername());assertThat(rows).hasSize(4);assertThat(rows.get(0).documentStatus()).isEqualTo("APPROVED");
  var data=mapper.readTree(versions.snapshot(enrollment.getId(),rows.get(0).id(),tutor.getUsername()));
  for(String key:List.of("practiceTutorApproved","institutionalTutorApproved","directorApproved"))assertThat(data.get(key).asBoolean()).isTrue();
  assertThat(versions.pdf(enrollment.getId(),rows.get(0).id(),tutor.getUsername())).isNotEmpty();
 }
 @Test void L4AndL5SaveVersionsWithoutInventingApprovalStates()throws Exception{
  student.getPerson().setCedula("1100000000");course.setPracticeType("DOCENTE");em.flush();
  var request=new com.sgp.systemsgp.dto.activityevaluation.CreateActivityEvaluationRequest();request.setEnrollmentId(enrollment.getId());request.setPracticeType(ActivityEvaluationPracticeType.DOCENTE);request.setAcademicPeriod("2026");request.setDevelopmentMode(ActivityDevelopmentMode.PRESENCIAL);request.setHoursCompleted(2);request.setActivitiesCompletionPercentage(new java.math.BigDecimal("100"));request.setEvaluationDate(LocalDate.of(2026,11,10));
  var aspects=new ArrayList<com.sgp.systemsgp.dto.activityevaluation.ActivityEvaluationAspectRequest>();for(var type:List.of(ActivityEvaluationAspectType.GENERAL,ActivityEvaluationAspectType.ESPECIFICO)){var item=new com.sgp.systemsgp.dto.activityevaluation.ActivityEvaluationAspectRequest();item.setAspectType(type);item.setItem("Puntualidad y planificación");item.setLevel(ActivityEvaluationLevel.ALTO);aspects.add(item);}request.setAspects(aspects);
  var l4=evaluations.create(practiceTutor.getUsername(),request);
  var follow=new com.sgp.systemsgp.dto.practicefollowup.CreatePracticeFollowUpReportRequest();follow.setEnrollmentId(enrollment.getId());follow.setPracticeType(ActivityEvaluationPracticeType.DOCENTE);follow.setAcademicPeriod("2026");follow.setDevelopmentMode(ActivityDevelopmentMode.PRESENCIAL);follow.setDeliveryDate(LocalDate.of(2026,11,10));follow.setTotalMinutes(60);
  var session=new com.sgp.systemsgp.dto.practicefollowup.PracticeFollowUpSessionRequest();session.setSupervisionDate(LocalDate.of(2026,11,10));session.setStartTime(LocalTime.of(8,0));session.setEndTime(LocalTime.of(9,0));session.setSupervisedActivities("Observación de clase");follow.setSessions(List.of(session));followUps.create(practiceTutor.getUsername(),follow);
  var update=new com.sgp.systemsgp.dto.activityevaluation.UpdateActivityEvaluationRequest();update.setHoursCompleted(3);evaluations.update(l4.getId(),practiceTutor.getUsername(),update);
  var rows=versions.list(enrollment.getId(),student.getUsername());assertThat(rows).hasSize(3);assertThat(rows).allMatch(v->v.documentStatus().equals("SAVED")&&v.hasPdf());
  assertThat(versions.list(enrollment.getId(),tutor.getUsername())).isEmpty();
 }
 @Test void forbiddenTransitionsAndNullDecisionAreRejectedWithValidationErrors()throws Exception{
  var i=incident(PracticeIncidentType.OTHER);ready(i.id());
  mvc.perform(patch("/api/incidents/"+i.id()+"/decide").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")).contentType("application/json").content("{\"reason\":\"Falta decisión\"}")).andExpect(status().isBadRequest());
 }
 @Test void previousApprovedDocumentsCanBeCapturedWithoutInventingPastDatesAndOnlyOnce()throws Exception{
  plan(ActivityPlanStatus.APPROVED);save(PracticeReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(PracticeReportStatus.DRAFT).build());enrollment.setStatus(EnrollmentStatus.COMPLETED);enrollment.setArchived(true);em.flush();
  assertThat(baseline.capture(director.getUsername(),enrollment.getId())).isEqualTo(1);
  assertThat(baseline.capture(director.getUsername(),enrollment.getId())).isZero();
  var row=versions.list(enrollment.getId(),student.getUsername()).get(0);assertThat(row.event()).isEqualTo("BASELINE");assertThat(row.hasPdf()).isTrue();assertThat(row.createdAt().toLocalDate()).isEqualTo(LocalDate.now(java.time.ZoneId.of("America/Guayaquil")));
  mvc.perform(post("/api/enrollments/"+enrollment.getId()+"/document-versions/baseline").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
 }
 @Test void manualCompletionWarnsAboutOpenIncidentsButRemainsAManualDecision(){
  incident(PracticeIncidentType.OTHER);assertThat(completion.summarize(enrollment).warnings()).anyMatch(w->w.contains("incidencia(s) sin resolver"));
  enrollments.complete(director.getUsername(),enrollment.getId());assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.COMPLETED);
 }
 @Test void addingAMissingLegacyLetterheadPreservesTheBeforeAndAfterWithoutChangingApprovals()throws Exception{
  var l3=save(FinalReport.builder().enrollment(enrollment).student(student).course(course).educationalInstitution(school).status(FinalReportStatus.APPROVED).institutionalTutorApproved(true).practiceTutorApproved(true).directorApproved(true).build());em.flush();
  var image=new java.awt.image.BufferedImage(2,2,java.awt.image.BufferedImage.TYPE_INT_RGB);var bytes=new java.io.ByteArrayOutputStream();javax.imageio.ImageIO.write(image,"png",bytes);
  var file=new org.springframework.mock.web.MockMultipartFile("image","letterhead.png","image/png",bytes.toByteArray());
  finals.attachLegacyLetterhead(l3.getId(),tutor.getUsername(),file);
  var rows=versions.list(enrollment.getId(),tutor.getUsername());assertThat(rows).hasSize(2);assertThat(rows.get(0).event()).isEqualTo("LEGACY_LETTERHEAD_ATTACHED");assertThat(rows.get(0).hasPdf()).isTrue();assertThat(rows.get(1).hasPdf()).isFalse();
  assertThat(l3.getStatus()).isEqualTo(FinalReportStatus.APPROVED);assertThat(l3.isInstitutionalTutorApproved()).isTrue();
 }
 private Account actor(String name,RoleName roleName,Career assignedCareer,AcademicCycle assignedCycle,Institution institution){
  Role role=em.createQuery("select r from Role r where r.name=:name",Role.class).setParameter("name",roleName.name()).getResultStream().findFirst().orElseGet(()->save(Role.builder().name(roleName.name()).build()));
  Person person=save(Person.builder().names(name).lastNames("Auditoría").build());
  return save(Account.builder().username(name).password("fixture-not-for-login").person(person).roles(Set.of(role)).career(assignedCareer).academicCycle(assignedCycle).institution(institution).build());
 }
 private <T>T save(T value){em.persist(value);return value;}
}
