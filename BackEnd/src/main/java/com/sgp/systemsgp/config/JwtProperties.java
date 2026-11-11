/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          JwtProperties.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Configura los componentes de el módulo Jwt Properties en el backend.
 */

package com.sgp.systemsgp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    private String secret;

    private long expiration;
}

// Bash
// export JWT_SECRET='Qw7@xL9#zT2$kP8!mN4%vB1&sD6*fH3@jR5'
// export JWT_EXPIRATION=86400000