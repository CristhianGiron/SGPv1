package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.ActivityEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ActivityEvaluationRepository
        extends JpaRepository<ActivityEvaluation, Long> {

    boolean existsByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    Optional<ActivityEvaluation> findByIdAndDeletedFalse(Long id);

    List<ActivityEvaluation> findByStudent_UsernameAndDeletedFalse(String username);

    List<ActivityEvaluation> findByCourse_PracticeTutor_UsernameAndDeletedFalse(
            String username);
}
