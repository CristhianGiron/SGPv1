package com.sgp.systemsgp.dto.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateAnnouncementRequest {

    @NotBlank(message = "El titulo es obligatorio")
    @Size(max = 120, message = "El título no puede superar 120 caracteres")
    private String title;

    @NotBlank(message = "El mensaje es obligatorio")
    @Size(max = 2000, message = "El mensaje no puede superar 2000 caracteres")
    private String message;

    @Pattern(regexp = "^$|^#.*|^https?://.+", message = "El enlace debe ser una ruta interna con # o una URL http/https")
    @Size(max = 500, message = "El enlace no puede superar 500 caracteres")
    private String link;

    @Size(max = 20, message = "No se pueden enviar más de 20 roles destino")
    private List<String> roles;
}
