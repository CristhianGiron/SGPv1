package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Faculty;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FacultyRepository
        extends JpaRepository<Faculty, Long> {

    boolean existsByCode(String code);

    List<Faculty> findByInstitutionId(Long institutionId);

    List<Faculty> findByDeletedFalse();

    Optional<Faculty> findByIdAndDeletedFalse(Long id);
}
