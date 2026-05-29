package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.enums.PracticeReportStatus;
import com.sgp.systemsgp.model.PracticeReport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PracticeReportRepository
        extends JpaRepository<PracticeReport, Long> {

    boolean existsByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    Optional<PracticeReport> findByIdAndDeletedFalse(Long id);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<PracticeReport> findByStudent_UsernameAndCourse_ActiveTrueAndCourse_DeletedFalseAndDeletedFalse(
            String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<PracticeReport> findByCourse_PracticeTutor_UsernameAndStatusAndCourse_ActiveTrueAndCourse_DeletedFalseAndDeletedFalse(
            String username,
            PracticeReportStatus status);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<PracticeReport> findByStatusInAndDeletedFalse(
            List<PracticeReportStatus> statuses);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<PracticeReport> findByDeletedFalse();
}
