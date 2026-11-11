/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          SystemsgpApplication.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Inicia la aplicación del sistema de gestión de prácticas con Spring Boot.
 */

package com.sgp.systemsgp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SystemsgpApplication {

	public static void main(String[] args) {
		SpringApplication.run(SystemsgpApplication.class, args);
	}

}
