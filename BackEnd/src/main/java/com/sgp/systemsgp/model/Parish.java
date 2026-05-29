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