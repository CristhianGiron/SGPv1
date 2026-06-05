package com.sgp.systemsgp.dto.interfaceimage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterfaceImageFileResponse {

    private String originalFilename;

    private String contentType;

    private Long fileSize;

    private byte[] data;
}
