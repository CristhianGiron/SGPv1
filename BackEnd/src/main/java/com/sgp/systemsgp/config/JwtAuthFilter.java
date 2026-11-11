/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          JwtAuthFilter.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Configura los componentes de la autenticación de usuarios en el backend.
 */

package com.sgp.systemsgp.config;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;

import org.springframework.stereotype.Component;

import org.springframework.web.filter.OncePerRequestFilter;

import com.sgp.systemsgp.service.CustomUserDetailsService;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.repository.AccountRepository;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

        private final JwtService jwtService;

        private final CustomUserDetailsService userDetailsService;

        private final AccountRepository accountRepository;
        private final com.sgp.systemsgp.service.AuthSessionService authSessionService;

        @Override
        protected void doFilterInternal(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        FilterChain filterChain) throws ServletException, IOException {

                final String authHeader = request.getHeader("Authorization");

                if (authHeader == null ||
                                !authHeader.startsWith("Bearer ")) {

                        filterChain.doFilter(request, response);
                        return;
                }

                final String token = authHeader.substring(7);

                try {

                        final String username = jwtService.extractUsername(token);

                        if (username != null &&
                                        SecurityContextHolder.getContext()
                                                        .getAuthentication() == null) {

                                UserDetails user = userDetailsService
                                                .loadUserByUsername(username);

                                Account account = accountRepository
                                                .findByUsernameAndDeletedFalse(user.getUsername())
                                                .orElse(null);

                                if (!user.isEnabled()
                                                || !user.isAccountNonLocked()
                                                || !user.isAccountNonExpired()
                                                || !user.isCredentialsNonExpired()) {

                                        SecurityContextHolder.clearContext();
                                        response.sendError(
                                                        HttpServletResponse.SC_FORBIDDEN,
                                                        "Cuenta desactivada o bloqueada");
                                        return;
                                }

                                if (jwtService.isValid(token, user)) {
                                        if(!authSessionService.isAccessAllowed(token,account)) {
                                            response.sendError(401,"La sesión fue cerrada o revocada");return;
                                        }

                                        if (mustChangePassword(account)
                                                        && !isPasswordChangeRequestAllowed(request)) {
                                                SecurityContextHolder.clearContext();
                                                response.sendError(
                                                                428,
                                                                "Debes cambiar tu contraseña para continuar");
                                                return;
                                        }

                                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                                        user,
                                                        null,
                                                        user.getAuthorities());

                                        authToken.setDetails(
                                                        new WebAuthenticationDetailsSource()
                                                                        .buildDetails(request));

                                        SecurityContextHolder
                                                        .getContext()
                                                        .setAuthentication(authToken);
                                }
                        }

                } catch (JwtException | IllegalArgumentException | AuthenticationException ex) {

                        SecurityContextHolder.clearContext();
                        response.sendError(
                                        HttpServletResponse.SC_UNAUTHORIZED,
                                        "Token inválido o expirado");
                        return;
                }

                filterChain.doFilter(request, response);
        }

        private boolean mustChangePassword(Account account) {

                if (account == null || !account.isPasswordChangeRequired()) {
                        return false;
                }

                return account.getRoles()
                                .stream()
                                .noneMatch(role -> RoleName.ROLE_ESTUDIANTE.name().equals(role.getName()));
        }

        private boolean isPasswordChangeRequestAllowed(HttpServletRequest request) {

                String requestUri = request.getRequestURI();
                String contextPath = request.getContextPath();
                String path = contextPath == null || contextPath.isBlank()
                                ? requestUri
                                : requestUri.substring(contextPath.length());

                return path.equals("/api/account/me")
                                || path.equals("/api/account/me/password")
                                || path.equals("/api/auth/logout") || path.equals("/api/auth/logout-all");
        }
}
