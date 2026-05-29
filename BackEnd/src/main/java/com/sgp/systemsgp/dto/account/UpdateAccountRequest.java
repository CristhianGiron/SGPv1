package com.sgp.systemsgp.dto.account;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.Data;

@Data
public class UpdateAccountRequest {

    @Size(max = 80, message = "Los nombres no pueden superar 80 caracteres")
    private String names;

    @Size(max = 80, message = "Los apellidos no pueden superar 80 caracteres")
    private String lastNames;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "El teléfono debe tener 10 dígitos")
    private String phone;

    @Size(max = 255, message = "La dirección no puede superar 255 caracteres")
    private String address;
}
