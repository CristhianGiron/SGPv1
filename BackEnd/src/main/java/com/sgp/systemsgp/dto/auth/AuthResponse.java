package com.sgp.systemsgp.dto.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {

    private String accessToken;

    private String refreshToken;

    private String username;

    private boolean passwordChangeRequired;
}
