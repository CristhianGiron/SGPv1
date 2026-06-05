package com.sgp.systemsgp.dto.enrollment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ArchivePracticeBatchRequest {

    private List<Long> enrollmentIds;

    private boolean archived;
}
