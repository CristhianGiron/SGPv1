package com.sgp.systemsgp.dto.location;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParishResponse {

    private Long id;

    private String code;

    private String name;
}