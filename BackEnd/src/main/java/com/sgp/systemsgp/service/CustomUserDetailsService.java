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
