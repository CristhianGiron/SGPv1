package com.sgp.systemsgp.dto.finalreport;

import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateFinalReportInstitutionalSectionRequest {

    @Size(max = 1200, message = "La conclusión 1 no puede superar 1200 caracteres")
    private String conclusion1;

    @Size(max = 1200, message = "La conclusión 2 no puede superar 1200 caracteres")
    private String conclusion2;

    @Size(max = 1200, message = "La conclusión 3 no puede superar 1200 caracteres")
    private String conclusion3;

    @Size(max = 1200, message = "La recomendación 1 no puede superar 1200 caracteres")
    private String recommendation1;

    @Size(max = 1200, message = "La recomendación 2 no puede superar 1200 caracteres")
    private String recommendation2;

    @Size(max = 1200, message = "La recomendación 3 no puede superar 1200 caracteres")
    private String recommendation3;
}
