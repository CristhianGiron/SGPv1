/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CustomUserDetailsService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa la lógica de aplicación de el módulo Custom User Details Service.
 */

package com.sgp.systemsgp.service;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.*;

import org.springframework.stereotype.Service;

import com.sgp.systemsgp.model.Account;

import com.sgp.systemsgp.repository.AccountRepository;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService
                implements UserDetailsService {

        private final AccountRepository accountRepository;

        @Override
        public UserDetails loadUserByUsername(
                        String username) throws UsernameNotFoundException {

                Account account = accountRepository

                                .findByUsernameIgnoreCaseAndDeletedFalse(username)
                                .or(() -> accountRepository
                                                .findByPersonInstitutionalEmailIgnoreCaseAndDeletedFalse(username))

                                .orElseThrow(() -> new UsernameNotFoundException(
                                                "Usuario no encontrado"));

                /*
                 * USER DETAILS PROFESIONAL
                 */
                return User.builder()

                                .username(account.getUsername())

                                .password(account.getPassword())

                                /*
                                 * DESACTIVADA
                                 */
                                .disabled(!account.isEnabled())

                                /*
                                 * BLOQUEADA
                                 */
                                .accountLocked(account.isLocked())

                                /*
                                 * ROLES
                                 */
                                .authorities(

                                                account.getRoles()

                                                                .stream()

                                                                .map(role -> role.getName())

                                                                .toArray(String[]::new))

                                .build();
        }
}
