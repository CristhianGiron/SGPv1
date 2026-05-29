package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.faculty.*;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Faculty;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.repository.FacultyRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FacultyService {

    private final FacultyRepository facultyRepository;

    private final InstitutionRepository institutionRepository;

    /*
     * CREAR
     */
    public FacultyResponse create(
            CreateFacultyRequest request) {

        Institution institution = institutionRepository

                .findByIdAndDeletedFalse(request.getInstitutionId())

                .orElseThrow(() -> new NotFoundException(
                        "Institución no encontrada"));

        if (institution.getType() != InstitutionType.UNIVERSIDAD) {

            throw new BadRequestException(
                    "Solo las universidades pueden tener facultades");
        }

        Faculty faculty = Faculty.builder()

                .name(request.getName())

                .code(request.getCode())

                .description(request.getDescription())

                .institution(institution)

                .active(true)

                .deleted(false)

                .createdAt(LocalDateTime.now())

                .build();

        facultyRepository.save(faculty);

        return mapToResponse(faculty);
    }

    /*
     * LISTAR
     */
    public List<FacultyResponse> getAll() {

        return facultyRepository.findByDeletedFalse()

                .stream()

                .map(this::mapToResponse)

                .toList();
    }

    /*
     * OBTENER
     */
    public FacultyResponse getById(Long id) {

        return mapToResponse(getFaculty(id));
    }

    /*
     * UPDATE
     */
    public FacultyResponse update(
            Long id,
            UpdateFacultyRequest request) {

        Faculty faculty = getFaculty(id);

        if (request.getName() != null) {
            faculty.setName(request.getName());
        }

        if (request.getCode() != null) {
            faculty.setCode(request.getCode());
        }

        if (request.getDescription() != null) {
            faculty.setDescription(request.getDescription());
        }

        if (request.getActive() != null) {
            faculty.setActive(request.getActive());
        }

        faculty.setUpdatedAt(LocalDateTime.now());

        facultyRepository.save(faculty);

        return mapToResponse(faculty);
    }

    /*
     * DELETE
     */
    public void delete(Long id) {

        Faculty faculty = getFaculty(id);

        faculty.setDeleted(true);

        faculty.setDeletedAt(LocalDateTime.now());

        faculty.setActive(false);

        facultyRepository.save(faculty);
    }

    /*
     * ENTITY
     */
    private Faculty getFaculty(Long id) {

        return facultyRepository.findByIdAndDeletedFalse(id)

                .orElseThrow(() -> new NotFoundException(
                        "Facultad no encontrada"));
    }

    /*
     * MAPPER
     */
    private FacultyResponse mapToResponse(
            Faculty faculty) {

        return FacultyResponse.builder()

                .id(faculty.getId())

                .name(faculty.getName())

                .code(faculty.getCode())

                .description(faculty.getDescription())

                .institutionId(
                        faculty.getInstitution().getId())

                .institutionName(
                        faculty.getInstitution().getName())

                .active(faculty.isActive())

                .createdAt(faculty.getCreatedAt())

                .updatedAt(faculty.getUpdatedAt())

                .build();
    }
}
