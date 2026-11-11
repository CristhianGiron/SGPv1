/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDocumentVersionController.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Expone las operaciones HTTP relacionadas con el módulo Practice Document Version Controller.
 */

package com.sgp.systemsgp.controller.documentversion;
import com.sgp.systemsgp.service.documentversion.PracticeDocumentVersionService;
import com.sgp.systemsgp.dto.enrollment.documentversion.PracticeDocumentVersionSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.util.List;
@RestController @RequiredArgsConstructor @RequestMapping("/api/enrollments/{enrollmentId}/document-versions")
public class PracticeDocumentVersionController {
 private final PracticeDocumentVersionService service;
 private final com.sgp.systemsgp.service.documentversion.PracticeDocumentBaselineService baseline;
 @PostMapping("/baseline")
 public java.util.Map<String,Integer> capture(Authentication a,@PathVariable Long enrollmentId){return java.util.Map.of("captured",baseline.capture(a.getName(),enrollmentId));}
 @GetMapping public List<PracticeDocumentVersionSummary> list(Authentication a,@PathVariable Long enrollmentId){return service.list(enrollmentId,a.getName());}
 @GetMapping("/{id}") public ResponseEntity<String> snapshot(Authentication a,@PathVariable Long enrollmentId,@PathVariable Long id){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.APPLICATION_JSON).body(service.snapshot(enrollmentId,id,a.getName()));}
 @GetMapping("/{id}/pdf") public ResponseEntity<byte[]> pdf(Authentication a,@PathVariable Long enrollmentId,@PathVariable Long id){return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.APPLICATION_PDF).body(service.pdf(enrollmentId,id,a.getName()));}
}
