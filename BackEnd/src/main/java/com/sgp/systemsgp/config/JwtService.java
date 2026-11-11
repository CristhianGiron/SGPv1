/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          JwtService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona los tokens JWT utilizados en la autenticación de la API.
 */

package com.sgp.systemsgp.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JwtService {

        private final JwtProperties jwtProperties;

        /*
         * ACCESS TOKEN
         */
        private static final long ACCESS_TOKEN_EXPIRATION = 1000L * 60 * 60 * 24;

        /*
         * REFRESH TOKEN
         */
        private static final long REFRESH_TOKEN_EXPIRATION = 1000L * 60 * 60 * 24 * 7;

        private final byte[] runtimeSecret = generateRuntimeSecret();

        /*
         * Obtener clave secreta
         */
        private SecretKey getKey() {

                String configuredSecret = jwtProperties.getSecret();

                byte[] keyBytes = configuredSecret == null
                                || configuredSecret.isBlank()
                                                ? runtimeSecret
                                                : configuredSecret.getBytes(StandardCharsets.UTF_8);

                if (keyBytes.length < 32) {

                        throw new IllegalStateException(
                                        "JWT_SECRET debe tener al menos 32 bytes");
                }

                return Keys.hmacShaKeyFor(
                                keyBytes);
        }

        private static byte[] generateRuntimeSecret() {

                byte[] secret = new byte[32];
                new SecureRandom().nextBytes(secret);
                return secret;
        }

        /*
         * Generar Access Token
         */
        public String generateToken(
                        UserDetails user) {

                Map<String, Object> claims = new HashMap<>();

                claims.put("tokenUse", "access");
                claims.put(
                                "roles",
                                user.getAuthorities()
                                                .stream()
                                                .map(GrantedAuthority::getAuthority)
                                                .toList());

                return buildToken(
                                claims,
                                user,
                                jwtProperties.getExpiration() > 0 ? jwtProperties.getExpiration() : ACCESS_TOKEN_EXPIRATION);
        }

        public String generateSessionToken(UserDetails user,String sessionId,long authVersion,boolean refresh) {
                Map<String,Object> claims=new HashMap<>();
                claims.put("tokenUse",refresh?"refresh":"access");
                claims.put("sid",sessionId);claims.put("ver",authVersion);claims.put("jti",java.util.UUID.randomUUID().toString());
                if(!refresh)claims.put("roles",user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList());
                return buildToken(claims,user,refresh?REFRESH_TOKEN_EXPIRATION:
                    (jwtProperties.getExpiration()>0?jwtProperties.getExpiration():ACCESS_TOKEN_EXPIRATION));
        }

        /*
         * Generar Refresh Token
         */
        public String generateRefreshToken(
                        UserDetails user) {

                return buildToken(
                                Map.of("tokenUse", "refresh"),
                                user,
                                REFRESH_TOKEN_EXPIRATION);
        }

        /*
         * Construcción centralizada del JWT
         */
        private String buildToken(
                        Map<String, Object> claims,
                        UserDetails user,
                        long expirationTime) {

                Date now = new Date();

                Date expirationDate = new Date(
                                System.currentTimeMillis() + expirationTime);

                return Jwts.builder()
                                .claims(claims)
                                .subject(user.getUsername())
                                .issuedAt(now)
                                .expiration(expirationDate)
                                .signWith(getKey())
                                .compact();
        }

        /*
         * Extraer username
         */
        public String extractUsername(
                        String token) {

                return extractClaims(token)
                                .getSubject();
        }

        /*
         * Extraer roles
         */
        @SuppressWarnings("unchecked")
        public List<String> extractRoles(
                        String token) {

                return extractClaims(token)
                                .get("roles", List.class);
        }

        /*
         * Extraer claims
         */
        public Claims extractClaims(
                        String token) {

                return Jwts.parser()

                                .verifyWith(getKey())

                                .build()

                                .parseSignedClaims(token)

                                .getPayload();
        }

        /*
         * Validar token
         */
        public boolean isValid(
                        String token,
                        UserDetails user) {

                Claims claims = extractClaims(token);
                String tokenUse = claims.get("tokenUse", String.class);
                // Legacy access tokens carry roles; legacy refresh tokens do not.
                boolean accessToken = "access".equals(tokenUse)
                                || (tokenUse == null && claims.get("roles") instanceof List<?>);
                return accessToken && user.getUsername().equals(claims.getSubject())
                                && claims.getExpiration() != null
                                && claims.getExpiration().after(new Date());
        }

        /*
         * Verificar expiración
         */
        public boolean isTokenExpired(
                        String token) {

                return extractClaims(token)

                                .getExpiration()

                                .before(new Date());
        }
}
