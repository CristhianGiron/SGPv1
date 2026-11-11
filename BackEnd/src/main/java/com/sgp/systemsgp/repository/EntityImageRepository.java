/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EntityImageRepository.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define las consultas de persistencia para las imágenes de las entidades.
 */

package com.sgp.systemsgp.repository;
import com.sgp.systemsgp.model.EntityImage;
import org.springframework.data.jpa.repository.JpaRepository;
public interface EntityImageRepository extends JpaRepository<EntityImage, Long> {}
