/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Province.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de el módulo Province.
 */

package com.sgp.systemsgp.model;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "provinces")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Province {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Código INEC
     */
    @Column(nullable = false, unique = true)
    private String code;

    /*
     * Nombre provincia
     */
    @Column(nullable = false, unique = true)
    private String name;
}