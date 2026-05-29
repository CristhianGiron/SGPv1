package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Subject;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository
        extends JpaRepository<Subject, Long> {

    List<Subject> findByAcademicCycle_Career_Id(Long careerId);

    List<Subject> findByGradeId(Long gradeId);

    List<Subject> findByDeletedFalse();

    Optional<Subject> findByIdAndDeletedFalse(Long id);

    boolean existsByCode(String code);

    Optional<Subject> findByCode(String code);

    List<Subject> findByAcademicCycleId(Long academicCycleId);

}
