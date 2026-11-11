/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          UpdateFinalReportInstitutionalSectionRequest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de entrada para el informe del tutor institucional (L.3).
 */

package com.sgp.systemsgp.dto.finalreport;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import java.time.LocalDate;

import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateFinalReportInstitutionalSectionRequest {

    @Min(0)
    @Max(10000)
    private Integer completedHours;

    @Min(0)
    @Max(59)
    private Integer completedMinutes;

    private LocalDate reportDate;

    @Size(max = 1200, message = "La conclusión 1 no puede superar 1200 caracteres")
    private String conclusion1;

    @Size(max = 1200, message = "La conclusión 2 no puede superar 1200 caracteres")
    private String conclusion2;

    @Size(max = 1200, message = "La conclusión 3 no puede superar 1200 caracteres")
    private String conclusion3;

    @Size(max = 1200, message = "La recomendación 1 no puede superar 1200 caracteres")
    private String recommendation1;

    @Size(max = 1200, message = "La recomendación 2 no puede superar 1200 caracteres")
    private String recommendation2;

    @Size(max = 1200, message = "La recomendación 3 no puede superar 1200 caracteres")
    private String recommendation3;
}
