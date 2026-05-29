package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.AcademicCycle;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicCycleRepository
        extends JpaRepository<AcademicCycle, Long> {

    List<AcademicCycle> findByCareerId(Long careerId);

    List<AcademicCycle> findByDeletedFalse();

    List<AcademicCycle> findByDeletedFalseAndActiveTrue();

    Optional<AcademicCycle> findByIdAndDeletedFalse(Long id);

    boolean existsByNameIgnoreCaseAndCareerId(
            String name,
            Long careerId);
}
