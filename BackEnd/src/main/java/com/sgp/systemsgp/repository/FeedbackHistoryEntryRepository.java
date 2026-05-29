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
