package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.StudentPracticeForm;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentPracticeFormRepository extends JpaRepository<StudentPracticeForm, Long> {

    Optional<StudentPracticeForm> findByIdAndDeletedFalse(Long id);

    List<StudentPracticeForm> findByStudent_UsernameAndDeletedFalseOrderByCreatedAtDesc(String username);

    List<StudentPracticeForm> findByTargetAccount_UsernameAndDeletedFalseOrderByCreatedAtDesc(String username);
}
