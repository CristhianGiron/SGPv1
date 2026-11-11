/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDeadlineNoticeRepository.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Define las consultas de persistencia para el módulo Practice Deadline Notice Repository.
 */

package com.sgp.systemsgp.repository.practicedeadline;
import com.sgp.systemsgp.model.practicedeadline.PracticeDeadlineNotice;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PracticeDeadlineNoticeRepository extends JpaRepository<PracticeDeadlineNotice,Long> {
 boolean existsByDeadline_IdAndDeadlineRevisionAndRecipient_IdAndPhase(Long id,long revision,Long recipientId,String phase);
}
