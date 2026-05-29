package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.career.CreateCareerRequest;
import com.sgp.systemsgp.dto.career.CareerResponse;
import com.sgp.systemsgp.dto.career.UpdateCareerRequest;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Faculty;
import com.sgp.systemsgp.repository.CareerRepository;
import com.sgp.systemsgp.repository.FacultyRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CareerService {

    private final CareerRepository careerRepository;

    private final FacultyRepository facultyRepository;

    /*
     * CREAR
     */
    @Transactional
    public CareerResponse create(
            CreateCareerRequest request) {

        String name = requireText(
                request.getName(),
                "El nombre de la carrera es obligatorio");

        String code = requireText(
                request.getCode(),
                "El código de la carrera es obligatorio");

        Faculty faculty = facultyRepository
                .findByIdAndDeletedFalse(request.getFacultyId())
                .orElseThrow(() -> new NotFoundException(
                        "Facultad no encontrada"));

        if (careerRepository.existsByCodeIgnoreCase(code)) {

            throw new BadRequestException(
                    "El código de la carrera ya existe");
        }

        boolean existsByName = careerRepository
                .existsByNameIgnoreCaseAndFacultyIdAndDeletedFalse(
                        name,
                        faculty.getId());

        if (existsByName) {

            throw new BadRequestException(
                    "La carrera ya existe en la facultad");
        }

        Career career = Career.builder()

                .name(name)

                .code(code)

                .description(request.getDescription())

                .durationCycles(request.getDurationCycles())

                .faculty(faculty)

                .active(true)

                .deleted(false)

                .createdAt(LocalDateTime.now())

                .build();

        careerRepository.save(career);

        return mapToResponse(career);
    }

    /*
     * OBTENER POR ID
     */
    public CareerResponse getById(Long id) {

        return mapToResponse(
                getCareer(id));
    }

    /*
     * LISTAR
     */
    public List<CareerResponse> getAll() {

        return careerRepository
                .findByDeletedFalse()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /*
     * ACTUALIZAR
     */
    @Transactional
    public CareerResponse update(

            Long id,

            UpdateCareerRequest request) {

        Career career = getCareer(id);

        if (request.getName() != null) {

            String name = requireText(
                    request.getName(),
                    "El nombre de la carrera no puede estar vacío");

            if (
                    career.getFaculty() != null
                            &&
                            careerRepository
                                    .existsByNameIgnoreCaseAndFacultyIdAndIdNotAndDeletedFalse(
                                            name,
                                            career.getFaculty().getId(),
                                            career.getId())
            ) {

                throw new BadRequestException(
                        "La carrera ya existe en la facultad");
            }

            career.setName(name);
        }

        if (request.getCode() != null) {

            String code = requireText(
                    request.getCode(),
                    "El código de la carrera no puede estar vacío");

            if (careerRepository.existsByCodeIgnoreCaseAndIdNot(
                    code,
                    career.getId())) {

                throw new BadRequestException(
                        "El código de la carrera ya existe");
            }

            career.setCode(code);
        }

        if (request.getDescription() != null) {

            career.setDescription(
                    request.getDescription());
        }

        if (request.getDurationCycles() != null) {

            career.setDurationCycles(
                    request.getDurationCycles());
        }

        if (request.getActive() != null) {

            career.setActive(
                    request.getActive());
        }

        career.setUpdatedAt(
                LocalDateTime.now());

        careerRepository.save(career);

        return mapToResponse(career);
    }

    /*
     * DESACTIVAR
     */
    @Transactional
    public void disable(Long id) {

        Career career = getCareer(id);

        career.setActive(false);

        career.setUpdatedAt(LocalDateTime.now());

        careerRepository.save(career);
    }

    /*
     * ACTIVAR
     */
    @Transactional
    public void enable(Long id) {

        Career career = getCareer(id);

        career.setActive(true);

        career.setUpdatedAt(LocalDateTime.now());

        careerRepository.save(career);
    }

    /*
     * SOFT DELETE
     */
    @Transactional
    public void softDelete(Long id) {

        Career career = getCareer(id);

        career.setDeleted(true);

        career.setDeletedAt(
                LocalDateTime.now());

        career.setUpdatedAt(LocalDateTime.now());

        careerRepository.save(career);
    }

    /*
     * RESTORE
     */
    @Transactional
    public void restore(Long id) {

        Career career = getExistingCareer(id);

        career.setDeleted(false);

        career.setDeletedAt(null);

        career.setUpdatedAt(LocalDateTime.now());

        careerRepository.save(career);
    }

    /*
     * DELETE REAL
     */
    @Transactional
    public void forceDelete(Long id) {

        Career career = getExistingCareer(id);

        careerRepository.delete(career);
    }

    /*
     * GET ENTITY
     */
    private Career getCareer(Long id) {

        return careerRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Carrera no encontrada"));
    }

    private Career getExistingCareer(Long id) {

        return careerRepository
                .findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Carrera no encontrada"));
    }

    /*
     * MAPPER
     */
    private CareerResponse mapToResponse(
            Career career) {

        Faculty faculty = career.getFaculty();

        return CareerResponse.builder()

                .id(career.getId())

                .name(career.getName())

                .code(career.getCode())

                .description(career.getDescription())

                .durationCycles(career.getDurationCycles())

                .facultyId(
                        faculty != null
                                ? faculty.getId()
                                : null)

                .faculty(
                        faculty != null
                                ? faculty.getName()
                                : null)

                .institutionId(
                        faculty != null
                                &&
                                faculty.getInstitution() != null
                                        ? faculty.getInstitution().getId()
                                        : null)

                .institution(
                        faculty != null
                                &&
                                faculty.getInstitution() != null
                                        ? faculty.getInstitution().getName()
                                        : null)

                .active(career.isActive())

                .createdAt(career.getCreatedAt())

                .updatedAt(career.getUpdatedAt())

                .build();
    }

    private String requireText(
            String value,
            String message) {

        if (value == null || value.trim().isEmpty()) {

            throw new BadRequestException(message);
        }

        return value.trim();
    }
}
