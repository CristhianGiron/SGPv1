package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop20ByRecipient_UsernameAndRecipient_DeletedFalseOrderByCreatedAtDesc(
            String username);

    long countByRecipient_UsernameAndReadFalseAndRecipient_DeletedFalse(String username);

    Optional<Notification> findByIdAndRecipient_Username(Long id, String username);

    List<Notification> findByRecipient_UsernameAndReadFalse(String username);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient.username = :username AND n.read = false")
    int markAllAsRead(@Param("username") String username);
}
