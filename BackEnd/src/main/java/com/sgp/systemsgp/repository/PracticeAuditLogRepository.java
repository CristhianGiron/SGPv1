/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeAuditLogRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para el módulo Practice Audit Log Repository.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.PracticeAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PracticeAuditLogRepository extends JpaRepository<PracticeAuditLog, Long> {
    java.util.List<PracticeAuditLog> findByEnrollment_IdOrderByCreatedAtDesc(Long enrollmentId);
}
