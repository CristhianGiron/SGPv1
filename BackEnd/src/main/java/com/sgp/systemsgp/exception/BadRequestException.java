/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          BadRequestException.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define el tratamiento de errores de el módulo Bad Request Exception.
 */

package com.sgp.systemsgp.exception;

public class BadRequestException
        extends RuntimeException {

    public BadRequestException(
            String message) {
        super(message);
    }
}
