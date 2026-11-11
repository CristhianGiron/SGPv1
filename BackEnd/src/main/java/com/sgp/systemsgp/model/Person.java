/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Person.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de el módulo Person.
 */

package com.sgp.systemsgp.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "persons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String names;

    private String lastNames;

    @Column(unique = true)
    private String cedula;

    private String phone;

    private String address;

    @Column(unique = true)
    private String institutionalEmail;
}