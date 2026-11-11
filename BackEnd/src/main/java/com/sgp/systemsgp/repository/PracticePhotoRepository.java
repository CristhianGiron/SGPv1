/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticePhotoRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para las evidencias fotográficas.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.PracticePhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PracticePhotoRepository
        extends JpaRepository<PracticePhoto, Long> {

    Optional<PracticePhoto> findByIdAndDeletedFalse(Long id);

    Optional<PracticePhoto> findByPublicTokenAndDeletedFalse(String publicToken);

    List<PracticePhoto> findByStudent_UsernameAndDeletedFalseOrderByUploadedAtDesc(
            String username);

    List<PracticePhoto> findByEnrollment_IdAndDeletedFalseOrderByUploadedAtDesc(
            Long enrollmentId);

    List<PracticePhoto> findByCourse_PracticeTutor_UsernameAndDeletedFalseOrderByUploadedAtDesc(
            String username);

    List<PracticePhoto> findByEnrollment_Course_PracticeTutor_UsernameAndDeletedFalseOrderByUploadedAtDesc(
            String username);

    List<PracticePhoto> findByCourse_InstitutionalTutor_UsernameAndDeletedFalseOrderByUploadedAtDesc(
            String username);

    List<PracticePhoto> findByEnrollment_Course_InstitutionalTutor_UsernameAndDeletedFalseOrderByUploadedAtDesc(
            String username);

    List<PracticePhoto> findByEnrollment_Group_InstitutionalTutor_UsernameAndDeletedFalseOrderByUploadedAtDesc(
            String username);

    List<PracticePhoto> findByDeletedFalseOrderByUploadedAtDesc();
}
