package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.sgp.systemsgp.dto.grade.CreateGradeRequest;
import com.sgp.systemsgp.dto.grade.UpdateGradeRequest;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.Grade;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.repository.GradeRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;

class GradeServiceTest {

    @Mock
    private GradeRepository gradeRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    private GradeService gradeService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        gradeService = new GradeService(
                gradeRepository,
                institutionRepository);
    }

    @Test
    void createRejectsUniversityInstitution() {

        CreateGradeRequest request = new CreateGradeRequest();
        request.setName("Primero BGU");
        request.setCode("1BGU-TEST");
        request.setLevel(1);
        request.setInstitutionId(1L);

        Institution university = Institution.builder()
                .id(1L)
                .name("Universidad Test")
                .type(InstitutionType.UNIVERSIDAD)
                .build();

        when(gradeRepository.existsByCode("1BGU-TEST"))
                .thenReturn(false);

        when(institutionRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(university));

        assertThatThrownBy(() -> gradeService.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo escuelas y colegios pueden tener grados");

        verify(gradeRepository, never())
                .save(any(Grade.class));
    }

    @Test
    void updateRejectsUniversityInstitution() {

        UpdateGradeRequest request = new UpdateGradeRequest();
        request.setInstitutionId(2L);

        Institution school = Institution.builder()
                .id(1L)
                .name("Escuela Test")
                .type(InstitutionType.ESCUELA)
                .build();

        Institution university = Institution.builder()
                .id(2L)
                .name("Universidad Test")
                .type(InstitutionType.UNIVERSIDAD)
                .build();

        Grade grade = Grade.builder()
                .id(1L)
                .name("Primero EGB")
                .institution(school)
                .build();

        when(gradeRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(grade));

        when(institutionRepository.findByIdAndDeletedFalse(2L))
                .thenReturn(Optional.of(university));

        assertThatThrownBy(() -> gradeService.update(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo escuelas y colegios pueden tener grados");

        verify(gradeRepository, never())
                .save(any(Grade.class));
    }
}
