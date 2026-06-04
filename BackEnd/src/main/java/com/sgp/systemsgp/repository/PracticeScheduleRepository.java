package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.PracticeSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PracticeScheduleRepository
        extends JpaRepository<PracticeSchedule, Long> {

    boolean existsByEnrollment_IdAndDeletedFalse(Long enrollmentId);

    Optional<PracticeSchedule> findByIdAndDeletedFalse(Long id);

    List<PracticeSchedule> findByStudent_UsernameAndDeletedFalse(
            String username);

    List<PracticeSchedule> findByCourse_InstitutionalTutor_UsernameAndDeletedFalse(
            String username);

    List<PracticeSchedule> findByEnrollment_Group_InstitutionalTutor_UsernameAndDeletedFalse(
            String username);

    List<PracticeSchedule> findByCourse_PracticeTutor_UsernameAndDeletedFalse(
            String username);

    List<PracticeSchedule> findByEducationalInstitution_IdAndDeletedFalse(
            Long institutionId);

    List<PracticeSchedule> findByDeletedFalse();
}
