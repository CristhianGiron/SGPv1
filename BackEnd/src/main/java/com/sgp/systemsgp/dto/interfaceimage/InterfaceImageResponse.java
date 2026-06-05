package com.sgp.systemsgp.dto.interfaceimage;

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
public class InterfaceImageResponse {

    private Long id;

    private String title;

    private String description;

    private String placement;

    private Integer displayOrder;

    private boolean active;

    private String originalFilename;

    private String contentType;

    private Long fileSize;

    private String contentUrl;

    private String uploadedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
