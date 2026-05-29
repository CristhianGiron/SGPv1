package com.sgp.systemsgp.dto.institution;

import java.util.Set;

import com.sgp.systemsgp.enums.*;

import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateInstitutionRequest {

    @Size(max = 180, message = "El nombre de la institución no puede superar 180 caracteres")
    private String name;

    private InstitutionType type;

    private InstitutionSupport support;

    @Size(max = 255, message = "La dirección no puede superar 255 caracteres")
    private String address;

    @Pattern(regexp = "^$|^[0-9+()\\s-]{7,20}$", message = "El teléfono institucional no tiene un formato válido")
    private String phone;

    @Email(message = "El correo institucional no tiene un formato válido")
    @Size(max = 120, message = "El correo institucional no puede superar 120 caracteres")
    private String email;

    @Pattern(regexp = "^$|^https?://.+", message = "El sitio web debe iniciar con http:// o https://")
    @Size(max = 180, message = "El sitio web no puede superar 180 caracteres")
    private String website;

    private Boolean agreementActive;

    private Boolean acceptsInterns;

    @Positive(message = "La provincia seleccionada no es válida")
    private Long provinceId;

    @Positive(message = "El cantón seleccionado no es válido")
    private Long cantonId;

    @Positive(message = "La parroquia seleccionada no es válida")
    private Long parishId;

    private SchoolRegime regime;

    private EducationModality modality;

    @PositiveOrZero(message = "La cantidad de docentes no puede ser negativa")
    @Max(value = 100000, message = "La cantidad de docentes es demasiado alta")
    private Integer teacherCount;

    @PositiveOrZero(message = "La cantidad de estudiantes no puede ser negativa")
    @Max(value = 1000000, message = "La cantidad de estudiantes es demasiado alta")
    private Integer studentCount;

    @Size(max = 2000, message = "La misión no puede superar 2000 caracteres")
    private String mission;

    @Size(max = 2000, message = "La visión no puede superar 2000 caracteres")
    private String vision;

    @Size(max = 2000, message = "Los valores institucionales no pueden superar 2000 caracteres")
    private String institutionalValues;

    @Size(max = 8, message = "No se pueden seleccionar más de 8 niveles educativos")
    private Set<EducationLevel> educationLevels;

}
