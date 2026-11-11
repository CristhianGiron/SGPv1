/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          JwtServiceTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Jwt Service Test mediante pruebas de regresión.
 */

package com.sgp.systemsgp.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {
    @Test void configuredExpirationAppliesToAccessTokensAndRefreshCannotAuthenticateAsAccess() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("qa-only-secret-value-for-jwt-test-123456789");
        properties.setExpiration(60_000);
        JwtService service = new JwtService(properties);
        var user = User.withUsername("qa-user").password("unused").roles("ESTUDIANTE").build();
        String token = service.generateToken(user);
        var claims = service.extractClaims(token);
        assertThat(claims.getExpiration().getTime() - claims.getIssuedAt().getTime()).isBetween(59_000L, 61_000L);
        assertThat(service.isValid(token, user)).isTrue();
        assertThat(service.isValid(service.generateRefreshToken(user), user)).isFalse();
        assertThat(service.isValid(token, User.withUsername("another-user").password("unused").roles("ESTUDIANTE").build())).isFalse();
    }
}
