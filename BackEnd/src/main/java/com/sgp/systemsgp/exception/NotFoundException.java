/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          NotFoundException.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define el tratamiento de errores de el módulo Not Found Exception.
 */

package com.sgp.systemsgp.exception;

public class NotFoundException
        extends RuntimeException {

    public NotFoundException(
            String message) {
        super(message);
    }
}
