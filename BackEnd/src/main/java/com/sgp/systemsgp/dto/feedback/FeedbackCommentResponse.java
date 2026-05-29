package com.sgp.systemsgp.dto.feedback;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackCommentResponse {

    private Long id;

    private String documentType;

    private Long documentId;

    private String sectionKey;

    private Long entryId;

    private Integer reviewCycle;

    private String message;

    private String authorUsername;

    private String authorName;

    private String authorRole;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
