package com.sgp.systemsgp.dto.location;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProvinceResponse {

    private Long id;

    private String code;

    private String name;
}