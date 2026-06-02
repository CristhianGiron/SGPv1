package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.dto.course.CourseResponse;
import com.sgp.systemsgp.dto.course.CreateCourseRequest;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.model.Subject;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.AcademicCycleRepository;
import com.sgp.systemsgp.repository.CourseGroupRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.SubjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;
import java.util.Set;

class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseGroupRepository courseGroupRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private AcademicCycleRepository academicCycleRepository;

    private CourseService courseService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        courseService = new CourseService(
                courseRepository,
                courseGroupRepository,
                accountRepository,
                subjectRepository,
                academicCycleRepository);
    }

    @Test
    void assignInstitutionalTutorRejectsUniversityInstitution() {

        Course course = course();
        Account tutor = account(
                "tutor.institucional",
                RoleName.ROLE_TUTOR_INSTITUCIONAL,
                institution(
                        "UNL",
                        InstitutionType.UNIVERSIDAD));

        when(courseRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(course));

        when(accountRepository.findByUsernameAndDeletedFalse("admin"))
                .thenReturn(Optional.of(account(
                        "admin",
                        RoleName.ROLE_ADMIN,
                        institution(
                                "UNL",
                                InstitutionType.UNIVERSIDAD))));

        when(accountRepository.findByIdAndDeletedFalse(2L))
                .thenReturn(Optional.of(tutor));

        assertThatThrownBy(() -> courseService.assignInstitutionalTutor("admin", 1L, 2L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("El tutor institucional debe pertenecer a una escuela o colegio");

        verify(courseRepository, never())
                .save(any(Course.class));
    }

    @Test
    void assignPracticeTutorStoresValidUnlTutor() {

        Course course = course();
        Account tutor = account(
                "tutor.practicas",
                RoleName.ROLE_TUTOR_PRACTICAS,
                institution(
                        "UNL",
                        InstitutionType.UNIVERSIDAD));

        when(courseRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(course));

        when(accountRepository.findByUsernameAndDeletedFalse("admin"))
                .thenReturn(Optional.of(account(
                        "admin",
                        RoleName.ROLE_ADMIN,
                        institution(
                                "UNL",
                                InstitutionType.UNIVERSIDAD))));

        when(accountRepository.findByIdAndDeletedFalse(2L))
                .thenReturn(Optional.of(tutor));

        CourseResponse response = courseService.assignPracticeTutor("admin", 1L, 2L);

        assertThat(response.getPracticeTutor())
                .isEqualTo("tutor.practicas");

        verify(courseRepository)
                .save(course);
    }

    @Test
    void createCourseRejectsMissingAcademicCycle() {

        CreateCourseRequest request = courseRequest(5L);
        Account admin = account(
                "admin",
                RoleName.ROLE_ADMIN,
                institution(
                        "UNL",
                        InstitutionType.UNIVERSIDAD));
        when(accountRepository.findByUsernameAndDeletedFalse("admin"))
                .thenReturn(Optional.of(admin));
        when(academicCycleRepository.findByIdAndDeletedFalse(4L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.createCourse("admin", request))
                .isInstanceOf(com.sgp.systemsgp.exception.NotFoundException.class)
                .hasMessage("Ciclo académico no encontrado");

        verify(courseRepository, never())
                .save(any(Course.class));
    }

    @Test
    void createCourseAcceptsAcademicCycleParallel() {

        CreateCourseRequest request = courseRequest(null);
        Account admin = account(
                "admin",
                RoleName.ROLE_ADMIN,
                institution(
                        "UNL",
                        InstitutionType.UNIVERSIDAD));
        AcademicCycle academicCycle = AcademicCycle.builder().id(4L).name("Cuarto").build();

        when(accountRepository.findByUsernameAndDeletedFalse("admin"))
                .thenReturn(Optional.of(admin));
        when(academicCycleRepository.findByIdAndDeletedFalse(4L))
                .thenReturn(Optional.of(academicCycle));
        when(courseRepository.count())
                .thenReturn(0L);
        when(courseRepository.existsByCode(anyString()))
                .thenReturn(false);
        when(courseRepository.save(any(Course.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CourseResponse response = courseService.createCourse("admin", request);

        assertThat(response.getAcademicCycle())
                .isEqualTo("Cuarto");

        verify(courseRepository)
                .save(any(Course.class));
    }

    private Course course() {

        return Course.builder()
                .id(1L)
                .name("Curso Test")
                .capacity(10)
                .build();
    }

    private CreateCourseRequest courseRequest(Long subjectId) {

        CreateCourseRequest request = new CreateCourseRequest();
        request.setName("Curso Test");
        request.setDescription("Descripcion del curso");
        request.setCapacity(10);
        request.setSubjectId(subjectId);
        request.setAcademicCycleId(4L);

        return request;
    }

    private Account account(
            String username,
            RoleName roleName,
            Institution institution) {

        return Account.builder()
                .id(2L)
                .username(username)
                .roles(Set.of(role(roleName)))
                .institution(institution)
                .enabled(true)
                .locked(false)
                .build();
    }

    private Role role(RoleName roleName) {

        return Role.builder()
                .name(roleName.name())
                .build();
    }

    private Institution institution(
            String code,
            InstitutionType type) {

        return Institution.builder()
                .code(code)
                .name("Institución Test")
                .type(type)
                .active(true)
                .deleted(false)
                .agreementActive(true)
                .acceptsInterns(true)
                .build();
    }
}
