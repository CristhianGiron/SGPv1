/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDeadlineController.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Expone las operaciones HTTP relacionadas con el módulo Practice Deadline Controller.
 */

package com.sgp.systemsgp.controller.practicedeadline;
import com.sgp.systemsgp.dto.enrollment.practicedeadline.PracticeDeadlineRequest;
import com.sgp.systemsgp.dto.enrollment.practicedeadline.PracticeDeadlineResponse;
import com.sgp.systemsgp.service.practicedeadline.PracticeDeadlineService;
import com.sgp.systemsgp.dto.enrollment.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
@RestController @RequiredArgsConstructor @RequestMapping("/api/enrollments/{enrollmentId}/deadlines")
public class PracticeDeadlineController {
 private final PracticeDeadlineService service;
 @GetMapping public List<PracticeDeadlineResponse> list(Authentication a,@PathVariable Long enrollmentId){return service.list(a.getName(),enrollmentId);}
 @PutMapping public PracticeDeadlineResponse save(Authentication a,@PathVariable Long enrollmentId,@Valid @RequestBody PracticeDeadlineRequest request){return service.save(a.getName(),enrollmentId,request);}
}
