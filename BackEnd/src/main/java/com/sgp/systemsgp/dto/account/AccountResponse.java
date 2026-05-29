package com.sgp.systemsgp.dto.account;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
public class AccountResponse {

    private Long id;

    private String username;

    private String names;

    private String lastNames;

    private String cedula;

    private String institutionalEmail;

    private String phone;

    private String address;

    private Set<String> roles;

    private String profileImageUrl;

    private Long academicCycleId;

    private String academicCycle;

    private Long institutionId;

    private String institution;

    private boolean enabled;

    private boolean locked;

    private boolean deleted;

    private boolean passwordChangeRequired;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
