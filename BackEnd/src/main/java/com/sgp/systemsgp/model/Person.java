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