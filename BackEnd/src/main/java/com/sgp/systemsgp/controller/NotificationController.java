package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.notification.CreateAnnouncementRequest;
import com.sgp.systemsgp.dto.notification.NotificationResponse;
import com.sgp.systemsgp.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/me")
    public List<NotificationResponse> myNotifications(Authentication authentication) {
        return notificationService.getMyNotifications(authentication.getName());
    }

    @GetMapping("/me/count")
    public Map<String, Long> myNotificationsCount(Authentication authentication) {
        long count = notificationService.getUnreadCount(authentication.getName());

        return Map.of("count", count);
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(
            Authentication authentication,
            @PathVariable Long id) {

        return notificationService.markAsRead(id, authentication.getName());
    }

    @PatchMapping("/read-all")
    public Map<String, String> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return Map.of("status", "ok");
    }

    @PostMapping("/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Integer> sendAnnouncement(
            @Valid @RequestBody CreateAnnouncementRequest request) {

        int sent = notificationService.sendAnnouncement(request);

        return Map.of("sent", sent);
    }
}
