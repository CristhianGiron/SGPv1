package com.sgp.systemsgp.service;

import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.CourseGroup;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Role;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class PracticeAccessServiceTest {

    private final PracticeAccessService service = new PracticeAccessService();

    @Test
    void directorCanViewOnlyCoursesFromOwnCareer() {

        Career education = career(1L, "Educacion");
        Career law = career(2L, "Derecho");
        Account director = account(10L, RoleName.ROLE_DIRECTOR_PRACTICAS);
        director.setCareer(education);

        assertThat(service.isDirectorForCourse(course(20L, education, null), director)).isTrue();
        assertThat(service.isDirectorForCourse(course(21L, law, null), director)).isFalse();
    }

    @Test
    void institutionalTutorCanViewOnlyAssignedEnrollment() {

        Account assignedTutor = account(10L, RoleName.ROLE_TUTOR_INSTITUCIONAL);
        Account anotherTutor = account(11L, RoleName.ROLE_TUTOR_INSTITUCIONAL);
        Account student = account(12L, RoleName.ROLE_ESTUDIANTE);
        Course course = course(20L, career(1L, "Educacion"), null);
        CourseGroup group = CourseGroup.builder()
                .id(30L)
                .course(course)
                .name("Grupo A")
                .institutionalTutor(assignedTutor)
                .build();
        Enrollment enrollment = enrollment(40L, student, course);
        enrollment.setGroup(group);

        assertThat(service.canViewEnrollment(enrollment, assignedTutor)).isTrue();
        assertThat(service.canViewEnrollment(enrollment, anotherTutor)).isFalse();
    }

    @Test
    void practiceCompletionAndArchiveHaveSeparateManagers() {

        Account practiceTutor = account(10L, RoleName.ROLE_TUTOR_PRACTICAS);
        Account director = account(11L, RoleName.ROLE_DIRECTOR_PRACTICAS);
        Account admin = account(12L, RoleName.ROLE_ADMIN);
        Account student = account(13L, RoleName.ROLE_ESTUDIANTE);
        Career education = career(1L, "Educacion");
        director.setCareer(education);
        Course course = course(20L, education, practiceTutor);
        Enrollment enrollment = enrollment(30L, student, course);

        assertThat(service.canConcludePractice(enrollment, director)).isTrue();
        assertThat(service.canConcludePractice(enrollment, admin)).isFalse();
        assertThat(service.canConcludePractice(enrollment, practiceTutor)).isFalse();
        assertThat(service.canConcludePractice(enrollment, student)).isFalse();

        assertThat(service.canArchivePractice(admin)).isTrue();
        assertThat(service.canArchivePractice(director)).isFalse();
        assertThat(service.canArchivePractice(practiceTutor)).isFalse();
        assertThat(service.canArchivePractice(student)).isFalse();
    }

    private static Enrollment enrollment(Long id, Account student, Course course) {

        return Enrollment.builder()
                .id(id)
                .account(student)
                .course(course)
                .status(EnrollmentStatus.APPROVED)
                .build();
    }

    private static Course course(Long id, Career career, Account practiceTutor) {

        return Course.builder()
                .id(id)
                .name("Paralelo A")
                .academicCycle(AcademicCycle.builder()
                        .id(id + 100)
                        .name("Ciclo 1")
                        .career(career)
                        .build())
                .practiceTutor(practiceTutor)
                .build();
    }

    private static Career career(Long id, String name) {

        return Career.builder()
                .id(id)
                .name(name)
                .code("CAR-" + id)
                .build();
    }

    private static Account account(Long id, RoleName roleName) {

        return Account.builder()
                .id(id)
                .username("usuario-" + id)
                .password("password")
                .roles(Set.of(Role.builder()
                        .id(id)
                        .name(roleName.name())
                        .build()))
                .build();
    }
}
