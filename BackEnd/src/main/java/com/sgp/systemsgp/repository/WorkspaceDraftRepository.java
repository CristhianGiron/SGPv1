/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          WorkspaceDraftRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para los borradores de trabajo.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.WorkspaceDraft;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WorkspaceDraftRepository extends JpaRepository<WorkspaceDraft, Long> {
    Optional<WorkspaceDraft> findByOwner_IdAndScope(Long ownerId, String scope);
}
