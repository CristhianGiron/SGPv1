package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.enrollment.EnrollmentResponse;

import com.sgp.systemsgp.service.EnrollmentService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EnrollmentController {

        private final EnrollmentService enrollmentService;

        /*
         * INSCRIBIRSE A CURSO
         */
        @PostMapping("/api/courses/{courseId}/enroll")

        @PreAuthorize("hasRole('ESTUDIANTE')")

        public EnrollmentResponse enroll(

                        Authentication authentication,

                        @PathVariable Long courseId) {

                return enrollmentService.enroll(

                                authentication.getName(),

                                courseId);
        }

        /*
         * APROBAR INSCRIPCIÓN
         */
        @PatchMapping("/api/enrollments/{id}/approve")

        @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

        public EnrollmentResponse approve(

                        @PathVariable Long id) {

                return enrollmentService.approve(id);
        }

        /*
         * RECHAZAR INSCRIPCIÓN
         */
        @PatchMapping("/api/enrollments/{id}/reject")

        @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

        public EnrollmentResponse reject(

                        @PathVariable Long id) {

                return enrollmentService.reject(id);
        }

        /*
         * ASIGNAR GRUPO A INSCRIPCIÓN
         */
        @PatchMapping("/api/enrollments/{id}/group/{groupId}")

        @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR_PRACTICAS')")

        public EnrollmentResponse assignGroup(

                        Authentication authentication,

                        @PathVariable Long id,

                        @PathVariable Long groupId) {

                return enrollmentService.assignGroup(
                                authentication.getName(),
                                id,
                                groupId);
        }

        /*
         * CANCELAR MI INSCRIPCIÓN
         */
        @DeleteMapping("/api/enrollments/{id}")

        @PreAuthorize("hasRole('ESTUDIANTE')")

        public void cancel(

                        Authentication authentication,

                        @PathVariable Long id) {

                enrollmentService.cancel(
                                id,
                                authentication.getName());
        }

        /*
         * VER INSCRITOS EN CURSO
         */
        @GetMapping("/api/courses/{courseId}/enrollments")

        @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS', 'TUTOR_PRACTICAS')")

        public List<EnrollmentResponse> getEnrollments(

                        Authentication authentication,

                        @PathVariable Long courseId) {

                return enrollmentService.getCourseEnrollments(
                                authentication.getName(),
                                courseId);
        }

        /*
         * MIS INSCRIPCIONES
         */
        @GetMapping("/api/enrollments/me")

        @PreAuthorize("hasRole('ESTUDIANTE')")

        public List<EnrollmentResponse> myEnrollments(

                        Authentication authentication) {

                return enrollmentService.myEnrollments(
                                authentication.getName());
        }

        /*
         * INSCRIPCIONES APROBADAS GESTIONADAS
         */
        @GetMapping("/api/enrollments/managed")

        @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS', 'TUTOR_PRACTICAS', 'TUTOR_INSTITUCIONAL')")

        public List<EnrollmentResponse> managedEnrollments(

                        Authentication authentication) {

                return enrollmentService.managedEnrollments(
                                authentication.getName());
        }
}
