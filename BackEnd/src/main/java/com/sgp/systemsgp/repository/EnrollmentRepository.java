package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.enums.EnrollmentStatus;

import com.sgp.systemsgp.model.Enrollment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrollmentRepository
                extends JpaRepository<Enrollment, Long> {

        /*
         * VERIFICAR INSCRIPCIÓN DUPLICADA
         */
        boolean existsByAccount_IdAndCourse_Id(
                        Long accountId,
                        Long courseId);

        /*
         * INSCRITOS DE UN CURSO
         */
        List<Enrollment> findByCourse_Id(
                        Long courseId);

        /*
         * INSCRIPCIONES DE UN USUARIO
         */
        List<Enrollment> findByAccount_Id(
                        Long accountId);

        List<Enrollment> findByAccount_UsernameAndStatus(
                        String username,
                        EnrollmentStatus status);

        List<Enrollment> findByAccount_UsernameAndStatusAndCourse_ActiveTrueAndCourse_DeletedFalse(
                        String username,
                        EnrollmentStatus status);

        List<Enrollment> findByAccount_IdAndStatusInAndCourse_ActiveTrueAndCourse_DeletedFalse(
                        Long accountId,
                        List<EnrollmentStatus> statuses);

        List<Enrollment> findByStatus(
                        EnrollmentStatus status);

        List<Enrollment> findByStatusIn(
                        List<EnrollmentStatus> statuses);

        List<Enrollment> findByCourse_PracticeTutor_UsernameAndStatus(
                        String username,
                        EnrollmentStatus status);

        List<Enrollment> findByCourse_PracticeTutor_UsernameAndStatusIn(
                        String username,
                        List<EnrollmentStatus> statuses);

        List<Enrollment> findByCourse_PracticeTutor_Username(
                        String username);

        List<Enrollment> findByCourse_InstitutionalTutor_UsernameAndStatus(
                        String username,
                        EnrollmentStatus status);

        List<Enrollment> findByCourse_InstitutionalTutor_UsernameAndStatusIn(
                        String username,
                        List<EnrollmentStatus> statuses);

        List<Enrollment> findByCourse_InstitutionalTutor_Username(
                        String username);

        List<Enrollment> findByGroup_InstitutionalTutor_UsernameAndStatus(
                        String username,
                        EnrollmentStatus status);

        List<Enrollment> findByGroup_InstitutionalTutor_UsernameAndStatusIn(
                        String username,
                        List<EnrollmentStatus> statuses);

        List<Enrollment> findByGroup_InstitutionalTutor_Username(
                        String username);

        /*
         * CONTAR APROBADOS
         */
        long countByCourse_IdAndStatus(
                        Long courseId,
                        EnrollmentStatus status);

        long countByGroup_IdAndStatus(
                        Long groupId,
                        EnrollmentStatus status);
}
