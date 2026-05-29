package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Grade;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeRepository
        extends JpaRepository<Grade, Long> {

    List<Grade> findByInstitutionId(Long institutionId);

    List<Grade> findByDeletedFalse();

    Optional<Grade> findByIdAndDeletedFalse(Long id);

    boolean existsByCode(String code);

    Optional<Grade> findByCode(String code);
}
