package com.sgp.systemsgp.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

final class PdfResponseFactory {

    private PdfResponseFactory() {
    }

    static ResponseEntity<byte[]> attachment(
            byte[] pdf,
            String filename) {

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(filename)
                                .build()
                                .toString())
                .body(pdf);
    }
}
