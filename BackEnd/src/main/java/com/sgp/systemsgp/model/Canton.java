package com.sgp.systemsgp.model;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "cantons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Canton {

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
     * Provincia
     */
    @ManyToOne(fetch = FetchType.LAZY)

    @JoinColumn(name = "province_id")

    private Province province;
}