package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.career.CreateCareerRequest;
import com.sgp.systemsgp.dto.career.CareerResponse;
import com.sgp.systemsgp.dto.career.UpdateCareerRequest;
import com.sgp.systemsgp.service.CareerService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/careers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'DIRECTOR_PRACTICAS')")
public class CareerController {

    private final CareerService careerService;

    /*
     * CREAR
     */
    @PostMapping
    public CareerResponse create(

            @Valid

            @RequestBody

            CreateCareerRequest request) {

        return careerService.create(request);
    }

    /*
     * LISTAR
     */
    @GetMapping
    public List<CareerResponse> getAll() {

        return careerService.getAll();
    }

    /*
     * OBTENER
     */
    @GetMapping("/{id}")
    public CareerResponse getById(

            @PathVariable Long id) {

        return careerService.getById(id);
    }

    /*
     * ACTUALIZAR
     */
    @PutMapping("/{id}")
    public CareerResponse update(

            @PathVariable Long id,

            @Valid

            @RequestBody UpdateCareerRequest request) {

        return careerService.update(id, request);
    }

    /*
     * DESACTIVAR
     */
    @PatchMapping("/{id}/disable")
    public void disable(

            @PathVariable Long id) {

        careerService.disable(id);
    }

    /*
     * ACTIVAR
     */
    @PatchMapping("/{id}/enable")
    public void enable(

            @PathVariable Long id) {

        careerService.enable(id);
    }

    /*
     * SOFT DELETE
     */
    @DeleteMapping("/{id}")
    public void softDelete(

            @PathVariable Long id) {

        careerService.softDelete(id);
    }

    /*
     * RESTORE
     */
    @PatchMapping("/{id}/restore")
    public void restore(

            @PathVariable Long id) {

        careerService.restore(id);
    }

    /*
     * DELETE REAL
     */
    @DeleteMapping("/{id}/force")
    public void forceDelete(

            @PathVariable Long id) {

        careerService.forceDelete(id);
    }
}
