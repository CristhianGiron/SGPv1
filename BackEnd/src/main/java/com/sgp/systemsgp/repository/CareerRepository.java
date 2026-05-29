package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Career;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CareerRepository
        extends JpaRepository<Career, Long> {

    boolean existsByCode(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    List<Career> findByFacultyId(Long facultyId);

    List<Career> findByDeletedFalse();

    Optional<Career> findByIdAndDeletedFalse(Long id);

    boolean existsByNameIgnoreCaseAndFacultyId(
            String name,
            Long facultyId);

    boolean existsByNameIgnoreCaseAndFacultyIdAndDeletedFalse(
            String name,
            Long facultyId);

    boolean existsByNameIgnoreCaseAndFacultyIdAndIdNotAndDeletedFalse(
            String name,
            Long facultyId,
            Long id);
}
