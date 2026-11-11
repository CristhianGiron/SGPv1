/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDocumentVersionService.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Implementa la lógica de aplicación de el módulo Practice Document Version Service.
 */

package com.sgp.systemsgp.service.documentversion;
import com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.documentversion.PracticeDocumentVersion;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.documentversion.PracticeDocumentVersionRepository;
import com.sgp.systemsgp.service.PracticeAccessService;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.enums.*;
import com.sgp.systemsgp.repository.*;
import com.sgp.systemsgp.dto.enrollment.documentversion.PracticeDocumentVersionSummary;
import com.sgp.systemsgp.exception.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import java.util.*;
import java.time.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.function.Supplier;
@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class PracticeDocumentVersionService {
 private final PracticeDocumentVersionRepository versions;
 private final EnrollmentRepository enrollments;
 private final AccountRepository accounts;
 private final PracticeAccessService access;
 private final ObjectMapper mapper;
 private final EntityManager entityManager;
 private String hash(byte[] bytes){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
 @Transactional public void record(PracticeDocumentKind kind,Long documentId,Enrollment enrollment,String username,String event,Object snapshot,Supplier<byte[]> pdfSupplier){
  // All records for a practice serialize their numbering. The document's @Version rejects concurrent writes.
  var current=enrollments.findForUpdate(enrollment.getId()).orElseThrow(()->new NotFoundException("Práctica no encontrada"));
  entityManager.refresh(current);
  var properties=new org.springframework.beans.BeanWrapperImpl(snapshot);
  String capturedStatus=properties.isReadableProperty("status")?String.valueOf(properties.getPropertyValue("status")):null;
  boolean historicalCapture=event.equals("BASELINE")&&(kind==PracticeDocumentKind.L4||kind==PracticeDocumentKind.L5||"APPROVED".equals(capturedStatus));
  if(!historicalCapture)PracticeAccessService.requireOperationalEnrollment(current);
  var actor=accounts.findByUsernameAndDeletedFalse(username).orElseThrow(()->new NotFoundException("Cuenta no encontrada"));
  try{
   String json=mapper.writeValueAsString(snapshot);var tree=mapper.readTree(json);
   String status=tree.hasNonNull("status")?tree.get("status").asText():"SAVED";
   byte[] pdf=pdfSupplier==null?null:pdfSupplier.get();
   versions.saveAndFlush(PracticeDocumentVersion.builder().enrollment(current).kind(kind).documentId(documentId)
    .revisionNumber(Math.toIntExact(versions.countByKindAndDocumentId(kind,documentId)+1)).actor(actor)
    .createdAt(LocalDateTime.now(ZoneId.of("America/Guayaquil"))).event(event).documentStatus(status)
    .snapshotJson(json).snapshotHash(hash(json.getBytes(StandardCharsets.UTF_8))).pdf(pdf).pdfHash(pdf==null?null:hash(pdf)).build());
  }catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new IllegalStateException("No se pudo preservar la versión documental",e);}
 }
 @Transactional public void baseline(PracticeDocumentKind kind,Long id,Enrollment enrollment,String actor,Object snapshot,Supplier<byte[]> pdf) {
  enrollments.findForUpdate(enrollment.getId()).orElseThrow();
  if(versions.countByKindAndDocumentId(kind,id)==0)record(kind,id,enrollment,actor,"BASELINE",snapshot,pdf);
 }
 public byte[] retainedPdf(PracticeDocumentKind kind,Long documentId){
  var version=versions.findFirstByKindAndDocumentIdAndPdfHashIsNotNullOrderByIdDesc(kind,documentId).orElse(null);
  if(version==null)return null;
  if(version.getPdf()==null||!hash(version.getPdf()).equals(version.getPdfHash()))throw new IllegalStateException("El PDF no supera la comprobación de integridad");
  return version.getPdf();
 }
 public boolean hasApproved(PracticeDocumentKind kind,Long id){return versions.existsByKindAndDocumentIdAndDocumentStatus(kind,id,"APPROVED");}
 private void requireView(Long id,String username){var a=accounts.findByUsernameAndDeletedFalse(username).orElseThrow(()->new AccessDeniedException("Cuenta no disponible"));var e=enrollments.findById(id).orElseThrow(()->new NotFoundException("Práctica no encontrada"));if(!access.canViewEnrollment(e,a))throw new AccessDeniedException("No puedes consultar este expediente");}
 private boolean allowed(Enrollment e,Account a,String kind,String status){
  if(access.isStudentForEnrollment(e,a))return true;
  boolean upper=access.isAdmin(a)||access.isDirectorForCourse(e.getCourse(),a)||access.isPracticeTutorForEnrollment(e,a);
  if(kind.equals("L4")||kind.equals("L5"))return upper;
  if(status.equals("DRAFT"))return false;
  return upper||kind.equals("L3")&&access.isInstitutionalTutorForEnrollment(e,a);
 }
 public List<PracticeDocumentVersionSummary> list(Long id,String username){requireView(id,username);var e=enrollments.findById(id).orElseThrow();var a=accounts.findByUsernameAndDeletedFalse(username).orElseThrow();return versions.summaries(id).stream().filter(v->allowed(e,a,v.kind(),v.documentStatus())).toList();}
 private PracticeDocumentVersion version(Long enrollmentId,Long id,String username){requireView(enrollmentId,username);var v=versions.findByIdAndEnrollment_Id(id,enrollmentId).orElseThrow(()->new NotFoundException("Versión no encontrada"));var a=accounts.findByUsernameAndDeletedFalse(username).orElseThrow();if(!allowed(v.getEnrollment(),a,v.getKind().name(),v.getDocumentStatus()))throw new AccessDeniedException("No puedes consultar esta versión documental");return v;}
 public String snapshot(Long enrollmentId,Long id,String username){var v=version(enrollmentId,id,username);if(!hash(v.getSnapshotJson().getBytes(StandardCharsets.UTF_8)).equals(v.getSnapshotHash()))throw new IllegalStateException("La versión no supera la comprobación de integridad");return v.getSnapshotJson();}
 public byte[] pdf(Long enrollmentId,Long id,String username){var v=version(enrollmentId,id,username);if(v.getPdf()==null)throw new NotFoundException("Esta versión no tiene PDF conservado");if(!hash(v.getPdf()).equals(v.getPdfHash()))throw new IllegalStateException("El PDF no supera la comprobación de integridad");return v.getPdf();}
}
