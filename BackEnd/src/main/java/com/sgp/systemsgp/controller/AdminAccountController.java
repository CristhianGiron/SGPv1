package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.admin.CreateAccountAdminRequest;
import com.sgp.systemsgp.service.AdminAccountService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/accounts")
@RequiredArgsConstructor
public class AdminAccountController {

    private final AdminAccountService adminAccountService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> createAccount(
            @Valid @RequestBody CreateAccountAdminRequest request) {
        Long accountId = adminAccountService.createAccount(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(accountId);
    }

    @PatchMapping("/{id}/disable")

    @PreAuthorize("hasRole('ADMIN')")

    public void disable(
            @PathVariable Long id) {

        adminAccountService.disable(id);
    }

    @PatchMapping("/{id}/enable")

    @PreAuthorize("hasRole('ADMIN')")

    public void enable(
            @PathVariable Long id) {

        adminAccountService.enable(id);
    }

    @PatchMapping("/{id}/lock")

    @PreAuthorize("hasRole('ADMIN')")

    public void lock(
            @PathVariable Long id) {

        adminAccountService.lock(id);
    }

    @PatchMapping("/{id}/unlock")

    @PreAuthorize("hasRole('ADMIN')")

    public void unlock(
            @PathVariable Long id) {

        adminAccountService.unlock(id);
    }

    @DeleteMapping("/{id}")

    @PreAuthorize("hasRole('ADMIN')")

    public void delete(
            @PathVariable Long id) {

        adminAccountService.softDelete(id);
    }

    @PatchMapping("/{id}/restore")

    @PreAuthorize("hasRole('ADMIN')")

    public void restore(
            @PathVariable Long id) {

        adminAccountService.restore(id);
    }

    @PatchMapping("/{id}/academic-cycle/{academicCycleId}")

    @PreAuthorize("hasRole('ADMIN')")

    public void assignAcademicCycle(
            @PathVariable Long id,
            @PathVariable Long academicCycleId) {

        adminAccountService.assignAcademicCycle(
                id,
                academicCycleId);
    }
}
