/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeIncidentEventRepository.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Define las consultas de persistencia para el módulo Practice Incident Event Repository.
 */

package com.sgp.systemsgp.repository.practiceincident;
import com.sgp.systemsgp.model.practiceincident.PracticeIncidentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PracticeIncidentEventRepository extends JpaRepository<PracticeIncidentEvent,Long> {
 List<PracticeIncidentEvent> findByIncident_IdOrderByIdAsc(Long id);
}
