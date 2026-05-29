package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.PracticeFollowUpReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PracticeFollowUpReportRepository
        extends JpaRepository<PracticeFollowUpReport, Long> {

    boolean existsByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    Optional<PracticeFollowUpReport> findByIdAndDeletedFalse(Long id);

    List<PracticeFollowUpReport> findByStudent_UsernameAndDeletedFalse(
            String username);

    List<PracticeFollowUpReport> findByCourse_PracticeTutor_UsernameAndDeletedFalse(
            String username);
}
