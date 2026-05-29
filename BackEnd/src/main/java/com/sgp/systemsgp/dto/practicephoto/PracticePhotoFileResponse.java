package com.sgp.systemsgp.dto.practicephoto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PracticePhotoFileResponse {

    private final byte[] data;

    private final String contentType;

    private final String originalFilename;

    private final Long fileSize;
}
