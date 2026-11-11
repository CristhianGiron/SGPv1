/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDeadlineService.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Implementa la lógica de aplicación de el módulo Practice Deadline Service.
 */

package com.sgp.systemsgp.service.practicedeadline;
import com.sgp.systemsgp.dto.enrollment.practicedeadline.PracticeDeadlineRequest;
import com.sgp.systemsgp.dto.enrollment.practicedeadline.PracticeDeadlineResponse;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind;
import com.sgp.systemsgp.enums.practicedeadline.PracticeDeadlineStage;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.ActivityEvaluation;
import com.sgp.systemsgp.model.ActivityPlan;
import com.sgp.systemsgp.model.CompletedActivityRecord;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.FinalReport;
import com.sgp.systemsgp.model.PracticeFollowUpReport;
import com.sgp.systemsgp.model.PracticeReport;
import com.sgp.systemsgp.model.practicedeadline.PracticeDeadline;
import com.sgp.systemsgp.model.practicedeadline.PracticeDeadlineNotice;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.practicedeadline.PracticeDeadlineNoticeRepository;
import com.sgp.systemsgp.repository.practicedeadline.PracticeDeadlineRepository;
import com.sgp.systemsgp.service.InstitutionalAssignmentResolver;
import com.sgp.systemsgp.service.NotificationService;
import com.sgp.systemsgp.service.PracticeAccessService;
import com.sgp.systemsgp.service.PracticeAuditService;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.enums.*;
import com.sgp.systemsgp.repository.*;
import com.sgp.systemsgp.dto.enrollment.*;
import com.sgp.systemsgp.exception.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;
@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class PracticeDeadlineService {
 private final PracticeDeadlineRepository deadlines;
 private final PracticeDeadlineNoticeRepository notices;
 private final AccountRepository accounts;
 private final EnrollmentRepository enrollments;
 private final PracticeAccessService access;
 private final NotificationService notifications;
 private final PracticeAuditService audit;
 private final EntityManager em;
 private LocalDateTime now(){return LocalDateTime.now(ZoneId.of("America/Guayaquil"));}
 private Account actor(String username){return accounts.findByUsernameAndDeletedFalse(username).filter(a->a.isEnabled()&&!a.isLocked()).orElseThrow(()->new AccessDeniedException("Cuenta no disponible"));}
 private Enrollment visible(Long id,Account a){var e=enrollments.findById(id).orElseThrow(()->new NotFoundException("Práctica no encontrada"));if(!access.canViewEnrollment(e,a))throw new AccessDeniedException("No puedes consultar esta práctica");return e;}
 public List<PracticeDeadlineResponse> list(String username,Long id){visible(id,actor(username));return deadlines.findByEnrollment_IdOrderByDueAtAsc(id).stream().map(this::response).toList();}
 @Transactional public PracticeDeadlineResponse save(String username,Long id,PracticeDeadlineRequest request){
  var a=actor(username);visible(id,a);var e=enrollments.findForUpdate(id).orElseThrow();em.refresh(e);
  if(access.isStudentForEnrollment(e,a)||!access.isDirectorForCourse(e.getCourse(),a)&&!access.isPracticeTutorForEnrollment(e,a))throw new AccessDeniedException("Solo dirección o el tutor de prácticas asignado puede configurar plazos");
  PracticeAccessService.requireOperationalEnrollment(e);
  if((request.kind()==PracticeDocumentKind.L4||request.kind()==PracticeDocumentKind.L5)&&request.stage()!=PracticeDeadlineStage.SUBMISSION)throw new BadRequestException("L.4 y L.5 tienen registro por tutor, sin circuito de aprobación");
  if(request.stage()==PracticeDeadlineStage.INSTITUTIONAL_REVIEW&&request.kind()!=PracticeDocumentKind.L3)throw new BadRequestException("La revisión institucional corresponde a L.3");
  var deadline=deadlines.findByEnrollment_IdAndKindAndStage(id,request.kind(),request.stage()).orElseGet(()->PracticeDeadline.builder().enrollment(e).kind(request.kind()).stage(request.stage()).build());
  deadline.setDueAt(request.dueAt());deadline.setReminderHours(request.reminderHours());deadline.setReason(request.reason().strip());
  deadline.setUpdatedBy(a);deadline.setUpdatedAt(now());deadline.setRevision(deadline.getRevision()+1);deadlines.saveAndFlush(deadline);
  audit.logEnrollmentAction(e,a,"DEADLINE_UPDATED",null,request.stage().name(),false,false,request.kind()+"; vence "+request.dueAt()+"; "+request.reason().strip());
  return response(deadline);
 }
 private List<?> documents(PracticeDeadline d){
  String entity=switch(d.getKind()){case L1->"PracticeReport";case L2->"ActivityPlan";case L3->"FinalReport";case L4->"ActivityEvaluation";case L5->"PracticeFollowUpReport";case L6->"CompletedActivityRecord";};
  return em.createQuery("select x from "+entity+" x where x.enrollment.id=:id and x.deleted=false order by x.id asc").setParameter("id",d.getEnrollment().getId()).getResultList();
 }
 private Object prop(Object bean,String name){var w=new BeanWrapperImpl(bean);return w.isReadableProperty(name)?w.getPropertyValue(name):null;}
 private String documentState(Object bean){Object status=prop(bean,"status");return status==null?"SAVED":status.toString();}
 private boolean fulfilled(PracticeDeadline d,List<?> docs){
  if(docs.isEmpty())return false;
  if(d.getStage()==PracticeDeadlineStage.SUBMISSION)return docs.stream().allMatch(x->!List.of("DRAFT","NEEDS_CORRECTION").contains(documentState(x)));
  String field=switch(d.getStage()){case PRACTICE_REVIEW->"practiceTutorApproved";case INSTITUTIONAL_REVIEW->"institutionalTutorApproved";case DIRECTOR_REVIEW->"directorApproved";default->throw new IllegalStateException();};
  return docs.stream().allMatch(x->Boolean.TRUE.equals(prop(x,field)));
 }
 private List<Account> responsible(PracticeDeadline d){
  var e=d.getEnrollment();var result=new LinkedHashMap<Long,Account>();
  if(d.getStage()==PracticeDeadlineStage.SUBMISSION){var a=d.getKind()==PracticeDocumentKind.L4||d.getKind()==PracticeDocumentKind.L5?e.getCourse().getPracticeTutor():e.getAccount();if(a!=null)result.put(a.getId(),a);}
  else if(d.getStage()==PracticeDeadlineStage.PRACTICE_REVIEW){var a=e.getCourse().getPracticeTutor();if(a!=null)result.put(a.getId(),a);}
  else if(d.getStage()==PracticeDeadlineStage.INSTITUTIONAL_REVIEW){var a=InstitutionalAssignmentResolver.institutionalTutor(e);if(a!=null)result.put(a.getId(),a);}
  else for(var a:accounts.findActiveAnnouncementRecipientsByRoleNames(List.of("ROLE_DIRECTOR_PRACTICAS")))if(access.isDirectorForCourse(e.getCourse(),a))result.put(a.getId(),a);
  return result.values().stream().filter(a->!a.isDeleted()&&a.isEnabled()&&!a.isLocked()).toList();
 }
 private String state(PracticeDeadline d){
  var docs=documents(d);if(fulfilled(d,docs))return "FULFILLED";
  if(d.getEnrollment().isArchived()||d.getEnrollment().getStatus()==EnrollmentStatus.COMPLETED||d.getEnrollment().getStatus()==EnrollmentStatus.WITHDRAWN)return "CLOSED";
  if(d.getEnrollment().getStatus()!=EnrollmentStatus.APPROVED||!d.getEnrollment().getCourse().isActive()||d.getEnrollment().getCourse().isDeleted())return "PAUSED";
  if(d.getStage()!=PracticeDeadlineStage.SUBMISSION&&(docs.isEmpty()||docs.stream().anyMatch(x->List.of("DRAFT","NEEDS_CORRECTION").contains(documentState(x)))))return "WAITING_SUBMISSION";
  if(now().isAfter(d.getDueAt()))return "OVERDUE";
  if(!now().isBefore(d.getDueAt().minusHours(d.getReminderHours())))return "UPCOMING";
  return "PENDING";
 }
 private PracticeDeadlineResponse response(PracticeDeadline d){return new PracticeDeadlineResponse(d.getId(),d.getKind().name(),d.getStage().name(),d.getDueAt(),d.getReminderHours(),d.getReason(),d.getUpdatedBy().getUsername(),d.getUpdatedAt(),d.getRevision(),state(d),responsible(d).stream().map(Account::getUsername).toList());}
 @Transactional public int remind(Long id){
  var d=deadlines.findForUpdate(id).orElse(null);if(d==null)return 0;em.refresh(d);String phase=state(d);if(!List.of("UPCOMING","OVERDUE").contains(phase))return 0;
  int sent=0;for(var a:responsible(d)){
   if(notices.existsByDeadline_IdAndDeadlineRevisionAndRecipient_IdAndPhase(id,d.getRevision(),a.getId(),phase))continue;
   notices.saveAndFlush(PracticeDeadlineNotice.builder().deadline(d).deadlineRevision(d.getRevision()).recipient(a).phase(phase).sentAt(now()).build());
   notifications.createNotification(a,phase.equals("OVERDUE")?"Plazo de práctica vencido":"Próximo plazo de práctica",d.getKind().name().replace("L","L.")+" · "+stageLabel(d.getStage())+" · "+d.getDueAt()+" (hora de Ecuador)","#/practices/"+d.getEnrollment().getId()+"/deadlines","PRACTICE_DEADLINE");sent++;
  }return sent;
 }
 private String stageLabel(PracticeDeadlineStage stage){return switch(stage){case SUBMISSION->"Entrega o registro";case PRACTICE_REVIEW->"Revisión del tutor de prácticas";case INSTITUTIONAL_REVIEW->"Revisión del tutor institucional";case DIRECTOR_REVIEW->"Revisión de dirección";};}
 public List<Long> activeIds(){return deadlines.activeIds();}
}
