/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          InstitutionalDefaultsInitializer.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Configura los componentes de las instituciones en el backend.
 */

package com.sgp.systemsgp.config;

import com.sgp.systemsgp.service.InstitutionalDefaultsService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!test")
@RequiredArgsConstructor
public class InstitutionalDefaultsInitializer implements CommandLineRunner {
    private final InstitutionalDefaultsService defaults;
    @Override public void run(String... args) { defaults.initialize(); }
}
