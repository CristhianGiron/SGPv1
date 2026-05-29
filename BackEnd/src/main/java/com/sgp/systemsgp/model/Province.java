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