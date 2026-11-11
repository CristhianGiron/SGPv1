/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CreatePracticeOfferingRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para las prácticas ofrecidas a un paralelo.
 */

package com.sgp.systemsgp.dto.enrollment;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
public record CreatePracticeOfferingRequest(@NotBlank @Size(max=160) String name,
        @NotNull @Min(1) Integer capacity, LocalDateTime startDate, LocalDateTime endDate) {}
