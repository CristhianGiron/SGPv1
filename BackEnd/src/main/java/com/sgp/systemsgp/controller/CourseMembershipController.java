/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseMembershipController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con los paralelos académicos.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.course.CourseStudentResponse;
import com.sgp.systemsgp.service.CourseMembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/courses/{courseId}") @RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
public class CourseMembershipController {
    private final CourseMembershipService memberships;
    @GetMapping("/students")
    public List<CourseStudentResponse> roster(Authentication actor,@PathVariable Long courseId){return memberships.roster(actor.getName(),courseId);}
    @GetMapping("/student-candidates")
    public Page<CourseStudentResponse> candidates(Authentication actor,@PathVariable Long courseId,@PageableDefault(size=50) Pageable pageable){return memberships.candidates(actor.getName(),courseId,pageable);}
    @PutMapping("/students/{studentId}")
    public CourseStudentResponse assign(Authentication actor,@PathVariable Long courseId,@PathVariable Long studentId){return memberships.assign(actor.getName(),courseId,studentId);}
    @DeleteMapping("/students/{studentId}")
    public void remove(Authentication actor,@PathVariable Long courseId,@PathVariable Long studentId){memberships.remove(actor.getName(),courseId,studentId);}
}
