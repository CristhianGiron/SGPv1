package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CourseGroupRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.SubjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;
import java.util.Set;

class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseGroupRepository courseGroupRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private NotificationService notificationService;

    private EnrollmentService enrollmentService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        enrollmentService = new EnrollmentService(
                enrollmentRepository,
                accountRepository,
                courseRepository,
                courseGroupRepository,
                subjectRepository,
                notificationService);
    }

    @Test
    void approveRejectsNonPendingEnrollment() {

        Enrollment enrollment = Enrollment.builder()
                .id(1L)
                .course(course())
                .status(EnrollmentStatus.APPROVED)
                .build();

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));
        when(accountRepository.findByUsernameAndDeletedFalse("admin"))
                .thenReturn(Optional.of(admin()));

        assertThatThrownBy(() -> enrollmentService.approve("admin", 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo se pueden gestionar inscripciones pendientes");

        verify(enrollmentRepository, never())
                .save(any(Enrollment.class));
    }

    @Test
    void rejectRejectsNonPendingEnrollment() {

        Enrollment enrollment = Enrollment.builder()
                .id(1L)
                .course(course())
                .status(EnrollmentStatus.REJECTED)
                .build();

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));
        when(accountRepository.findByUsernameAndDeletedFalse("admin"))
                .thenReturn(Optional.of(admin()));

        assertThatThrownBy(() -> enrollmentService.reject("admin", 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo se pueden gestionar inscripciones pendientes");

        verify(enrollmentRepository, never())
                .save(any(Enrollment.class));
    }

    @Test
    void cancelRejectsNonPendingEnrollment() {

        Enrollment enrollment = Enrollment.builder()
                .id(1L)
                .account(Account.builder()
                        .username("ana")
                        .build())
                .course(course())
                .status(EnrollmentStatus.APPROVED)
                .build();

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));
        when(accountRepository.findByUsernameAndDeletedFalse("admin"))
                .thenReturn(Optional.of(admin()));

        assertThatThrownBy(() -> enrollmentService.cancel(1L, "ana"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo puedes cancelar inscripciones pendientes");

        verify(enrollmentRepository, never())
                .delete(any(Enrollment.class));
    }

    @Test
    void approveNotifiesStudent() {

        Account student = Account.builder()
                .id(10L)
                .username("ana")
                .build();
        Enrollment enrollment = Enrollment.builder()
                .id(1L)
                .account(student)
                .course(course())
                .status(EnrollmentStatus.PENDING)
                .build();

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));
        when(accountRepository.findByUsernameAndDeletedFalse("admin"))
                .thenReturn(Optional.of(admin()));

        when(enrollmentRepository.findByAccount_IdAndStatusInAndCourse_ActiveTrueAndCourse_DeletedFalse(
                10L,
                List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED)))
                .thenReturn(List.of(enrollment));

        when(enrollmentRepository.countByCourse_IdAndStatus(1L, EnrollmentStatus.APPROVED))
                .thenReturn(0L);

        assertThat(enrollmentService.approve("admin", 1L).getStatus())
                .isEqualTo(EnrollmentStatus.APPROVED.name());

        verify(enrollmentRepository)
                .save(enrollment);

        verify(notificationService)
                .notifyEnrollmentApproved(enrollment);
    }

    private Course course() {

        return Course.builder()
                .id(1L)
                .name("Curso Test")
                .capacity(10)
                .active(true)
                .locked(false)
                .deleted(false)
                .build();
    }

    private Account admin() {

        return Account.builder()
                .id(99L)
                .username("admin")
                .roles(Set.of(Role.builder()
                        .name(RoleName.ROLE_ADMIN.name())
                        .build()))
                .enabled(true)
                .locked(false)
                .deleted(false)
                .build();
    }
}
