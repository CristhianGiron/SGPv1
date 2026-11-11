/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ProvinceRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para el módulo Province Repository.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Province;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProvinceRepository
        extends JpaRepository<Province, Long> {

        Optional<Province> findByCode(String code);
        
        boolean existsByCode(String code);
}