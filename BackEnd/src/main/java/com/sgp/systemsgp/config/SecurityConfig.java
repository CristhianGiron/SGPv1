package com.sgp.systemsgp.config;

import lombok.RequiredArgsConstructor;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;

import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;

import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

        private final JwtAuthFilter jwtAuthFilter;
        private final RateLimitingFilter rateLimitingFilter;

        @Bean
        public PasswordEncoder passwordEncoder() {

                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration config) throws Exception {

                return config.getAuthenticationManager();
        }

        @Bean
        public SecurityFilterChain securityFilterChain(
                        HttpSecurity http) throws Exception {

                http
                                .csrf(csrf -> csrf.disable())

                                .sessionManagement(session -> session.sessionCreationPolicy(
                                                SessionCreationPolicy.STATELESS))

                                .authorizeHttpRequests(auth -> auth

                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                                .requestMatchers("/error").permitAll()

                                                /*
                                                 * Endpoints públicos
                                                 */
                                                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/api/bootstrap/admin").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/locations/**").permitAll()

                                                /*
                                                 * Perfil autenticado
                                                 */
                                                .requestMatchers("/api/account/me").authenticated()
                                                .requestMatchers("/api/account/me/**").authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/account/*/image").authenticated()

                                                /*
                                                 * Administración de usuarios y catálogos base
                                                 */
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/account").hasRole("ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/account/search")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS", "TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.POST, "/api/locations/**").hasRole("ADMIN")

                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/faculties", "/api/faculties/**",
                                                                "/api/careers", "/api/careers/**",
                                                                "/api/academic-cycles", "/api/academic-cycles/**",
                                                                "/api/grades", "/api/grades/**",
                                                                "/api/grade-parallels", "/api/grade-parallels/**",
                                                                "/api/subjects", "/api/subjects/**")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS")

                                                .requestMatchers("/api/faculties", "/api/faculties/**").hasRole("ADMIN")
                                                .requestMatchers("/api/careers", "/api/careers/**").hasRole("ADMIN")
                                                .requestMatchers("/api/academic-cycles", "/api/academic-cycles/**").hasRole("ADMIN")
                                                .requestMatchers("/api/grades", "/api/grades/**").hasRole("ADMIN")
                                                .requestMatchers("/api/grade-parallels", "/api/grade-parallels/**").hasRole("ADMIN")
                                                .requestMatchers("/api/subjects", "/api/subjects/**").hasRole("ADMIN")

                                                /*
                                                 * Gestión de prácticas
                                                 */
                                                .requestMatchers(HttpMethod.DELETE, "/api/courses/*/force").hasRole("ADMIN")
                                                .requestMatchers("/api/courses/*/enroll").hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/courses/*/enrollments")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS", "TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/courses/*/groups")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS", "TUTOR_PRACTICAS")
                                                // Cambio solicitado: el tutor de practicas y admin gestionan grupos.
                                                .requestMatchers(HttpMethod.POST, "/api/courses/*/groups")
                                                .hasAnyRole("ADMIN", "TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PATCH, "/api/courses/groups/**")
                                                .hasAnyRole("ADMIN", "TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PATCH, "/api/courses/*/practice-profile")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/courses/search").authenticated()
                                                .requestMatchers("/api/courses", "/api/courses/**")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS")
                                                .requestMatchers("/api/enrollments/me").hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/enrollments/practices")
                                                .hasAnyRole("ESTUDIANTE", "ADMIN", "DIRECTOR_PRACTICAS",
                                                                "TUTOR_PRACTICAS", "TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.DELETE, "/api/enrollments/*")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.PATCH, "/api/enrollments/*/group/*")
                                                .hasAnyRole("ADMIN", "TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PATCH, "/api/enrollments/*/complete")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS", "TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PATCH, "/api/enrollments/*/reopen")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS", "TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PATCH, "/api/enrollments/*/archive")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS", "TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PATCH, "/api/enrollments/*/unarchive")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS", "TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PATCH, "/api/enrollments/archive-completed")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS", "TUTOR_PRACTICAS")
                                                .requestMatchers("/api/enrollments/**")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS", "TUTOR_PRACTICAS",
                                                                "TUTOR_INSTITUCIONAL")

                                                .requestMatchers(HttpMethod.POST, "/api/activity-plans")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-plans/me")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-plans/me/summary")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-plans/review")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-plans/review/summary")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-plans/submitted")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-plans/submitted/summary")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PUT, "/api/activity-plans/*")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.PATCH, "/api/activity-plans/*/submit")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.PATCH, "/api/activity-plans/*/review")
                                                .hasAnyRole("TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-plans/*/pdf")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS",
                                                                "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-plans/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS",
                                                                "ADMIN")

                                                .requestMatchers(HttpMethod.POST, "/api/practice-reports")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-reports/me")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-reports/me/summary")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-reports/review")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-reports/review/summary")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-reports/submitted")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-reports/submitted/summary")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PUT, "/api/practice-reports/*")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.PATCH, "/api/practice-reports/*/submit")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.PATCH, "/api/practice-reports/*/review")
                                                .hasAnyRole("TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-reports/*/pdf")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS",
                                                                "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-reports/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS",
                                                                "ADMIN")

                                                .requestMatchers(HttpMethod.POST, "/api/final-reports")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/final-reports/me")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/final-reports/me/summary")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/final-reports/practice-review")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/final-reports/practice-review/summary")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/final-reports/institutional-review")
                                                .hasRole("TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.GET, "/api/final-reports/institutional-review/summary")
                                                .hasRole("TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.GET, "/api/final-reports/submitted")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/final-reports/submitted/summary")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PUT, "/api/final-reports/*")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.PATCH, "/api/final-reports/*/submit")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.PATCH, "/api/final-reports/*/institutional-section")
                                                .hasRole("TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.PATCH, "/api/final-reports/*/practice-review")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PATCH, "/api/final-reports/*/director-review")
                                                .hasRole("DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PATCH, "/api/final-reports/*/institutional-review")
                                                .hasRole("TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.GET, "/api/final-reports/*/pdf")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "TUTOR_INSTITUCIONAL",
                                                                "DIRECTOR_PRACTICAS", "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/final-reports/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "TUTOR_INSTITUCIONAL",
                                                                "DIRECTOR_PRACTICAS", "ADMIN")

                                                .requestMatchers(HttpMethod.POST, "/api/activity-evaluations")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-evaluations/me")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-evaluations/managed")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PUT, "/api/activity-evaluations/*")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-evaluations/*/pdf")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS",
                                                                "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/activity-evaluations/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS",
                                                                "ADMIN")

                                                .requestMatchers(HttpMethod.POST, "/api/practice-follow-up-reports")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-follow-up-reports/me")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-follow-up-reports/managed")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PUT, "/api/practice-follow-up-reports/*")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-follow-up-reports/*/pdf")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS",
                                                                "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-follow-up-reports/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS",
                                                                "ADMIN")

                                                .requestMatchers(HttpMethod.POST, "/api/completed-activity-records")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/completed-activity-records/me")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/completed-activity-records/me/summary")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/completed-activity-records/review")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/completed-activity-records/review/summary")
                                                .hasRole("TUTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/completed-activity-records/submitted")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/completed-activity-records/submitted/summary")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.PUT, "/api/completed-activity-records/*")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.PATCH, "/api/completed-activity-records/*/submit")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.PATCH, "/api/completed-activity-records/*/review")
                                                .hasAnyRole("TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS")
                                                .requestMatchers(HttpMethod.GET, "/api/completed-activity-records/*/pdf")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS",
                                                                "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/completed-activity-records/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS",
                                                                "ADMIN")

                                                .requestMatchers(HttpMethod.POST, "/api/practice-photos")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-photos/me")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.DELETE, "/api/practice-photos/*")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-photos/review")
                                                .hasAnyRole("TUTOR_PRACTICAS", "TUTOR_INSTITUCIONAL",
                                                                "DIRECTOR_PRACTICAS", "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-photos/enrollment/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "TUTOR_INSTITUCIONAL",
                                                                "DIRECTOR_PRACTICAS", "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-photos/*/content")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "TUTOR_INSTITUCIONAL",
                                                                "DIRECTOR_PRACTICAS", "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-photos/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_PRACTICAS", "TUTOR_INSTITUCIONAL",
                                                                "DIRECTOR_PRACTICAS", "ADMIN")

                                                .requestMatchers(HttpMethod.POST, "/api/practice-schedules")
                                                .hasRole("TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-schedules/me")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-schedules/managed")
                                                .hasRole("TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-schedules/institution-review")
                                                .hasRole("DIRECTORA_INSTITUCION")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-schedules/review")
                                                .hasAnyRole("TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS", "ADMIN")
                                                .requestMatchers(HttpMethod.PUT, "/api/practice-schedules/*")
                                                .hasRole("TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.POST, "/api/practice-schedules/*/attendances")
                                                .hasRole("TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.PUT, "/api/practice-schedules/*/attendances/*")
                                                .hasRole("TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-schedules/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_INSTITUCIONAL", "TUTOR_PRACTICAS",
                                                                "DIRECTORA_INSTITUCION", "DIRECTOR_PRACTICAS",
                                                                "ADMIN")

                                                .requestMatchers(HttpMethod.POST, "/api/didactic-plans")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.GET, "/api/didactic-plans/me")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/didactic-plans/managed")
                                                .hasAnyRole("TUTOR_INSTITUCIONAL", "TUTOR_PRACTICAS",
                                                                "DIRECTOR_PRACTICAS", "ADMIN")
                                                .requestMatchers(HttpMethod.PUT, "/api/didactic-plans/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.DELETE, "/api/didactic-plans/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.PATCH, "/api/didactic-plans/*/submit")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.PATCH, "/api/didactic-plans/*/recommendations")
                                                .hasAnyRole("TUTOR_INSTITUCIONAL", "TUTOR_PRACTICAS",
                                                                "DIRECTOR_PRACTICAS", "ADMIN")
                                                .requestMatchers(HttpMethod.POST, "/api/didactic-plans/*/pdf")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_INSTITUCIONAL")
                                                .requestMatchers(HttpMethod.GET, "/api/didactic-plans/*/pdf")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_INSTITUCIONAL", "TUTOR_PRACTICAS",
                                                                "DIRECTOR_PRACTICAS", "ADMIN")
                                                .requestMatchers(HttpMethod.GET, "/api/didactic-plans/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_INSTITUCIONAL", "TUTOR_PRACTICAS",
                                                                "DIRECTOR_PRACTICAS", "ADMIN")

                                                .requestMatchers(HttpMethod.POST, "/api/practice-forms")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.POST, "/api/practice-forms/observations")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-forms/me")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-forms/observations/me")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-forms/assigned")
                                                .hasAnyRole("TUTOR_INSTITUCIONAL", "DIRECTORA_INSTITUCION")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-forms/managed")
                                                .hasAnyRole("TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS", "ADMIN")
                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/practice-forms/observations/managed")
                                                .hasAnyRole("TUTOR_PRACTICAS", "DIRECTOR_PRACTICAS", "ADMIN")
                                                .requestMatchers(HttpMethod.POST, "/api/practice-forms/*/duplicate")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.PUT, "/api/practice-forms/*")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.POST, "/api/practice-forms/*/send")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.POST, "/api/practice-forms/*/responses")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_INSTITUCIONAL",
                                                                "DIRECTORA_INSTITUCION")
                                                .requestMatchers(HttpMethod.PATCH,
                                                                "/api/practice-forms/*/questions/*/interpretation")
                                                .hasRole("ESTUDIANTE")
                                                .requestMatchers(HttpMethod.GET, "/api/practice-forms/*")
                                                .hasAnyRole("ESTUDIANTE", "TUTOR_INSTITUCIONAL",
                                                                "DIRECTORA_INSTITUCION", "TUTOR_PRACTICAS",
                                                                "DIRECTOR_PRACTICAS", "ADMIN")

                                                .requestMatchers(HttpMethod.DELETE, "/api/institutions/*/force").hasRole("ADMIN")
                                                .requestMatchers("/api/institutions", "/api/institutions/**")
                                                .hasAnyRole("ADMIN", "DIRECTOR_PRACTICAS")

                                                .requestMatchers("/api/notifications/**").authenticated()
                                                .requestMatchers("/ws/**").permitAll()

                                                /*
                                                 * Cualquier endpoint nuevo queda cerrado hasta clasificarlo.
                                                 */
                                                .anyRequest()
                                                .denyAll())

                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint((request, response, authException) -> response
                                                                .sendError(HttpServletResponse.SC_UNAUTHORIZED,
                                                                                "No autenticado"))
                                                .accessDeniedHandler((request, response, accessDeniedException) -> response
                                                                .sendError(HttpServletResponse.SC_FORBIDDEN,
                                                                                "Acceso denegado")))
                                /// bootstrap/admin
                                .addFilterBefore(
                                                rateLimitingFilter,
                                                UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(
                                                jwtAuthFilter,
                                                UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}
