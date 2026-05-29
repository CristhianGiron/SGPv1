package com.sgp.systemsgp.service;

import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Institution;

public final class InstitutionalAssignmentResolver {

    private InstitutionalAssignmentResolver() {
    }

    public static Account institutionalTutor(Enrollment enrollment) {

        if (enrollment == null) {
            return null;
        }

        // Cambio solicitado: el tutor institucional se resuelve desde el grupo asignado.
        if (enrollment.getGroup() != null
                && enrollment.getGroup().getInstitutionalTutor() != null) {
            return enrollment.getGroup().getInstitutionalTutor();
        }

        Course course = enrollment.getCourse();

        return course != null
                ? course.getInstitutionalTutor()
                : null;
    }

    public static Institution educationalInstitution(Enrollment enrollment) {

        Account tutor = institutionalTutor(enrollment);

        return tutor != null
                ? tutor.getInstitution()
                : null;
    }

    public static boolean isAssignedInstitutionalTutor(
            Enrollment enrollment,
            Account account) {

        Account tutor = institutionalTutor(enrollment);

        return tutor != null
                && account != null
                && tutor.getId().equals(account.getId());
    }
}
