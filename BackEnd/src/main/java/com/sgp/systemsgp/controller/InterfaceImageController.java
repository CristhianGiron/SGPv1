package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.interfaceimage.InterfaceImageFileResponse;
import com.sgp.systemsgp.dto.interfaceimage.InterfaceImageResponse;
import com.sgp.systemsgp.service.InterfaceImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class InterfaceImageController {

    private final InterfaceImageService interfaceImageService;

    @GetMapping("/api/public/interface-images")
    public List<InterfaceImageResponse> activeImages(
            @RequestParam(defaultValue = "DASHBOARD") String placement) {

        return interfaceImageService.activeImages(placement);
    }

    @GetMapping("/api/public/interface-images/{id}/content")
    public ResponseEntity<byte[]> publicContent(@PathVariable Long id) {
        InterfaceImageFileResponse response = interfaceImageService.file(id);
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

    @GetMapping("/api/admin/interface-images")
    public List<InterfaceImageResponse> adminImages(
            @RequestParam(defaultValue = "DASHBOARD") String placement) {

        return interfaceImageService.adminImages(placement);
    }

    @PostMapping(
            value = "/api/admin/interface-images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public InterfaceImageResponse upload(
            Authentication authentication,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "DASHBOARD") String placement,
            @RequestParam(required = false) Integer displayOrder,
            @RequestParam(required = false) Boolean active,
            @RequestParam("file") MultipartFile file) {

        return interfaceImageService.upload(
                authentication.getName(),
                title,
                description,
                placement,
                displayOrder,
                active,
                file);
    }

    @PatchMapping("/api/admin/interface-images/{id}")
    public InterfaceImageResponse updateMeta(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam(defaultValue = "DASHBOARD") String placement,
            @RequestParam(required = false) Integer displayOrder,
            @RequestParam(required = false) Boolean active) {

        return interfaceImageService.updateMeta(
                id,
                title,
                description,
                placement,
                displayOrder,
                active);
    }

    @DeleteMapping("/api/admin/interface-images/{id}")
    public void delete(@PathVariable Long id) {
        interfaceImageService.delete(id);
    }
}
