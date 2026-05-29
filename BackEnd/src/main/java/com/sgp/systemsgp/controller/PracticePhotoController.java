package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.practicephoto.PracticePhotoFileResponse;
import com.sgp.systemsgp.dto.practicephoto.PracticePhotoResponse;
import com.sgp.systemsgp.service.PracticePhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/practice-photos")
@RequiredArgsConstructor
public class PracticePhotoController {

    private final PracticePhotoService practicePhotoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public PracticePhotoResponse upload(
            Authentication authentication,
            @RequestParam Long enrollmentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String description,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate practiceDate) {

        return practicePhotoService.upload(
                authentication.getName(),
                enrollmentId,
                file,
                description,
                practiceDate);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public List<PracticePhotoResponse> myPhotos(
            Authentication authentication) {

        return practicePhotoService.myPhotos(
                authentication.getName());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ESTUDIANTE')")
    public void delete(
            Authentication authentication,
            @PathVariable Long id) {

        practicePhotoService.delete(
                id,
                authentication.getName());
    }

    @GetMapping("/review")
    @PreAuthorize("hasAnyRole('TUTOR_PRACTICAS','TUTOR_INSTITUCIONAL','DIRECTOR_PRACTICAS','ADMIN')")
    public List<PracticePhotoResponse> reviewQueue(
            Authentication authentication) {

        return practicePhotoService.reviewQueue(
                authentication.getName());
    }

    @GetMapping("/enrollment/{enrollmentId}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','TUTOR_INSTITUCIONAL','DIRECTOR_PRACTICAS','ADMIN')")
    public List<PracticePhotoResponse> enrollmentPhotos(
            Authentication authentication,
            @PathVariable Long enrollmentId) {

        return practicePhotoService.enrollmentPhotos(
                enrollmentId,
                authentication.getName());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','TUTOR_INSTITUCIONAL','DIRECTOR_PRACTICAS','ADMIN')")
    public PracticePhotoResponse getById(
            Authentication authentication,
            @PathVariable Long id) {

        return practicePhotoService.getById(
                id,
                authentication.getName());
    }

    @GetMapping("/{id}/content")
    @PreAuthorize("hasAnyRole('ESTUDIANTE','TUTOR_PRACTICAS','TUTOR_INSTITUCIONAL','DIRECTOR_PRACTICAS','ADMIN')")
    public ResponseEntity<byte[]> getContent(
            Authentication authentication,
            @PathVariable Long id) {

        PracticePhotoFileResponse response = practicePhotoService.getContent(
                id,
                authentication.getName());

        MediaType mediaType = response.getContentType() != null
                ? MediaType.parseMediaType(response.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(response.getFileSize())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline()
                                .filename(response.getOriginalFilename())
                                .build()
                                .toString())
                .body(response.getData());
    }
}
