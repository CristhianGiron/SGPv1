/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          SystemsgpApplicationTests.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Systemsgp Application Tests mediante pruebas de regresión.
 */

package com.sgp.systemsgp;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = "debug=false")
@ActiveProfiles("test")
class SystemsgpApplicationTests {

	@Test
	void contextLoads() {
	}

}
