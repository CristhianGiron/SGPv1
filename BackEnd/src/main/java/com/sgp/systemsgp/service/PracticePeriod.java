/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticePeriod.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Resuelve las fechas de la práctica y la compatibilidad con registros anteriores.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.model.Enrollment;
import java.time.LocalDateTime;

/** Resolve the practice period, retaining course dates for unmigrated legacy objects. */
final class PracticePeriod {
    private PracticePeriod() {}
    static LocalDateTime start(Enrollment enrollment) {
        if (enrollment==null) return null;
        return enrollment.getPractice()!=null ? enrollment.getPractice().getStartDate()
                : enrollment.getCourse()==null ? null : enrollment.getCourse().getStartDate();
    }
    static LocalDateTime end(Enrollment enrollment) {
        if (enrollment==null) return null;
        return enrollment.getPractice()!=null ? enrollment.getPractice().getEndDate()
                : enrollment.getCourse()==null ? null : enrollment.getCourse().getEndDate();
    }
}
