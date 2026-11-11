/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeIncidentService.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Implementa la lógica de aplicación de el módulo Practice Incident Service.
 */

package com.sgp.systemsgp.service.practiceincident;
import com.sgp.systemsgp.dto.enrollment.practiceincident.PracticeIncidentRequests;
import com.sgp.systemsgp.dto.enrollment.practiceincident.PracticeIncidentResponse;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.practiceincident.PracticeIncidentStatus;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.practiceincident.PracticeIncident;
import com.sgp.systemsgp.model.practiceincident.PracticeIncidentEvent;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.practiceincident.PracticeIncidentEventRepository;
import com.sgp.systemsgp.repository.practiceincident.PracticeIncidentRepository;
import com.sgp.systemsgp.service.EnrollmentService;
import com.sgp.systemsgp.service.NotificationService;
import com.sgp.systemsgp.service.PracticeAccessService;
import com.sgp.systemsgp.service.PracticeAuditService;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.enums.*;
import com.sgp.systemsgp.repository.*;
import com.sgp.systemsgp.dto.enrollment.*;
import com.sgp.systemsgp.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class PracticeIncidentService {
 private final PracticeIncidentRepository incidents;
 private final PracticeIncidentEventRepository events;
 private final EnrollmentRepository enrollments;
 private final AccountRepository accounts;
 private final PracticeAccessService access;
 private final EnrollmentService enrollmentService;
 private final PracticeAuditService audit;
 private final NotificationService notifications;
 private final jakarta.persistence.EntityManager entityManager;
 private Account actor(String username){return accounts.findByUsernameAndDeletedFalse(username).filter(a->a.isEnabled()&&!a.isLocked()).orElseThrow(()->new AccessDeniedException("Cuenta no habilitada"));}
 private Enrollment visible(Long id,Account actor){var e=enrollments.findById(id).orElseThrow(()->new NotFoundException("Práctica no encontrada"));if(!access.canViewEnrollment(e,actor))throw new AccessDeniedException("No puedes consultar esta práctica");return e;}
 private boolean manager(Enrollment e,Account a){return !access.isStudentForEnrollment(e,a)&&(access.isDirectorForCourse(e.getCourse(),a)||access.isPracticeTutorForEnrollment(e,a));}
 private boolean terminal(PracticeIncident i){return i.getStatus()==PracticeIncidentStatus.RESOLVED||i.getStatus()==PracticeIncidentStatus.REJECTED;}
 private void requireMutable(Enrollment e){if(e.isArchived()||e.getStatus()!=EnrollmentStatus.APPROVED&&e.getStatus()!=EnrollmentStatus.SUSPENDED)throw new BadRequestException("La práctica no admite nuevas gestiones de incidencias");}
 private PracticeIncident locked(Long id,Account actor){
  var initial=incidents.findById(id).orElseThrow(()->new NotFoundException("Incidencia no encontrada"));visible(initial.getEnrollment().getId(),actor);
  var current=enrollments.findForUpdate(initial.getEnrollment().getId()).orElseThrow();entityManager.refresh(current);
  if(!access.canViewEnrollment(current,actor))throw new AccessDeniedException("La asignación cambió");
  var result=incidents.findForUpdate(id).orElseThrow();entityManager.refresh(result);requireMutable(result.getEnrollment());
  if(terminal(result))throw new BadRequestException("La incidencia ya está cerrada");return result;
 }
 private void requireReason(String reason){if(reason==null||reason.isBlank()||reason.length()>2000)throw new BadRequestException("Indica un motivo de hasta 2000 caracteres");}
 public List<PracticeIncidentResponse> list(String username,Long enrollmentId){var actor=actor(username);visible(enrollmentId,actor);return incidents.findByEnrollment_IdOrderByCreatedAtDescIdDesc(enrollmentId).stream().map(this::response).toList();}
 public List<PracticeIncidentResponse.Responsible> responsibles(String username,Long enrollmentId){
  var actor=actor(username);var e=visible(enrollmentId,actor);if(!manager(e,actor))throw new AccessDeniedException("Solo los gestores pueden asignar responsables");
  return accounts.findActiveAnnouncementRecipientsByRoleNames(List.of("ROLE_DIRECTOR_PRACTICAS","ROLE_TUTOR_PRACTICAS","ROLE_TUTOR_INSTITUCIONAL")).stream()
    .filter(a->access.isDirectorForCourse(e.getCourse(),a)||access.isPracticeTutorForEnrollment(e,a)||access.isInstitutionalTutorForEnrollment(e,a))
    .map(a->new PracticeIncidentResponse.Responsible(a.getId(),a.getUsername(),a.getPerson()==null?a.getUsername():a.getPerson().getNames()+" "+a.getPerson().getLastNames())).toList();
 }
 @Transactional public PracticeIncidentResponse create(String username,Long enrollmentId,PracticeIncidentRequests.Create request){
  var a=actor(username);visible(enrollmentId,a);var e=enrollments.findForUpdate(enrollmentId).orElseThrow();entityManager.refresh(e);if(!access.canViewEnrollment(e,a))throw new AccessDeniedException("La asignación cambió");requireMutable(e);
  var now=LocalDateTime.now();var i=incidents.saveAndFlush(PracticeIncident.builder().enrollment(e).type(request.type()).status(PracticeIncidentStatus.OPEN)
    .title(request.title().strip()).description(request.description().strip()).createdBy(a).createdAt(now).updatedAt(now).build());
  event(i,a,null,"Incidencia registrada",null);notifyManagers(e,"Nueva incidencia: "+i.getTitle());return response(i);
 }
 @Transactional public PracticeIncidentResponse assign(String username,Long id,PracticeIncidentRequests.Assign request){
  var a=actor(username);var i=locked(id,a);if(!manager(i.getEnrollment(),a))throw new AccessDeniedException("No puedes asignar esta incidencia");requireReason(request.reason());
  var target=accounts.findByIdAndDeletedFalse(request.responsibleId()).filter(t->t.isEnabled()&&!t.isLocked()).orElseThrow(()->new BadRequestException("Responsable no habilitado"));
  var e=i.getEnrollment();if(access.isStudentForEnrollment(e,target))throw new BadRequestException("El estudiante no puede ser responsable de su propia incidencia");
  if(!access.isDirectorForCourse(e.getCourse(),target)&&!access.isPracticeTutorForEnrollment(e,target)&&!access.isInstitutionalTutorForEnrollment(e,target))throw new BadRequestException("El responsable debe estar asignado a esta práctica");
  var before=i.getStatus();i.setResponsible(target);i.setStatus(PracticeIncidentStatus.ASSIGNED);event(i,a,before,request.reason(),"Responsable: "+target.getUsername());
  notifications.createNotification(target,"Incidencia asignada",i.getTitle(),link(e),"INCIDENT_ASSIGNED");return response(i);
 }
 @Transactional public PracticeIncidentResponse evaluate(String username,Long id,PracticeIncidentRequests.Reason request){
  var a=actor(username);var i=locked(id,a);requireReason(request.reason());
  if(i.getStatus()!=PracticeIncidentStatus.ASSIGNED)throw new BadRequestException("Asigna un responsable antes de evaluar");
  if(!Objects.equals(i.getResponsible().getId(),a.getId())&&!access.isDirectorForCourse(i.getEnrollment().getCourse(),a))throw new AccessDeniedException("Solo el responsable o dirección puede iniciar la evaluación");
  var before=i.getStatus();i.setStatus(PracticeIncidentStatus.UNDER_REVIEW);event(i,a,before,request.reason(),null);return response(i);
 }
 @Transactional public PracticeIncidentResponse decide(String username,Long id,PracticeIncidentRequests.Decide request){
  var a=actor(username);var i=locked(id,a);requireReason(request.reason());
  if(request.approved()==null)throw new BadRequestException("Indica si la incidencia se aprueba o rechaza");
  if(access.isStudentForEnrollment(i.getEnrollment(),a)||!access.isDirectorForCourse(i.getEnrollment().getCourse(),a))throw new AccessDeniedException("Solo dirección de la carrera puede resolver o rechazar");
  if(i.getStatus()!=PracticeIncidentStatus.UNDER_REVIEW)throw new BadRequestException("La incidencia debe estar en evaluación");
  String effects=request.approved()?enrollmentService.applyIncidentDecision(username,i.getEnrollment().getId(),i.getType(),request.targetGroupId()):"Sin cambios académicos";
  var before=i.getStatus();i.setStatus(request.approved()?PracticeIncidentStatus.RESOLVED:PracticeIncidentStatus.REJECTED);event(i,a,before,request.reason(),effects);
  notifications.createNotification(i.getCreatedBy(),"Incidencia "+(request.approved()?"resuelta":"rechazada"),i.getTitle(),link(i.getEnrollment()),"INCIDENT_DECIDED");
  if(i.getResponsible()!=null&&!i.getResponsible().getId().equals(i.getCreatedBy().getId()))notifications.createNotification(i.getResponsible(),"Incidencia cerrada",i.getTitle(),link(i.getEnrollment()),"INCIDENT_DECIDED");
  return response(i);
 }
 private String link(Enrollment e){return "#/practices/"+e.getId()+"/incidents";}
 private void notifyManagers(Enrollment e,String text){for(var a:accounts.findActiveAnnouncementRecipientsByRoleNames(List.of("ROLE_DIRECTOR_PRACTICAS","ROLE_TUTOR_PRACTICAS")))if(manager(e,a))notifications.createNotification(a,"Incidencia de práctica",text,link(e),"INCIDENT_OPENED");}
 private void event(PracticeIncident i,Account a,PracticeIncidentStatus before,String reason,String effects){
  i.setUpdatedAt(LocalDateTime.now());incidents.save(i);events.save(PracticeIncidentEvent.builder().incident(i).actor(a).previousStatus(before==null?null:before.name()).newStatus(i.getStatus().name()).reason(reason.strip()).effects(effects).createdAt(LocalDateTime.now()).build());
  audit.logEnrollmentAction(i.getEnrollment(),a,"INCIDENT_"+i.getStatus().name(),before==null?null:before.name(),i.getStatus().name(),i.getEnrollment().isArchived(),i.getEnrollment().isArchived(),"Incidencia "+i.getId()+": "+reason.strip());
 }
 private PracticeIncidentResponse response(PracticeIncident i){return new PracticeIncidentResponse(i.getId(),i.getEnrollment().getId(),i.getType().name(),i.getStatus().name(),i.getTitle(),i.getDescription(),i.getCreatedBy().getUsername(),i.getResponsible()==null?null:i.getResponsible().getId(),i.getResponsible()==null?null:i.getResponsible().getUsername(),i.getCreatedAt(),i.getUpdatedAt(),events.findByIncident_IdOrderByIdAsc(i.getId()).stream().map(e->new PracticeIncidentResponse.Event(e.getId(),e.getActor().getUsername(),e.getPreviousStatus(),e.getNewStatus(),e.getReason(),e.getEffects(),e.getCreatedAt())).toList());}
}
