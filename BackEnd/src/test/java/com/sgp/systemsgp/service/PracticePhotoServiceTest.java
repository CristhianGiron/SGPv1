package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.dto.practicephoto.PracticePhotoResponse;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.PracticePhoto;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.PracticePhotoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

class PracticePhotoServiceTest {

    @Mock
    private PracticePhotoRepository practicePhotoRepository;

    @Mock
    private EnrollmentRepository enrollmentRepository;

    @Mock
    private AccountRepository accountRepository;

    private PracticePhotoService practicePhotoService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        practicePhotoService = new PracticePhotoService(
                practicePhotoRepository,
                enrollmentRepository,
                accountRepository);
    }

    @Test
    void studentUploadsPhotoForApprovedEnrollment() {

        Account student = student();
        Enrollment enrollment = enrollment(
                student,
                institutionalTutor(),
                practiceTutor(),
                EnrollmentStatus.APPROVED);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "practica.jpg",
                "image/jpeg",
                new byte[] {1, 2, 3});

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(student));

        when(enrollmentRepository.findById(1L))
                .thenReturn(Optional.of(enrollment));

        when(practicePhotoRepository.save(any(PracticePhoto.class)))
                .thenAnswer(invocation -> {
                    PracticePhoto photo = invocation.getArgument(0);
                    photo.setId(1L);
                    return photo;
                });

        PracticePhotoResponse response = practicePhotoService.upload(
                "student01",
                1L,
                file,
                "Actividad en aula",
                LocalDate.of(2026, 5, 14));

        assertThat(response.getContentUrl())
                .isEqualTo("/api/practice-photos/1/content");

        assertThat(response.getStudentFullName())
                .isEqualTo("Ana Loja");

        assertThat(response.getContentType())
                .isEqualTo("image/jpeg");

        ArgumentCaptor<PracticePhoto> captor =
                ArgumentCaptor.forClass(PracticePhoto.class);

        verify(practicePhotoRepository)
                .save(captor.capture());

        assertThat(captor.getValue().getData())
                .containsExactly(1, 2, 3);
    }

    @Test
    void institutionalTutorSeesAssignedCoursePhotos() {

        Account student = student();
        Account institutionalTutor = institutionalTutor();
        Account practiceTutor = practiceTutor();
        PracticePhoto photo = photo(
                student,
                institutionalTutor,
                practiceTutor);

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.institucional"))
                .thenReturn(Optional.of(institutionalTutor));

        when(practicePhotoRepository
                .findByCourse_InstitutionalTutor_UsernameAndDeletedFalseOrderByUploadedAtDesc(
                        "tutor.institucional"))
                .thenReturn(List.of(photo));

        List<PracticePhotoResponse> response =
                practicePhotoService.reviewQueue("tutor.institucional");

        assertThat(response)
                .hasSize(1);

        assertThat(response.get(0).getCourseName())
                .isEqualTo("Curso de Practicas");
    }

    @Test
    void practiceTutorSeesUploadedPhotosGroupedByStudentScope() {

        Account student = student();
        Account institutionalTutor = institutionalTutor();
        Account practiceTutor = practiceTutor();
        PracticePhoto photo = photo(
                student,
                institutionalTutor,
                practiceTutor);

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(practiceTutor));

        when(practicePhotoRepository
                .findByDeletedFalseOrderByUploadedAtDesc())
                .thenReturn(List.of(photo));

        List<PracticePhotoResponse> response =
                practicePhotoService.reviewQueue("tutor.practicas");

        assertThat(response)
                .hasSize(1);

        assertThat(response.get(0).getStudentFullName())
                .isEqualTo("Ana Loja");
    }

    @Test
    void practiceTutorCanOpenPhotoWhenDirectPhotoCourseIsMissing() {

        Account student = student();
        Account institutionalTutor = institutionalTutor();
        Account practiceTutor = practiceTutor();
        PracticePhoto photo = photo(
                student,
                institutionalTutor,
                practiceTutor);
        photo.setCourse(null);

        when(practicePhotoRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(photo));

        when(accountRepository.findByUsernameAndDeletedFalse("tutor.practicas"))
                .thenReturn(Optional.of(practiceTutor));

        PracticePhotoResponse response = practicePhotoService.getById(
                1L,
                "tutor.practicas");

        assertThat(response.getCourseName())
                .isEqualTo("Curso de Practicas");
    }

    @Test
    void practiceTutorCanOpenUploadedPhotoEvenWhenCourseIsUnassigned() {

        PracticePhoto photo = photo(
                student(),
                institutionalTutor(),
                practiceTutor());

        Account otherTutor = Account.builder()
                .id(99L)
                .username("otro.tutor")
                .roles(Set.of(role(RoleName.ROLE_TUTOR_PRACTICAS)))
                .build();

        when(practicePhotoRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(photo));

        when(accountRepository.findByUsernameAndDeletedFalse("otro.tutor"))
                .thenReturn(Optional.of(otherTutor));

        PracticePhotoResponse response = practicePhotoService.getById(
                1L,
                "otro.tutor");

        assertThat(response.getStudentFullName())
                .isEqualTo("Ana Loja");
    }

    @Test
    void studentDeletesOwnPhoto() {

        PracticePhoto photo = photo(
                student(),
                institutionalTutor(),
                practiceTutor());

        when(practicePhotoRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(photo));

        when(accountRepository.findByUsernameAndDeletedFalse("student01"))
                .thenReturn(Optional.of(photo.getStudent()));

        practicePhotoService.delete(
                1L,
                "student01");

        assertThat(photo.isDeleted())
                .isTrue();

        assertThat(photo.getDeletedAt())
                .isNotNull();

        verify(practicePhotoRepository)
                .save(photo);
    }

    @Test
    void studentCannotDeleteAnotherStudentPhoto() {

        PracticePhoto photo = photo(
                student(),
                institutionalTutor(),
                practiceTutor());

        Account otherStudent = Account.builder()
                .id(99L)
                .username("other.student")
                .roles(Set.of(role(RoleName.ROLE_ESTUDIANTE)))
                .build();

        when(practicePhotoRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(photo));

        when(accountRepository.findByUsernameAndDeletedFalse("other.student"))
                .thenReturn(Optional.of(otherStudent));

        assertThatThrownBy(() -> practicePhotoService.delete(
                1L,
                "other.student"))
                .isInstanceOf(AccessDeniedException.class);
    }

    private PracticePhoto photo(
            Account student,
            Account institutionalTutor,
            Account practiceTutor) {

        Enrollment enrollment = enrollment(
                student,
                institutionalTutor,
                practiceTutor,
                EnrollmentStatus.APPROVED);

        return PracticePhoto.builder()
                .id(1L)
                .enrollment(enrollment)
                .student(student)
                .course(enrollment.getCourse())
                .uploadedBy(student)
                .originalFilename("practica.jpg")
                .contentType("image/jpeg")
                .fileSize(3L)
                .data(new byte[] {1, 2, 3})
                .build();
    }

    private Enrollment enrollment(
            Account student,
            Account institutionalTutor,
            Account practiceTutor,
            EnrollmentStatus status) {

        return Enrollment.builder()
                .id(1L)
                .account(student)
                .course(course(
                        institutionalTutor,
                        practiceTutor))
                .status(status)
                .build();
    }

    private Course course(
            Account institutionalTutor,
            Account practiceTutor) {

        return Course.builder()
                .id(1L)
                .name("Curso de Practicas")
                .institutionalTutor(institutionalTutor)
                .practiceTutor(practiceTutor)
                .build();
    }

    private Account student() {

        Person person = Person.builder()
                .names("Ana")
                .lastNames("Loja")
                .cedula("1100000001")
                .build();

        return Account.builder()
                .id(10L)
                .username("student01")
                .person(person)
                .roles(Set.of(role(RoleName.ROLE_ESTUDIANTE)))
                .build();
    }

    private Account institutionalTutor() {

        return Account.builder()
                .id(30L)
                .username("tutor.institucional")
                .roles(Set.of(role(RoleName.ROLE_TUTOR_INSTITUCIONAL)))
                .build();
    }

    private Account practiceTutor() {

        return Account.builder()
                .id(20L)
                .username("tutor.practicas")
                .roles(Set.of(role(RoleName.ROLE_TUTOR_PRACTICAS)))
                .build();
    }

    private Role role(RoleName roleName) {

        return Role.builder()
                .name(roleName.name())
                .build();
    }
}
