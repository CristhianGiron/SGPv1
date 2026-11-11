/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AccountServiceRecoveryTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las cuentas de usuario mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.dto.account.AdminPasswordRecoveryRequest;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CourseGroupRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.Set;

class AccountServiceRecoveryTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseGroupRepository courseGroupRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AccountService accountService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        accountService = new AccountService(
                accountRepository,
                courseRepository,
                courseGroupRepository,
                passwordEncoder);
    }

    @Test
    void recoverAdminPasswordUpdatesPasswordWhenRecoveryIsEnabled() {
        ReflectionTestUtils.setField(accountService, "recoveryEnabled", true);
        ReflectionTestUtils.setField(accountService, "recoverySecret", "recovery-secret");

        Account admin = Account.builder()
                .username("admin")
                .password("old-hash")
                .passwordChangeRequired(true)
                .roles(Set.of(Role.builder().name(RoleName.ROLE_ADMIN.name()).build()))
                .build();

        when(accountRepository.lockForSecurityUpdate("admin"))
                .thenReturn(Optional.of(admin));
        when(passwordEncoder.encode("NewPass123!"))
                .thenReturn("encoded-new-pass");

        AdminPasswordRecoveryRequest request = new AdminPasswordRecoveryRequest();
        request.setUsername("admin");
        request.setNewPassword("NewPass123!");
        request.setConfirmPassword("NewPass123!");
        request.setRecoveryKey("recovery-secret");

        accountService.recoverAdminPassword(request);

        assertThat(admin.getPassword()).isEqualTo("encoded-new-pass");
        assertThat(admin.isPasswordChangeRequired()).isFalse();
        verify(accountRepository).save(admin);
    }

    @Test
    void recoverAdminPasswordRejectsNonAdminAccounts() {
        ReflectionTestUtils.setField(accountService, "recoveryEnabled", true);
        ReflectionTestUtils.setField(accountService, "recoverySecret", "recovery-secret");

        Account student = Account.builder()
                .username("student")
                .password("old-hash")
                .roles(Set.of(Role.builder().name(RoleName.ROLE_ESTUDIANTE.name()).build()))
                .build();

        when(accountRepository.lockForSecurityUpdate("student"))
                .thenReturn(Optional.of(student));

        AdminPasswordRecoveryRequest request = new AdminPasswordRecoveryRequest();
        request.setUsername("student");
        request.setNewPassword("NewPass123!");
        request.setConfirmPassword("NewPass123!");
        request.setRecoveryKey("recovery-secret");

        assertThatThrownBy(() -> accountService.recoverAdminPassword(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo los usuarios con rol ADMIN pueden recuperarse con este endpoint");
    }
}
