/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PdfResponseFactory.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente PdfResponseFactory del backend del SGP.
 */

package com.sgp.systemsgp.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;

final class PdfResponseFactory {

    private PdfResponseFactory() {
    }

    static ResponseEntity<byte[]> inline(byte[] pdf) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=preview.pdf")
                .header(HttpHeaders.CACHE_CONTROL, "no-store").body(pdf);
    }

    static ResponseEntity<byte[]> attachment(
            byte[] pdf,
            String filename) {

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(filename, StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .body(pdf);
    }
}
