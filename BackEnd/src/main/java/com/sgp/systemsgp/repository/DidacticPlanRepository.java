package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.DidacticPlan;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DidacticPlanRepository extends JpaRepository<DidacticPlan, Long> {

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    Optional<DidacticPlan> findByIdAndDeletedFalse(Long id);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    List<DidacticPlan> findByStudent_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    List<DidacticPlan> findByEnrollment_Group_InstitutionalTutor_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    List<DidacticPlan> findByCourse_InstitutionalTutor_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    List<DidacticPlan> findByCourse_PracticeTutor_UsernameAndDeletedFalse(String username);

    @EntityGraph(attributePaths = {
            "enrollment",
            "student",
            "course",
            "educationalInstitution",
            "author",
            "sourcePlan",
            "recommendedBy"
    })
    List<DidacticPlan> findByDeletedFalse();
}
