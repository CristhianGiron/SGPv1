package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.feedback.FeedbackCommentResponse;
import com.sgp.systemsgp.dto.feedback.FeedbackHistoryResponse;
import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.FeedbackComment;
import com.sgp.systemsgp.model.FeedbackHistoryEntry;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.repository.FeedbackCommentRepository;
import com.sgp.systemsgp.repository.FeedbackHistoryEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedbackCommentService {

    private static final long DOCUMENT_SECTION_ENTRY_ID = 0L;

    private final FeedbackCommentRepository feedbackCommentRepository;
    private final FeedbackHistoryEntryRepository feedbackHistoryEntryRepository;

    @Transactional
    public void upsertDocumentFeedback(
            FeedbackDocumentType documentType,
            Long documentId,
            String sectionKey,
            String message,
            Account author,
            Integer reviewCycle) {

        upsertFeedback(
                documentType,
                documentId,
                sectionKey,
                DOCUMENT_SECTION_ENTRY_ID,
                message,
                author,
                reviewCycle);
    }

    @Transactional
    public void upsertEntryFeedback(
            FeedbackDocumentType documentType,
            Long documentId,
            String sectionKey,
            Long entryId,
            String message,
            Account author,
            Integer reviewCycle) {

        upsertFeedback(
                documentType,
                documentId,
                sectionKey,
                entryId,
                message,
                author,
                reviewCycle);
    }

    public List<FeedbackCommentResponse> listResponses(
            FeedbackDocumentType documentType,
            Long documentId) {

        if (documentId == null) {
            return List.of();
        }

        return feedbackCommentRepository
                .findByDocumentTypeAndDocumentIdOrderByEntryIdAscSectionKeyAscUpdatedAtAsc(
                        documentType,
                        documentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public Map<Long, List<FeedbackCommentResponse>> listResponsesByDocumentId(
            FeedbackDocumentType documentType,
            List<Long> documentIds) {

        if (documentIds == null || documentIds.isEmpty()) {
            return Map.of();
        }

        return feedbackCommentRepository
                .findByDocumentTypeAndDocumentIdInOrderByDocumentIdAscEntryIdAscSectionKeyAscUpdatedAtAsc(
                        documentType,
                        documentIds)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.groupingBy(
                        FeedbackCommentResponse::getDocumentId,
                        LinkedHashMap::new,
                        Collectors.toList()));
    }

    public List<FeedbackHistoryResponse> listHistoryResponses(
            FeedbackDocumentType documentType,
            Long documentId) {

        if (documentId == null) {
            return List.of();
        }

        return feedbackHistoryEntryRepository
                .findByDocumentTypeAndDocumentIdOrderByCreatedAtDesc(
                        documentType,
                        documentId)
                .stream()
                .map(this::mapHistoryToResponse)
                .toList();
    }

    public Map<Long, List<FeedbackHistoryResponse>> listHistoryResponsesByDocumentId(
            FeedbackDocumentType documentType,
            List<Long> documentIds) {

        if (documentIds == null || documentIds.isEmpty()) {
            return Map.of();
        }

        return feedbackHistoryEntryRepository
                .findByDocumentTypeAndDocumentIdInOrderByDocumentIdAscCreatedAtDesc(
                        documentType,
                        documentIds)
                .stream()
                .map(this::mapHistoryToResponse)
                .collect(Collectors.groupingBy(
                        FeedbackHistoryResponse::getDocumentId,
                        LinkedHashMap::new,
                        Collectors.toList()));
    }

    @Transactional
    public void clearDocumentFeedback(
            FeedbackDocumentType documentType,
            Long documentId) {

        if (documentId == null) {
            return;
        }

        feedbackCommentRepository.deleteByDocumentTypeAndDocumentId(
                documentType,
                documentId);
    }

    private void upsertFeedback(
            FeedbackDocumentType documentType,
            Long documentId,
            String sectionKey,
            Long entryId,
            String message,
            Account author,
            Integer reviewCycle) {

        if (message == null || message.isBlank()) {
            return;
        }

        String effectiveMessage = message.trim();
        Long effectiveEntryId = entryId != null ? entryId : DOCUMENT_SECTION_ENTRY_ID;
        Integer effectiveReviewCycle = reviewCycle != null ? reviewCycle : 0;
        String authorRole = roleLabel(author);

        FeedbackComment comment = feedbackCommentRepository
                .findByDocumentTypeAndDocumentIdAndSectionKeyAndEntryId(
                        documentType,
                        documentId,
                        sectionKey,
                        effectiveEntryId)
                .orElseGet(() -> FeedbackComment.builder()
                        .documentType(documentType)
                        .documentId(documentId)
                        .sectionKey(sectionKey)
                        .entryId(effectiveEntryId)
                        .build());

        comment.setMessage(effectiveMessage);
        comment.setAuthor(author);
        comment.setAuthorRole(authorRole);
        comment.setReviewCycle(effectiveReviewCycle);

        feedbackCommentRepository.save(comment);
        feedbackHistoryEntryRepository.save(FeedbackHistoryEntry.builder()
                .documentType(documentType)
                .documentId(documentId)
                .sectionKey(sectionKey)
                .entryId(effectiveEntryId)
                .reviewCycle(effectiveReviewCycle)
                .message(effectiveMessage)
                .author(author)
                .authorRole(authorRole)
                .build());
    }

    private FeedbackCommentResponse mapToResponse(FeedbackComment comment) {
        Account author = comment.getAuthor();

        return FeedbackCommentResponse.builder()
                .id(comment.getId())
                .documentType(comment.getDocumentType().name())
                .documentId(comment.getDocumentId())
                .sectionKey(comment.getSectionKey())
                .entryId(comment.getEntryId())
                .reviewCycle(comment.getReviewCycle())
                .message(comment.getMessage())
                .authorUsername(author != null ? author.getUsername() : null)
                .authorName(fullNameOrUsername(author))
                .authorRole(comment.getAuthorRole())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private FeedbackHistoryResponse mapHistoryToResponse(FeedbackHistoryEntry entry) {
        Account author = entry.getAuthor();

        return FeedbackHistoryResponse.builder()
                .id(entry.getId())
                .documentType(entry.getDocumentType().name())
                .documentId(entry.getDocumentId())
                .sectionKey(entry.getSectionKey())
                .entryId(entry.getEntryId())
                .reviewCycle(entry.getReviewCycle())
                .message(entry.getMessage())
                .authorUsername(author != null ? author.getUsername() : null)
                .authorName(fullNameOrUsername(author))
                .authorRole(entry.getAuthorRole())
                .createdAt(entry.getCreatedAt())
                .build();
    }

    private String roleLabel(Account account) {
        if (account == null) {
            return "Revisor";
        }

        if (hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            return "Director de practicas";
        }

        if (hasRole(account, RoleName.ROLE_TUTOR_INSTITUCIONAL)) {
            return "Tutor institucional";
        }

        if (hasRole(account, RoleName.ROLE_TUTOR_PRACTICAS)) {
            return "Tutor de practicas";
        }

        if (hasRole(account, RoleName.ROLE_ADMIN)) {
            return "Administrador";
        }

        return "Revisor";
    }

    private boolean hasRole(
            Account account,
            RoleName roleName) {

        return account.getRoles() != null
                && account.getRoles()
                .stream()
                .anyMatch(role -> roleName.name().equals(role.getName()));
    }

    private String fullNameOrUsername(Account account) {
        if (account == null) {
            return null;
        }

        Person person = account.getPerson();
        String fullName = person != null
                ? joinNames(person.getNames(), person.getLastNames())
                : null;

        return fullName != null ? fullName : account.getUsername();
    }

    private String joinNames(
            String names,
            String lastNames) {

        String joined = ((names != null ? names : "")
                + " "
                + (lastNames != null ? lastNames : ""))
                .trim();

        return joined.isBlank() ? null : joined;
    }
}
