/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeIncidentController.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Expone las operaciones HTTP relacionadas con el módulo Practice Incident Controller.
 */

package com.sgp.systemsgp.controller.practiceincident;
import com.sgp.systemsgp.dto.enrollment.practiceincident.PracticeIncidentRequests;
import com.sgp.systemsgp.dto.enrollment.practiceincident.PracticeIncidentResponse;
import com.sgp.systemsgp.service.practiceincident.PracticeIncidentService;
import com.sgp.systemsgp.dto.enrollment.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequiredArgsConstructor
public class PracticeIncidentController {
 private final PracticeIncidentService service;
 @GetMapping("/api/enrollments/{enrollmentId}/incidents") public List<PracticeIncidentResponse> list(Authentication a,@PathVariable Long enrollmentId){return service.list(a.getName(),enrollmentId);}
 @PostMapping("/api/enrollments/{enrollmentId}/incidents") public PracticeIncidentResponse create(Authentication a,@PathVariable Long enrollmentId,@Valid @RequestBody PracticeIncidentRequests.Create r){return service.create(a.getName(),enrollmentId,r);}
 @GetMapping("/api/enrollments/{enrollmentId}/incidents/responsibles") public List<PracticeIncidentResponse.Responsible> responsibles(Authentication a,@PathVariable Long enrollmentId){return service.responsibles(a.getName(),enrollmentId);}
 @PatchMapping("/api/incidents/{id}/assign") public PracticeIncidentResponse assign(Authentication a,@PathVariable Long id,@Valid @RequestBody PracticeIncidentRequests.Assign r){return service.assign(a.getName(),id,r);}
 @PatchMapping("/api/incidents/{id}/evaluate") public PracticeIncidentResponse evaluate(Authentication a,@PathVariable Long id,@Valid @RequestBody PracticeIncidentRequests.Reason r){return service.evaluate(a.getName(),id,r);}
 @PatchMapping("/api/incidents/{id}/decide") public PracticeIncidentResponse decide(Authentication a,@PathVariable Long id,@Valid @RequestBody PracticeIncidentRequests.Decide r){return service.decide(a.getName(),id,r);}
}
