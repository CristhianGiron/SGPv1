/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeOfferingController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone la creación de prácticas y la inscripción de estudiantes por personal autorizado.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.enrollment.*;
import com.sgp.systemsgp.dto.course.CourseStudentResponse;
import com.sgp.systemsgp.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS','TUTOR_PRACTICAS')")
public class PracticeOfferingController {
    private final PracticeOfferingService practices;
    private final EnrollmentService enrollments;
    @GetMapping("/api/courses/{courseId}/practice-offerings")
    public List<PracticeOfferingResponse> list(Authentication a,@PathVariable Long courseId) { return practices.list(a.getName(),courseId); }
    @PostMapping("/api/courses/{courseId}/practice-offerings")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public PracticeOfferingResponse create(Authentication a,@PathVariable Long courseId,@Valid @RequestBody CreatePracticeOfferingRequest r) { return practices.create(a.getName(),courseId,r); }
    @GetMapping("/api/courses/{courseId}/practice-roster")
    public List<CourseStudentResponse> roster(Authentication a,@PathVariable Long courseId) { return practices.roster(a.getName(),courseId); }
    @PatchMapping("/api/practice-offerings/{id}/enrollment")
    public PracticeOfferingResponse toggle(Authentication a,@PathVariable Long id,@RequestParam boolean open) { return practices.setEnrollmentOpen(a.getName(),id,open); }
    @PostMapping("/api/practice-offerings/{id}/students")
    public EnrollmentResponse assign(Authentication a,@PathVariable Long id,@Valid @RequestBody AssignStudentRequest r) { return enrollments.assignStudent(a.getName(),id,r.studentId(),r.groupId()); }
}
