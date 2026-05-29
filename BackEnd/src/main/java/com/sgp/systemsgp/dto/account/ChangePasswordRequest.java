package com.sgp.systemsgp.dto.account;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {

    @NotBlank
    private String currentPassword;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 8, max = 72, message = "La nueva contraseña debe tener entre 8 y 72 caracteres")
    private String newPassword;

    @NotBlank(message = "La confirmación de contraseña es obligatoria")
    private String confirmPassword;

    @AssertTrue(message = "La confirmación no coincide con la nueva contraseña")
    public boolean isPasswordConfirmationValid() {
        return newPassword == null || confirmPassword == null || newPassword.equals(confirmPassword);
    }
}
