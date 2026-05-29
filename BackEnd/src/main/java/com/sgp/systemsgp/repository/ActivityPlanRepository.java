package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.enums.ActivityPlanStatus;
import com.sgp.systemsgp.model.ActivityPlan;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ActivityPlanRepository
        extends JpaRepository<ActivityPlan, Long> {

    boolean existsByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    Optional<ActivityPlan> findByIdAndDeletedFalse(Long id);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<ActivityPlan> findByStudent_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<ActivityPlan> findByCourse_PracticeTutor_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<ActivityPlan> findByStatusInAndDeletedFalse(
            List<ActivityPlanStatus> statuses);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "reviewedBy",
            "directorReviewedBy"
    })
    List<ActivityPlan> findByDeletedFalse();
}
