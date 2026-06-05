package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.enrollment.ArchivePracticeBatchRequest;
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
                        Authentication authentication,

                        @PathVariable Long id) {

                return enrollmentService.approve(
                                authentication.getName(),
                                id);
        }

        /*
         * RECHAZAR INSCRIPCIÓN
         */
        @PatchMapping("/api/enrollments/{id}/reject")

        @PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")

        public EnrollmentResponse reject(
                        Authentication authentication,

                        @PathVariable Long id) {

                return enrollmentService.reject(
                                authentication.getName(),
                                id);
        }

        /*
         * CONCLUIR PRACTICA
         */
        @PatchMapping("/api/enrollments/{id}/complete")

        @PreAuthorize("hasRole('DIRECTOR_PRACTICAS')")

        public EnrollmentResponse complete(
                        Authentication authentication,

                        @PathVariable Long id) {

                return enrollmentService.complete(
                                authentication.getName(),
                                id);
        }

        /*
         * REABRIR PRACTICA CONCLUIDA
         */
        @PatchMapping("/api/enrollments/{id}/reopen")

        @PreAuthorize("hasRole('DIRECTOR_PRACTICAS')")

        public EnrollmentResponse reopen(
                        Authentication authentication,

                        @PathVariable Long id) {

                return enrollmentService.reopen(
                                authentication.getName(),
                                id);
        }

        /*
         * ARCHIVAR PRACTICA CONCLUIDA
         */
        @PatchMapping("/api/enrollments/{id}/archive")

        @PreAuthorize("hasRole('ADMIN')")

        public EnrollmentResponse archive(
                        Authentication authentication,

                        @PathVariable Long id) {

                return enrollmentService.archive(
                                authentication.getName(),
                                id);
        }

        /*
         * DESARCHIVAR PRACTICA CONCLUIDA
         */
        @PatchMapping("/api/enrollments/{id}/unarchive")

        @PreAuthorize("hasRole('ADMIN')")

        public EnrollmentResponse unarchive(
                        Authentication authentication,

                        @PathVariable Long id) {

                return enrollmentService.unarchive(
                                authentication.getName(),
                                id);
        }

        /*
         * ARCHIVAR TODAS LAS PRACTICAS VISIBLES CONCLUIDAS
         */
        @PatchMapping("/api/enrollments/archive-completed")

        @PreAuthorize("hasRole('ADMIN')")

        public List<EnrollmentResponse> archiveAllCompleted(
                        Authentication authentication) {

                return enrollmentService.archiveAllCompleted(
                                authentication.getName());
        }

        /*
         * ARCHIVAR O DESARCHIVAR PRACTICAS CONCLUIDAS POR LOTE
         */
        @PatchMapping("/api/enrollments/archive-batch")

        @PreAuthorize("hasRole('ADMIN')")

        public List<EnrollmentResponse> archiveBatch(
                        Authentication authentication,

                        @RequestBody ArchivePracticeBatchRequest request) {

                return enrollmentService.archiveBatch(
                                authentication.getName(),
                                request);
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

        /*
         * LISTA DIRECTA DE PRACTICAS
         */
        @GetMapping("/api/enrollments/practices")

        @PreAuthorize("hasAnyRole('ESTUDIANTE', 'ADMIN', 'DIRECTOR_PRACTICAS', 'TUTOR_PRACTICAS', 'TUTOR_INSTITUCIONAL')")

        public List<EnrollmentResponse> practiceEnrollments(

                        Authentication authentication) {

                return enrollmentService.practiceEnrollments(
                                authentication.getName());
        }
}
