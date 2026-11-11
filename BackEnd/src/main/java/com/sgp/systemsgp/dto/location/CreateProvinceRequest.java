/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CreateProvinceRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el módulo Create Province Request.
 */

package com.sgp.systemsgp.dto.location;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateProvinceRequest {

    @NotBlank(message = "El código de la provincia es obligatorio")
    @Size(max = 10, message = "El código de la provincia no puede superar 10 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "El código de la provincia solo puede contener letras, números, guion y guion bajo")
    private String code;

    @NotBlank(message = "El nombre de la provincia es obligatorio")
    @Size(max = 100, message = "El nombre de la provincia no puede superar 100 caracteres")
    private String name;
}
