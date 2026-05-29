package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.CourseGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseGroupRepository extends JpaRepository<CourseGroup, Long> {

    List<CourseGroup> findByCourse_IdAndDeletedFalse(Long courseId);

    Optional<CourseGroup> findByIdAndDeletedFalse(Long id);

    boolean existsByCourse_IdAndNameIgnoreCaseAndDeletedFalse(Long courseId, String name);
}
