/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          InstitutionalDefaultsProperties.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Configura los componentes de las instituciones en el backend.
 */

package com.sgp.systemsgp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.institutional")
@Getter
@Setter
public class InstitutionalDefaultsProperties {
    private boolean seedEnabled = true;
    private String universityCode = "UNL";
    private String universityName = "Universidad Nacional de Loja";
    private String facultyCode = "UNL-FEAC";
    private String facultyName = "Facultad de la Educación, el Arte y la Comunicación";
    private String careerCode = "UNL-PCEI";
    private String careerName = "Pedagogía de las Ciencias Experimentales - Informática";
}
