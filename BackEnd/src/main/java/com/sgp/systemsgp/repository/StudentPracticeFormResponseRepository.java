package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.StudentPracticeFormResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentPracticeFormResponseRepository extends JpaRepository<StudentPracticeFormResponse, Long> {

    boolean existsByForm_Id(Long formId);

    Optional<StudentPracticeFormResponse> findByForm_Id(Long formId);
}
