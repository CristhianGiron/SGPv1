/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PublicPracticePhotoController.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Expone las operaciones HTTP relacionadas con las evidencias fotográficas.
 */

package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.practicephoto.PracticePhotoFileResponse;
import com.sgp.systemsgp.service.PracticePhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/practice-photos")
@RequiredArgsConstructor
public class PublicPracticePhotoController {

    private final PracticePhotoService practicePhotoService;

    @GetMapping("/{publicToken}/content")
    public ResponseEntity<byte[]> getContent(
            @PathVariable String publicToken) {

        PracticePhotoFileResponse response =
                practicePhotoService.getPublicContent(publicToken);
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
