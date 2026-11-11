/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          NotificationServiceTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las notificaciones mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.ActivityPlan;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Role;
import java.util.Set;
import com.sgp.systemsgp.model.Notification;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.NotificationRepository;
import com.sgp.systemsgp.websocket.NotificationWebSocketHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private NotificationWebSocketHandler notificationWebSocketHandler;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        notificationService = new NotificationService(
                notificationRepository,
                accountRepository,
                notificationWebSocketHandler,
                new PracticeAccessService());
    }

    @Test
    void documentSubmissionNotifiesPracticeTutorDirectorAndAdmin() {

        Account tutor = account(1L, "tutor.practicas");
        Account admin = account(2L, "admin");
        Account director = account(3L, "director.practicas");
        Account student = account(4L, "student01");
        Career career = Career.builder().id(1L).build();
        director.setCareer(career);
        director.setRoles(Set.of(Role.builder().name("ROLE_DIRECTOR_PRACTICAS").build()));
        admin.setRoles(Set.of(Role.builder().name("ROLE_ADMIN").build()));
        Course course = Course.builder()
                .id(1L)
                .name("Curso de Practicas")
                .academicCycle(AcademicCycle.builder().career(career).build())
                .practiceTutor(tutor)
                .build();
        ActivityPlan plan = ActivityPlan.builder()
                .id(1L)
                .student(student)
                .studentFullName("Ana Loja")
                .course(course)
                .build();

        when(accountRepository.findActiveAnnouncementRecipientsByRoleNames(
                List.of("ROLE_ADMIN", "ROLE_DIRECTOR_PRACTICAS")))
                .thenReturn(List.of(admin, director));

        AtomicLong notificationIds = new AtomicLong(1L);
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> {
                    Notification notification = invocation.getArgument(0);
                    notification.setId(notificationIds.getAndIncrement());
                    return notification;
                });

        notificationService.notifyActivityPlanSubmitted(plan);

        ArgumentCaptor<Notification> captor =
                ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(3))
                .save(captor.capture());

        assertThat(captor.getAllValues())
                .extracting(notification -> notification.getRecipient().getUsername())
                .containsExactly(
                        "tutor.practicas",
                        "admin",
                        "director.practicas");

        assertThat(captor.getAllValues())
                .extracting(Notification::getType)
                .containsOnly("ACTIVITY_PLAN_SUBMITTED");

        verify(notificationWebSocketHandler)
                .sendNotification(eq("tutor.practicas"), any());
        verify(notificationWebSocketHandler)
                .sendNotification(eq("admin"), any());
        verify(notificationWebSocketHandler)
                .sendNotification(eq("director.practicas"), any());
    }

    private Account account(
            Long id,
            String username) {

        return Account.builder()
                .id(id)
                .username(username)
                .enabled(true)
                .locked(false)
                .deleted(false)
                .build();
    }
}
