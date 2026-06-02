package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.GradeParallel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeParallelRepository
        extends JpaRepository<GradeParallel, Long> {

    List<GradeParallel> findByDeletedFalse();

    List<GradeParallel> findByGrade_IdAndDeletedFalse(Long gradeId);

    Optional<GradeParallel> findByIdAndDeletedFalse(Long id);

    boolean existsByGrade_IdAndLetterIgnoreCaseAndDeletedFalse(
            Long gradeId,
            String letter);
}
