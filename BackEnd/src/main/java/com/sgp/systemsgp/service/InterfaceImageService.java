package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.interfaceimage.InterfaceImageFileResponse;
import com.sgp.systemsgp.dto.interfaceimage.InterfaceImageResponse;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.InterfaceImage;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.InterfaceImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterfaceImageService {

    private static final long MAX_IMAGE_SIZE = 4 * 1024 * 1024;

    private static final String DEFAULT_PLACEMENT = "DASHBOARD";

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp");

    private final InterfaceImageRepository interfaceImageRepository;
    private final AccountRepository accountRepository;

    public List<InterfaceImageResponse> activeImages(String placement) {
        return interfaceImageRepository
                .findByPlacementAndActiveTrueOrderByDisplayOrderAscCreatedAtDesc(normalizePlacement(placement))
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<InterfaceImageResponse> adminImages(String placement) {
        return interfaceImageRepository
                .findByPlacementOrderByDisplayOrderAscCreatedAtDesc(normalizePlacement(placement))
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public InterfaceImageResponse upload(
            String username,
            String title,
            String description,
            String placement,
            Integer displayOrder,
            Boolean active,
            MultipartFile file) {

        validateImage(file);

        InterfaceImage image = InterfaceImage.builder()
                .title(normalizeRequired(title, "El título es obligatorio."))
                .description(normalizeText(description))
                .placement(normalizePlacement(placement))
                .displayOrder(displayOrder == null ? 0 : displayOrder)
                .active(active == null || active)
                .originalFilename(resolveFilename(file))
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .data(readBytes(file))
                .uploadedBy(getAccount(username))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return mapToResponse(interfaceImageRepository.save(image));
    }

    @Transactional
    public InterfaceImageResponse updateMeta(
            Long id,
            String title,
            String description,
            String placement,
            Integer displayOrder,
            Boolean active) {

        InterfaceImage image = getImage(id);
        image.setTitle(normalizeRequired(title, "El título es obligatorio."));
        image.setDescription(normalizeText(description));
        image.setPlacement(normalizePlacement(placement));
        image.setDisplayOrder(displayOrder == null ? 0 : displayOrder);
        image.setActive(active == null || active);
        image.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(interfaceImageRepository.save(image));
    }

    @Transactional
    public void delete(Long id) {
        interfaceImageRepository.delete(getImage(id));
    }

    public InterfaceImageFileResponse file(Long id) {
        InterfaceImage image = interfaceImageRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new NotFoundException("Imagen no encontrada"));

        return InterfaceImageFileResponse.builder()
                .originalFilename(image.getOriginalFilename())
                .contentType(image.getContentType())
                .fileSize(image.getFileSize())
                .data(image.getData())
                .build();
    }

    private InterfaceImage getImage(Long id) {
        return interfaceImageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Imagen no encontrada"));
    }

    private Account getAccount(String username) {
        return accountRepository.findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new NotFoundException("Cuenta no encontrada"));
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Selecciona una imagen.");
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new BadRequestException("La imagen no puede superar 4 MB.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Formato no permitido. Usa JPG, PNG o WEBP.");
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new BadRequestException("No se pudo leer la imagen.");
        }
    }

    private String resolveFilename(MultipartFile file) {
        String filename = StringUtils.cleanPath(file.getOriginalFilename() == null
                ? "imagen-interfaz"
                : file.getOriginalFilename());

        return filename.isBlank() ? "imagen-interfaz" : filename;
    }

    private String normalizePlacement(String value) {
        String normalized = normalizeText(value);
        return normalized == null ? DEFAULT_PLACEMENT : normalized.toUpperCase();
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new BadRequestException(message);
        }

        return normalized;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private InterfaceImageResponse mapToResponse(InterfaceImage image) {
        Account uploadedBy = image.getUploadedBy();

        return InterfaceImageResponse.builder()
                .id(image.getId())
                .title(image.getTitle())
                .description(image.getDescription())
                .placement(image.getPlacement())
                .displayOrder(image.getDisplayOrder())
                .active(image.isActive())
                .originalFilename(image.getOriginalFilename())
                .contentType(image.getContentType())
                .fileSize(image.getFileSize())
                .contentUrl("/api/public/interface-images/" + image.getId() + "/content")
                .uploadedBy(uploadedBy == null ? null : uploadedBy.getUsername())
                .createdAt(image.getCreatedAt())
                .updatedAt(image.getUpdatedAt())
                .build();
    }
}
