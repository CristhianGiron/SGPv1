/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDocumentBaselineService.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Implementa la lógica de aplicación de el módulo Practice Document Baseline Service.
 */

package com.sgp.systemsgp.service.documentversion;
import com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.ActivityEvaluationRepository;
import com.sgp.systemsgp.repository.ActivityPlanRepository;
import com.sgp.systemsgp.repository.CompletedActivityRecordRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.FinalReportRepository;
import com.sgp.systemsgp.repository.PracticeFollowUpReportRepository;
import com.sgp.systemsgp.repository.PracticeReportRepository;
import com.sgp.systemsgp.service.ActivityEvaluationService;
import com.sgp.systemsgp.service.ActivityPlanService;
import com.sgp.systemsgp.service.CompletedActivityRecordService;
import com.sgp.systemsgp.service.FinalReportService;
import com.sgp.systemsgp.service.PracticeAccessService;
import com.sgp.systemsgp.service.PracticeFollowUpReportService;
import com.sgp.systemsgp.service.PracticeReportService;
import com.sgp.systemsgp.repository.*;
import com.sgp.systemsgp.enums.*;
import com.sgp.systemsgp.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
@Service @RequiredArgsConstructor @Transactional
public class PracticeDocumentBaselineService {
 private final EnrollmentRepository enrollments;
 private final AccountRepository accounts;
 private final PracticeAccessService access;
 private final PracticeDocumentVersionService versions;
 private final PracticeReportRepository reports;
 private final PracticeReportService reportService;
 private final ActivityPlanRepository plans;
 private final ActivityPlanService planService;
 private final FinalReportRepository finals;
 private final FinalReportService finalService;
 private final ActivityEvaluationRepository evaluations;
 private final ActivityEvaluationService evaluationService;
 private final PracticeFollowUpReportRepository followUps;
 private final PracticeFollowUpReportService followUpService;
 private final CompletedActivityRecordRepository records;
 private final CompletedActivityRecordService recordService;
 public int capture(String username,Long id){
  var e=enrollments.findForUpdate(id).orElseThrow(()->new NotFoundException("Práctica no encontrada"));
  var a=accounts.findByUsernameAndDeletedFalse(username).orElseThrow(()->new AccessDeniedException("Cuenta no disponible"));
  if(!access.canViewEnrollment(e,a)||!access.isAdmin(a)&&!access.isDirectorForCourse(e.getCourse(),a)&&!access.isPracticeTutorForEnrollment(e,a)&&!access.isInstitutionalTutorForEnrollment(e,a))throw new AccessDeniedException("No puedes conservar este expediente");
  int before=versions.list(id,username).size();
  for(var doc:reports.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(id)){
   if(!"APPROVED".equals(doc.getStatus().name()))continue;
   try{var snapshot=reportService.getById(doc.getId(),username);versions.baseline(PracticeDocumentKind.L1,doc.getId(),e,username,snapshot,()->reportService.exportApprovedPdf(doc.getId(),username));}
   catch(AccessDeniedException ex){/* A role may consult only part of the documents of a practice. */}
  }
  for(var doc:plans.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(id)){
   if(!"APPROVED".equals(doc.getStatus().name()))continue;
   try{var snapshot=planService.getById(doc.getId(),username);versions.baseline(PracticeDocumentKind.L2,doc.getId(),e,username,snapshot,()->planService.exportApprovedPdf(doc.getId(),username));}
   catch(AccessDeniedException ex){/* A role may consult only part of the documents of a practice. */}
  }
  for(var doc:finals.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(id)){
   if(!"APPROVED".equals(doc.getStatus().name()))continue;
   try{var snapshot=finalService.getById(doc.getId(),username);versions.baseline(PracticeDocumentKind.L3,doc.getId(),e,username,snapshot,doc.getLetterheadImage()==null?null:()->finalService.exportApprovedPdf(doc.getId(),username));}
   catch(AccessDeniedException ex){/* A role may consult only part of the documents of a practice. */}
  }
  for(var doc:evaluations.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(id)){
   try{var snapshot=evaluationService.getById(doc.getId(),username);versions.baseline(PracticeDocumentKind.L4,doc.getId(),e,username,snapshot,()->evaluationService.exportPdf(doc.getId(),username));}
   catch(AccessDeniedException ex){/* A role may consult only part of the documents of a practice. */}
  }
  for(var doc:followUps.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(id)){
   try{var snapshot=followUpService.getById(doc.getId(),username);versions.baseline(PracticeDocumentKind.L5,doc.getId(),e,username,snapshot,()->followUpService.exportPdf(doc.getId(),username));}
   catch(AccessDeniedException ex){/* A role may consult only part of the documents of a practice. */}
  }
  for(var doc:records.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(id)){
   if(!"APPROVED".equals(doc.getStatus().name()))continue;
   try{var snapshot=recordService.getById(doc.getId(),username);versions.baseline(PracticeDocumentKind.L6,doc.getId(),e,username,snapshot,()->recordService.exportApprovedPdf(doc.getId(),username));}
   catch(AccessDeniedException ex){/* A role may consult only part of the documents of a practice. */}
  }
  return versions.list(id,username).size()-before;
 }
}
