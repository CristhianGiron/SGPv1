/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticePhotoFileResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para las evidencias fotográficas.
 */

package com.sgp.systemsgp.dto.practicephoto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PracticePhotoFileResponse {

    private final byte[] data;

    private final String contentType;

    private final String originalFilename;

    private final Long fileSize;
}
