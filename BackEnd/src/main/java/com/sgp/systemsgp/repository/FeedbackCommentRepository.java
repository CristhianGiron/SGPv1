/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          FeedbackCommentRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para el módulo Feedback Comment Repository.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.model.FeedbackComment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeedbackCommentRepository
        extends JpaRepository<FeedbackComment, Long> {

    @EntityGraph(attributePaths = {"author", "author.person"})
    List<FeedbackComment> findByDocumentTypeAndDocumentIdOrderByEntryIdAscSectionKeyAscUpdatedAtAsc(
            FeedbackDocumentType documentType,
            Long documentId);

    @EntityGraph(attributePaths = {"author", "author.person"})
    List<FeedbackComment> findByDocumentTypeAndDocumentIdInOrderByDocumentIdAscEntryIdAscSectionKeyAscUpdatedAtAsc(
            FeedbackDocumentType documentType,
            List<Long> documentIds);

    Optional<FeedbackComment> findByDocumentTypeAndDocumentIdAndSectionKeyAndEntryId(
            FeedbackDocumentType documentType,
            Long documentId,
            String sectionKey,
            Long entryId);

    void deleteByDocumentTypeAndDocumentId(
            FeedbackDocumentType documentType,
            Long documentId);
}
