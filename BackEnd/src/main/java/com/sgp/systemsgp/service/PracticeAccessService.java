package com.sgp.systemsgp.service;

import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PracticeAccessService {

    public boolean hasRole(Account account, RoleName roleName) {

        return account != null
                && account.getRoles() != null
                && account.getRoles()
                        .stream()
                        .anyMatch(role -> roleName.name().equals(role.getName()));
    }

    public boolean isAdmin(Account account) {

        return hasRole(account, RoleName.ROLE_ADMIN);
    }

    public boolean isStudentForEnrollment(Enrollment enrollment, Account account) {

        return enrollment != null
                && enrollment.getAccount() != null
                && account != null
                && Objects.equals(enrollment.getAccount().getId(), account.getId());
    }

    public boolean isPracticeTutorForCourse(Course course, Account account) {

        return course != null
                && course.getPracticeTutor() != null
                && account != null
                && hasRole(account, RoleName.ROLE_TUTOR_PRACTICAS)
                && Objects.equals(course.getPracticeTutor().getId(), account.getId());
    }

    public boolean isPracticeTutorForEnrollment(Enrollment enrollment, Account account) {

        return enrollment != null
                && isPracticeTutorForCourse(enrollment.getCourse(), account);
    }

    public boolean isInstitutionalTutorForEnrollment(Enrollment enrollment, Account account) {

        return hasRole(account, RoleName.ROLE_TUTOR_INSTITUCIONAL)
                && InstitutionalAssignmentResolver.isAssignedInstitutionalTutor(enrollment, account);
    }

    public boolean isDirectorForCourse(Course course, Account account) {

        if (!hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) {
            return false;
        }

        Career directorCareer = account.getCareer();
        Career courseCareer = getCourseCareer(course);

        return directorCareer != null
                && courseCareer != null
                && Objects.equals(directorCareer.getId(), courseCareer.getId());
    }

    public boolean canViewEnrollment(Enrollment enrollment, Account account) {

        return isStudentForEnrollment(enrollment, account)
                || isPracticeTutorForEnrollment(enrollment, account)
                || isInstitutionalTutorForEnrollment(enrollment, account)
                || isAdmin(account)
                || isDirectorForCourse(enrollment != null ? enrollment.getCourse() : null, account);
    }

    public boolean canConcludePractice(Enrollment enrollment, Account account) {

        return isDirectorForCourse(enrollment != null ? enrollment.getCourse() : null, account);
    }

    public boolean canArchivePractice(Account account) {

        return isAdmin(account);
    }

    public void requirePracticeCompletionAccess(Enrollment enrollment, Account account) {

        if (!canConcludePractice(enrollment, account)) {
            throw new AccessDeniedException("Solo el director de prácticas puede concluir o reabrir esta práctica");
        }
    }

    public void requirePracticeArchiveAccess(Account account) {

        if (!canArchivePractice(account)) {
            throw new AccessDeniedException("Solo el admin puede archivar o desarchivar prácticas");
        }
    }

    public Career getCourseCareer(Course course) {

        AcademicCycle academicCycle = getCourseAcademicCycle(course);
        return academicCycle != null ? academicCycle.getCareer() : null;
    }

    public AcademicCycle getCourseAcademicCycle(Course course) {

        if (course == null) {
            return null;
        }

        if (course.getAcademicCycle() != null) {
            return course.getAcademicCycle();
        }

        return course.getSubject() != null
                ? course.getSubject().getAcademicCycle()
                : null;
    }
}
