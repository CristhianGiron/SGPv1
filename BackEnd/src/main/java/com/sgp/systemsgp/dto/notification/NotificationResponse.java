/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          NotificationResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para las notificaciones.
 */

package com.sgp.systemsgp.dto.notification;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {

    private Long id;

    private String title;

    private String message;

    private String link;

    private String type;

    private boolean read;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
