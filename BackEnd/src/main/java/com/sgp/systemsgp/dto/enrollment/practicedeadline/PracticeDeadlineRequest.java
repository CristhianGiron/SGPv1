/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeDeadlineRequest.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Define los datos de entrada para el módulo Practice Deadline Request.
 */

package com.sgp.systemsgp.dto.enrollment.practicedeadline;
import com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind;
import com.sgp.systemsgp.enums.practicedeadline.PracticeDeadlineStage;
import com.sgp.systemsgp.enums.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
public record PracticeDeadlineRequest(@NotNull PracticeDocumentKind kind,@NotNull PracticeDeadlineStage stage,
 @NotNull LocalDateTime dueAt,@Min(1) @Max(720) int reminderHours,@NotBlank @Size(max=2000) String reason){}
