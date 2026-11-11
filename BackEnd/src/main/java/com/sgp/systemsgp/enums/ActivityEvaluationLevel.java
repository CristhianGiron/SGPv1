/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ActivityEvaluationLevel.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los valores permitidos de la evaluación de actividades (L.4).
 */

package com.sgp.systemsgp.enums;

public enum ActivityEvaluationLevel {

    BAJO(1),
    MEDIO(2),
    ALTO(3);

    private final int score;

    ActivityEvaluationLevel(int score) {

        this.score = score;
    }

    public int getScore() {

        return score;
    }
}
