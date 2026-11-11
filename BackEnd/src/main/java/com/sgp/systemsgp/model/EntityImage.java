/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EntityImage.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Representa los datos persistentes de las imágenes de las entidades.
 */

package com.sgp.systemsgp.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "entity_images")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class EntityImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 40)
    private String contentType;
    @Lob @Basic(fetch = FetchType.LAZY) @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] data;
}
