/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CreateCantonRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el módulo Create Canton Request.
 */

package com.sgp.systemsgp.dto.location;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCantonRequest {

    @NotBlank(message = "El código del cantón es obligatorio")
    @Size(max = 10, message = "El código del cantón no puede superar 10 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "El código del cantón solo puede contener letras, números, guion y guion bajo")
    private String code;

    @NotBlank(message = "El nombre del cantón es obligatorio")
    @Size(max = 100, message = "El nombre del cantón no puede superar 100 caracteres")
    private String name;

    @NotNull(message = "La provincia es obligatoria")
    @Positive(message = "La provincia seleccionada no es válida")
    private Long provinceId;
}
