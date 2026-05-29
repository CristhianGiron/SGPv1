package com.sgp.systemsgp.dto.notification;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {

    private Long id;

    private String title;

    private String message;

    private String link;

    private String type;

    private boolean read;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
