/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          BootstrapService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa la lógica de aplicación de el módulo Bootstrap Service.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.admin.CreateAdminRequest;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.Role;

import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class BootstrapService {

        private final AccountRepository accountRepository;

        private final RoleRepository roleRepository;

        private final PasswordEncoder passwordEncoder;

        /*
         * CREAR SOLO SI NO EXISTE ADMIN
         */
        public Long createFirstAdmin(CreateAdminRequest request) {

                // VERIFICAR SI YA EXISTE ADMIN
                boolean adminExists = accountRepository
                                .existsByRoleName(RoleName.ROLE_ADMIN.name());

                if (adminExists) {
                        throw new BadRequestException(
                                        "Ya existe un ADMIN en el sistema");
                }

                Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN.name())
                                .orElseThrow(() -> new NotFoundException("ROLE_ADMIN no existe"));

                Person person = Person.builder()
                                .names(request.getNames())
                                .lastNames(request.getLastNames())
                                .cedula(request.getCedula())
                                .institutionalEmail(request.getInstitutionalEmail())
                                .build();

                Account admin = Account.builder()
                                .username(request.getUsername())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .person(person)
                                .roles(Set.of(adminRole))
                                .enabled(true)
                                .passwordChangeRequired(true)
                                .build();

                return accountRepository.save(admin).getId();
        }
}
