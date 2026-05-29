package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository
        extends JpaRepository<Course, Long>,
                JpaSpecificationExecutor<Course> {

    boolean existsByCode(String code);

    List<Course> findByDeletedFalse();

    Optional<Course> findByIdAndDeletedFalse(Long id);

    @Query("""
            SELECT c
            FROM Course c
            LEFT JOIN FETCH c.institutionalTutor it
            LEFT JOIN FETCH it.institution
            LEFT JOIN FETCH c.practiceTutor pt
            LEFT JOIN FETCH pt.institution
            WHERE c.id = :id
              AND c.deleted = false
            """)
    Optional<Course> findByIdWithTutorsAndInstitutions(@Param("id") Long id);
}
