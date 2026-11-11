/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CantonRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para el módulo Canton Repository.
 */

package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Canton;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CantonRepository
                extends JpaRepository<Canton, Long> {

        List<Canton> findByProvince_Id(
                        Long provinceId);

        Optional<Canton> findByCode(String code);

        boolean existsByCode(String code);

}