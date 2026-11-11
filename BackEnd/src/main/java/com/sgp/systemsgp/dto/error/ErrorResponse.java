/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ErrorResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para el módulo Error Response.
 */

package com.sgp.systemsgp.dto.error;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ErrorResponse {

    private int status;

    private String error;

    private String message;

    private java.util.Map<String, String> fieldErrors;

    private LocalDateTime timestamp;
}
