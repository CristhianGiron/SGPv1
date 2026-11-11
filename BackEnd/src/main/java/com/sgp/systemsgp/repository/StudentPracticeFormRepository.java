/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          StudentPracticeFormRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para los instrumentos de entrevista y observación.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.StudentPracticeForm;
import com.sgp.systemsgp.enums.PracticeFormKind;
import com.sgp.systemsgp.enums.PracticeFormStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentPracticeFormRepository extends JpaRepository<StudentPracticeForm, Long> {

    List<StudentPracticeForm> findByTargetAccount_UsernameAndFormKindAndStatusInAndDeletedFalseOrderByCreatedAtDesc(
        String username, PracticeFormKind kind, java.util.Collection<PracticeFormStatus> statuses);

    Optional<StudentPracticeForm> findByIdAndDeletedFalse(Long id);

    List<StudentPracticeForm> findByStudent_UsernameAndDeletedFalseOrderByCreatedAtDesc(String username);

    List<StudentPracticeForm> findByStudent_UsernameAndFormKindAndDeletedFalseOrderByCreatedAtDesc(
            String username,
            PracticeFormKind formKind);

    List<StudentPracticeForm> findByTargetAccount_UsernameAndDeletedFalseOrderByCreatedAtDesc(String username);

    List<StudentPracticeForm> findByTargetAccount_UsernameAndFormKindAndDeletedFalseOrderByCreatedAtDesc(
            String username,
            PracticeFormKind formKind);

    List<StudentPracticeForm> findByTargetAccount_UsernameAndFormKindAndStatusAndDeletedFalseOrderByCreatedAtDesc(
            String username,
            PracticeFormKind formKind,
            PracticeFormStatus status);

    @Query("""
            SELECT DISTINCT form
            FROM StudentPracticeForm form
            JOIN form.enrollment enrollment
            JOIN enrollment.course course
            WHERE form.deleted = false
              AND form.formKind = :formKind
              AND form.status = :status
              AND (:globalAccess = true OR course.practiceTutor.username = :username)
            ORDER BY form.createdAt DESC
            """)
    List<StudentPracticeForm> findManagedByFormKindAndStatus(
            @Param("username") String username,
            @Param("globalAccess") boolean globalAccess,
            @Param("formKind") PracticeFormKind formKind,
            @Param("status") PracticeFormStatus status);
}
