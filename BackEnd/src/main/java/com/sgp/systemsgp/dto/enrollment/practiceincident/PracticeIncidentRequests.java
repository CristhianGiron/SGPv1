/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeIncidentRequests.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Define los datos de respuesta para el módulo Practice Incident Requests.
 */

package com.sgp.systemsgp.dto.enrollment.practiceincident;
import com.sgp.systemsgp.enums.practiceincident.PracticeIncidentType;
import jakarta.validation.constraints.*;
public final class PracticeIncidentRequests {
 private PracticeIncidentRequests(){}
 public record Create(@NotNull PracticeIncidentType type,@NotBlank @Size(max=160) String title,@NotBlank @Size(max=4000) String description){}
 public record Assign(@NotNull Long responsibleId,@NotBlank @Size(max=2000) String reason){}
 public record Reason(@NotBlank @Size(max=2000) String reason){}
 public record Decide(@NotNull Boolean approved,@NotBlank @Size(max=2000) String reason,Long targetGroupId){}
}
