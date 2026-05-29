package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.academiccycle.*;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.repository.AcademicCycleRepository;
import com.sgp.systemsgp.repository.CareerRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AcademicCycleService {

    private final AcademicCycleRepository academicCycleRepository;

    private final CareerRepository careerRepository;

    /*
     * CREAR
     */
    public AcademicCycleResponse create(
            CreateAcademicCycleRequest request) {

        Career career = careerRepository
                .findByIdAndDeletedFalse(request.getCareerId())
                .orElseThrow(() -> new NotFoundException(
                        "Carrera no encontrada"));

        boolean exists = academicCycleRepository
                .existsByNameIgnoreCaseAndCareerId(
                        request.getName(),
                        career.getId());

        if (exists) {

            throw new BadRequestException(
                    "El ciclo académico ya existe");
        }

        AcademicCycle academicCycle = AcademicCycle.builder()

                .name(request.getName())

                .orderNumber(request.getLevel())

                .career(career)

                .active(true)

                .deleted(false)

                .createdAt(LocalDateTime.now())

                .build();

        academicCycleRepository.save(academicCycle);

        return mapToResponse(academicCycle);
    }

    /*
     * OBTENER
     */
    public AcademicCycleResponse getById(Long id) {

        return mapToResponse(
                getAcademicCycle(id));
    }

    /*
     * LISTAR
     */
    public List<AcademicCycleResponse> getAll() {

        return academicCycleRepository
                .findByDeletedFalse()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<AcademicCycleResponse> getActiveForRegistration() {

        return academicCycleRepository
                .findByDeletedFalseAndActiveTrue()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /*
     * UPDATE
     */
    public AcademicCycleResponse update(

            Long id,

            UpdateAcademicCycleRequest request) {

        AcademicCycle academicCycle =
                getAcademicCycle(id);

        if (request.getName() != null) {

            academicCycle.setName(
                    request.getName());
        }

        if (request.getLevel() != null) {

            academicCycle.setOrderNumber(
                    request.getLevel());
        }

        if (request.getActive() != null) {

            academicCycle.setActive(
                    request.getActive());
        }

        academicCycle.setUpdatedAt(
                LocalDateTime.now());

        academicCycleRepository.save(academicCycle);

        return mapToResponse(academicCycle);
    }

    /*
     * DESACTIVAR
     */
    public void disable(Long id) {

        AcademicCycle academicCycle =
                getAcademicCycle(id);

        academicCycle.setActive(false);

        academicCycleRepository.save(academicCycle);
    }

    /*
     * ACTIVAR
     */
    public void enable(Long id) {

        AcademicCycle academicCycle =
                getAcademicCycle(id);

        academicCycle.setActive(true);

        academicCycleRepository.save(academicCycle);
    }

    /*
     * SOFT DELETE
     */
    public void softDelete(Long id) {

        AcademicCycle academicCycle =
                getAcademicCycle(id);

        academicCycle.setDeleted(true);

        academicCycle.setDeletedAt(
                LocalDateTime.now());

        academicCycle.setActive(false);

        academicCycleRepository.save(academicCycle);
    }

    /*
     * RESTORE
     */
    public void restore(Long id) {

        AcademicCycle academicCycle =
                getExistingAcademicCycle(id);

        academicCycle.setDeleted(false);

        academicCycle.setDeletedAt(null);

        academicCycle.setActive(true);

        academicCycleRepository.save(academicCycle);
    }

    /*
     * DELETE REAL
     */
    public void forceDelete(Long id) {

        AcademicCycle academicCycle =
                getExistingAcademicCycle(id);

        academicCycleRepository.delete(academicCycle);
    }

    /*
     * ENTITY
     */
    private AcademicCycle getAcademicCycle(Long id) {

        return academicCycleRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Ciclo académico no encontrado"));
    }

    private AcademicCycle getExistingAcademicCycle(Long id) {

        return academicCycleRepository
                .findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Ciclo académico no encontrado"));
    }

    /*
     * MAPPER
     */
    private AcademicCycleResponse mapToResponse(
            AcademicCycle academicCycle) {

        return AcademicCycleResponse.builder()

                .id(academicCycle.getId())

                .name(academicCycle.getName())

                .level(academicCycle.getOrderNumber())

                /*
                 * CARRERA
                 */
                .careerId(
                        academicCycle.getCareer() != null
                                ? academicCycle.getCareer().getId()
                                : null)

                .career(
                        academicCycle.getCareer() != null
                                ? academicCycle.getCareer().getName()
                                : null)

                /*
                 * FACULTAD
                 */
                .facultyId(
                        academicCycle.getCareer() != null
                                &&
                                academicCycle.getCareer().getFaculty() != null
                                        ? academicCycle.getCareer()
                                                .getFaculty()
                                                .getId()
                                        : null)

                .faculty(
                        academicCycle.getCareer() != null
                                &&
                                academicCycle.getCareer().getFaculty() != null
                                        ? academicCycle.getCareer()
                                                .getFaculty()
                                                .getName()
                                        : null)

                /*
                 * INSTITUCIÓN
                 */
                .institutionId(
                        academicCycle.getCareer() != null
                                &&
                                academicCycle.getCareer().getFaculty() != null
                                &&
                                academicCycle.getCareer()
                                        .getFaculty()
                                        .getInstitution() != null
                                                ? academicCycle.getCareer()
                                                        .getFaculty()
                                                        .getInstitution()
                                                        .getId()
                                                : null)

                .institution(
                        academicCycle.getCareer() != null
                                &&
                                academicCycle.getCareer().getFaculty() != null
                                &&
                                academicCycle.getCareer()
                                        .getFaculty()
                                        .getInstitution() != null
                                                ? academicCycle.getCareer()
                                                        .getFaculty()
                                                        .getInstitution()
                                                        .getName()
                                                : null)

                .active(academicCycle.isActive())

                .createdAt(
                        academicCycle.getCreatedAt())

                .updatedAt(
                        academicCycle.getUpdatedAt())

                .build();
    }
}
