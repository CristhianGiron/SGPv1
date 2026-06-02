package com.sgp.systemsgp.dto.practicephoto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticePhotoResponse {

    private Long id;

    private Long enrollmentId;

    private Long courseId;

    private String courseName;

    private Long studentId;

    private String studentUsername;

    private String studentFullName;

    private String studentIdentification;

    private LocalDate practiceDate;

    private String description;

    private String originalFilename;

    private String contentType;

    private Long fileSize;

    private String contentUrl;

    private String publicContentUrl;

    private String uploadedBy;

    private LocalDateTime uploadedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
