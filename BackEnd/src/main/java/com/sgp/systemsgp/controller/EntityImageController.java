/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EntityImageController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con las imágenes de las entidades.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.course.*;
import com.sgp.systemsgp.dto.institution.*;
import com.sgp.systemsgp.service.EntityImageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequiredArgsConstructor
public class EntityImageController {
    private final EntityImageService images;

    @PostMapping(value = "/api/courses", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public CourseResponse createCourse(Authentication authentication, @Valid @RequestPart("data") CreateCourseRequest data,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return images.createCourse(authentication.getName(), data, image);
    }
    @PostMapping(value = "/api/institutions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@institutionCatalogAccess.canCreate(authentication.name, #data.type)")
    public InstitutionResponse createInstitution(@Valid @RequestPart("data") CreateInstitutionRequest data,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return images.createInstitution(data, image);
    }
    @PatchMapping(value = "/api/institutions/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@institutionCatalogAccess.canManage(authentication.name, #id, #data.type)")
    public InstitutionResponse updateInstitution(@PathVariable Long id, @Valid @RequestPart("data") UpdateInstitutionRequest data,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return images.updateInstitution(id, data, image);
    }
    @PutMapping(value = "/api/courses/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public CourseResponse replaceCover(Authentication authentication, @PathVariable Long id, @RequestPart("image") MultipartFile image) {
        return images.replaceCover(authentication.getName(), id, image);
    }
    @DeleteMapping("/api/courses/{id}/cover")
    @PreAuthorize("hasAnyRole('ADMIN','DIRECTOR_PRACTICAS')")
    public void removeCover(Authentication authentication, @PathVariable Long id) { images.removeCover(authentication.getName(), id); }
    @DeleteMapping("/api/institutions/{id}/logo")
    @PreAuthorize("@institutionCatalogAccess.canManage(authentication.name, #id)")
    public void removeLogo(@PathVariable Long id) { images.removeLogo(id); }
    @GetMapping("/api/courses/{id}/cover")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> cover(Authentication authentication, @PathVariable Long id) { return response(images.cover(authentication.getName(), id)); }
    @GetMapping("/api/institutions/{id}/logo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> logo(@PathVariable Long id) { return response(images.logo(id)); }
    private ResponseEntity<byte[]> response(EntityImageService.ImageFile file) {
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType()))
                .cacheControl(CacheControl.noStore()).header("X-Content-Type-Options", "nosniff").body(file.data());
    }
}
