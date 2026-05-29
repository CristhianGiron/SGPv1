package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.location.*;

import com.sgp.systemsgp.service.LocationService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    /*
     * PROVINCIAS
     */
    @GetMapping("/provinces")
    public List<ProvinceResponse> getProvinces() {

        return locationService.getProvinces();
    }

    /*
     * CANTONES POR PROVINCIA
     */
    @GetMapping("/provinces/{provinceId}/cantons")
    public List<CantonResponse> getCantons(
            @PathVariable Long provinceId
    ) {

        return locationService.getCantons(
                provinceId
        );
    }

    /*
     * PARROQUIAS POR CANTÓN
     */
    @GetMapping("/cantons/{cantonId}/parishes")
    public List<ParishResponse> getParishes(
            @PathVariable Long cantonId
    ) {

        return locationService.getParishes(
                cantonId
        );
    }

    /*
 * CREAR PROVINCIA
 */
@PostMapping("/provinces")
@PreAuthorize("hasRole('ADMIN')")
public ProvinceResponse createProvince(
        @Valid @RequestBody CreateProvinceRequest request
) {

    return locationService.createProvince(request);
}

@PostMapping("/cantons")
@PreAuthorize("hasRole('ADMIN')")
public CantonResponse createCanton(
        @Valid @RequestBody CreateCantonRequest request
) {

    return locationService.createCanton(request);
}

@PostMapping("/parishes")
@PreAuthorize("hasRole('ADMIN')")
public ParishResponse createParish(
        @Valid @RequestBody CreateParishRequest request
) {

    return locationService.createParish(request);
}
}
