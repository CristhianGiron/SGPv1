/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Parish.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de el módulo Parish.
 */

package com.sgp.systemsgp.model;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "parishes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Parish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Código INEC
     */
    @Column(nullable = false, unique = true)
    private String code;

    /*
     * Nombre
     */
    @Column(nullable = false)
    private String name;

    /*
     * Cantón
     */
    @ManyToOne(fetch = FetchType.LAZY)

    @JoinColumn(name = "canton_id")

    private Canton canton;
}