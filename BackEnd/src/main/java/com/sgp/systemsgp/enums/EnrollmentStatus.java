/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EnrollmentStatus.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los valores permitidos de las inscripciones y prácticas asignadas.
 */

package com.sgp.systemsgp.enums;

public enum EnrollmentStatus {

    PENDING,
    APPROVED,
    REJECTED,
    SUSPENDED,
    WITHDRAWN,
    COMPLETED
}