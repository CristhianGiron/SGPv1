/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AccountResponse.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los datos de respuesta para las cuentas de usuario.
 */

package com.sgp.systemsgp.dto.account;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class AccountResponse {

    private Long id;

    private String username;

    private String names;

    private String lastNames;

    private String cedula;

    private String institutionalEmail;

    private String phone;

    private String address;

    private Set<String> roles;

    private String profileImageUrl;

    private Long academicCycleId;

    private String academicCycle;

    private Long careerId;

    private String career;

    private Long facultyId;

    private String faculty;

    private Long academicInstitutionId;

    private String academicInstitution;

    private Long institutionId;

    private String institution;

    private Long gradeId;

    private String grade;

    private Long gradeParallelId;

    private String gradeParallel;

    private boolean enabled;

    private boolean locked;

    private boolean deleted;

    private boolean passwordChangeRequired;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
