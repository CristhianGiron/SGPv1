package com.sgp.systemsgp.model;

import com.sgp.systemsgp.enums.FeedbackDocumentType;
import com.sgp.systemsgp.model.listener.AuditEntityListener;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "feedback_comments",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_feedback_comment_target",
                columnNames = {
                        "document_type",
                        "document_id",
                        "section_key",
                        "entry_id"
                }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditEntityListener.class)
public class FeedbackComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 80)
    private FeedbackDocumentType documentType;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "section_key", nullable = false, length = 120)
    private String sectionKey;

    @Column(name = "entry_id", nullable = false)
    @Builder.Default
    private Long entryId = 0L;

    @Column(name = "review_cycle", nullable = false)
    @Builder.Default
    private Integer reviewCycle = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private Account author;

    @Column(length = 120)
    private String authorRole;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String message;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
