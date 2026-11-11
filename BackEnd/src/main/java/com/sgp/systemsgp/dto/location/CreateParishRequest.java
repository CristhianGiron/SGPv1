/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CreateParishRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el módulo Create Parish Request.
 */

package com.sgp.systemsgp.dto.location;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateParishRequest {

    @NotBlank(message = "El código de la parroquia es obligatorio")
    @Size(max = 10, message = "El código de la parroquia no puede superar 10 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "El código de la parroquia solo puede contener letras, números, guion y guion bajo")
    private String code;

    @NotBlank(message = "El nombre de la parroquia es obligatorio")
    @Size(max = 100, message = "El nombre de la parroquia no puede superar 100 caracteres")
    private String name;

    @NotNull(message = "El cantón es obligatorio")
    @Positive(message = "El cantón seleccionado no es válido")
    private Long cantonId;
}
