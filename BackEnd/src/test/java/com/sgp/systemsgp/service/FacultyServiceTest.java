package com.sgp.systemsgp.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sgp.systemsgp.dto.faculty.CreateFacultyRequest;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.Faculty;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.repository.FacultyRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

class FacultyServiceTest {

    @Mock
    private FacultyRepository facultyRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    private FacultyService facultyService;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        facultyService = new FacultyService(
                facultyRepository,
                institutionRepository);
    }

    @Test
    void createRejectsSchoolInstitution() {

        CreateFacultyRequest request = new CreateFacultyRequest();
        request.setName("Facultad Test");
        request.setCode("FAC-TEST");
        request.setInstitutionId(1L);

        Institution school = Institution.builder()
                .id(1L)
                .name("Colegio Test")
                .type(InstitutionType.COLEGIO)
                .build();

        when(institutionRepository.findByIdAndDeletedFalse(1L))
                .thenReturn(Optional.of(school));

        assertThatThrownBy(() -> facultyService.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Solo las universidades pueden tener facultades");

        verify(facultyRepository, never())
                .save(any(Faculty.class));
    }
}
