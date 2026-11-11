/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FeedbackHistoryEntryRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para el módulo Feedback History Entry Repository.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.model.FeedbackHistoryEntry;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackHistoryEntryRepository
        extends JpaRepository<FeedbackHistoryEntry, Long> {

    @EntityGraph(attributePaths = {"author", "author.person"})
    List<FeedbackHistoryEntry> findByDocumentTypeAndDocumentIdOrderByCreatedAtDesc(
            FeedbackDocumentType documentType,
            Long documentId);

    @EntityGraph(attributePaths = {"author", "author.person"})
    List<FeedbackHistoryEntry> findByDocumentTypeAndDocumentIdInOrderByDocumentIdAscCreatedAtDesc(
            FeedbackDocumentType documentType,
            List<Long> documentIds);
}
