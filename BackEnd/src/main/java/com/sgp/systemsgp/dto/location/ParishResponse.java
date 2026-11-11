/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ParishResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para el módulo Parish Response.
 */

package com.sgp.systemsgp.dto.location;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParishResponse {

    private Long id;

    private String code;

    private String name;
}