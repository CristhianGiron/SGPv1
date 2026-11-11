/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DocumentPdfData.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente DocumentPdfData del backend del SGP.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.model.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** Academic and institutional data shared by the six reference documents. */
final class DocumentPdfData {
    private DocumentPdfData() { }

    static AcademicCycle academicCycle(Course course, Account student) {
        if (course != null && course.getAcademicCycle() != null) return course.getAcademicCycle();
        if (course != null && course.getSubject() != null && course.getSubject().getAcademicCycle() != null)
            return course.getSubject().getAcademicCycle();
        return student != null ? student.getAcademicCycle() : null;
    }

    static String cycle(Course course, Account student) {
        AcademicCycle cycle = academicCycle(course, student);
        return cycle == null ? null : cycle.getName();
    }

    static String period(Course course) {
        if (course == null || course.getStartDate() == null || course.getEndDate() == null) return null;
        DateTimeFormatter format = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.forLanguageTag("es-EC"));
        return course.getStartDate().format(format) + " – " + course.getEndDate().format(format);
    }

    static String subject(Course course) {
        return course != null && course.getSubject() != null ? course.getSubject().getName() : null;
    }

    static String tutorRole(Course course) {
        String subject = subject(course);
        return subject == null ? "DOCENTE TUTOR DE PRÁCTICAS" : "DOCENTE DE LA ASIGNATURA DE " + subject.toUpperCase(Locale.ROOT);
    }

    static String name(Account account) {
        if (account == null) return null;
        if (account.getPerson() == null) return account.getUsername();
        return (Objects.toString(account.getPerson().getNames(), "") + " "
                + Objects.toString(account.getPerson().getLastNames(), "")).trim();
    }

    static String career(Course course, Account student) {
        AcademicCycle cycle = academicCycle(course, student);
        Career career = cycle != null ? cycle.getCareer() : null;
        if (career == null && student != null) career = student.getCareer();
        return career != null ? career.getName() : null;
    }

    static String degree(Course course, Account student) {
        AcademicCycle cycle = academicCycle(course, student);
        Career career = cycle == null ? null : cycle.getCareer();
        if (career == null && student != null) career = student.getCareer();
        return career == null ? null : career.getDegreeTitle();
    }

    static List<PdfExportService.PdfField> institution(PdfExportService pdf, Institution institution,
            String name, String code, String address, Account tutor, boolean counts) {
        List<PdfExportService.PdfField> fields = new ArrayList<>();
        fields.add(pdf.field("@subheading", "Datos de la Institución Educativa"));
        fields.add(pdf.field("Nombre de la Institución", name));
        fields.add(pdf.field("Código AMIE", code));
        fields.add(pdf.field("Dirección", address));
        if (institution != null) {
            fields.add(pdf.field("Parroquia", institution.getParish() == null ? null : institution.getParish().getName()));
            fields.add(pdf.field("Cantón", institution.getCanton() == null ? null : institution.getCanton().getName()));
            fields.add(pdf.field("Provincia", institution.getProvince() == null ? null : institution.getProvince().getName()));
            String levels = institution.getEducationLevels() == null ? null : institution.getEducationLevels().stream()
                    .sorted().map(level -> switch (level) {
                        case EI -> "Educación Inicial";
                        case EGB -> "Educación General Básica";
                        case BGU -> "Bachillerato General Unificado";
                    }).reduce((a, b) -> a + ", " + b).orElse(null);
            fields.add(pdf.field("Niveles educativos que ofrece", levels));
            fields.add(pdf.field("Sostenimiento", readable(institution.getSupport())));
            fields.add(pdf.field("Régimen escolar", readable(institution.getRegime())));
            fields.add(pdf.field("Modalidad", readable(institution.getModality())));
            if (counts) {
                fields.add(pdf.field("Número de Docentes", institution.getTeacherCount()));
                fields.add(pdf.field("Número de Estudiantes", institution.getStudentCount()));
            }
        }
        fields.add(pdf.field("Tutor Institucional", name(tutor)));
        return fields;
    }

    static Account institutionalTutor(Enrollment enrollment) {
        return InstitutionalAssignmentResolver.institutionalTutor(enrollment);
    }

    private static String readable(Enum<?> value) {
        if (value == null) return null;
        String text = value.name().toLowerCase(Locale.ROOT).replace('_', ' ');
        return Character.toUpperCase(text.charAt(0)) + text.substring(1);
    }
}
