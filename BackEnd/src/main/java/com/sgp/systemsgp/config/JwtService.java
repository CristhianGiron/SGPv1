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

                claims.put(
                                "roles",
                                user.getAuthorities()
                                                .stream()
                                                .map(GrantedAuthority::getAuthority)
                                                .toList());

                return buildToken(
                                claims,
                                user,
                                ACCESS_TOKEN_EXPIRATION);
        }

        /*
         * Generar Refresh Token
         */
        public String generateRefreshToken(
                        UserDetails user) {

                return buildToken(
                                new HashMap<>(),
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

                final String username = extractUsername(token);

                return username.equals(user.getUsername())
                                && !isTokenExpired(token);
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
