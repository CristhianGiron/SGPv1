package com.sgp.systemsgp.service;

import java.util.List;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sgp.systemsgp.dto.grade.CreateGradeRequest;
import com.sgp.systemsgp.dto.grade.GradeResponse;
import com.sgp.systemsgp.dto.grade.UpdateGradeRequest;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Grade;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.repository.GradeRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class GradeService {

    private final GradeRepository gradeRepository;

    private final InstitutionRepository institutionRepository;

    /*
     * CREAR
     */
    public GradeResponse create(
            CreateGradeRequest request) {

        if (
                request.getCode() != null

                        &&

                        gradeRepository.existsByCode(
                                request.getCode())
        ) {

            throw new BadRequestException(
                    "El código del grado ya existe");
        }

        Institution institution = institutionRepository

                .findByIdAndDeletedFalse(request.getInstitutionId())

                .orElseThrow(() -> new NotFoundException(
                        "Institución no encontrada"));

        validateInstitutionCanHaveGrades(institution);

        Grade grade = Grade.builder()

                .name(request.getName())

                .code(request.getCode())

                .level(request.getLevel())

                .institution(institution)

                .active(
                        request.getActive() != null
                                ? request.getActive()
                                : true)

                .build();

        gradeRepository.save(grade);

        return mapToResponse(grade);
    }

    /*
     * LISTAR
     */
    public List<GradeResponse> getAll() {

        return gradeRepository.findByDeletedFalse()

                .stream()

                .map(this::mapToResponse)

                .toList();
    }

    /*
     * OBTENER
     */
    public GradeResponse getById(Long id) {

        return mapToResponse(getEntity(id));
    }

    /*
     * ACTUALIZAR
     */
    public GradeResponse update(

            Long id,

            UpdateGradeRequest request) {

        Grade grade = getEntity(id);

        if (request.getName() != null) {
            grade.setName(request.getName());
        }

        if (request.getCode() != null) {
            grade.setCode(request.getCode());
        }

        if (request.getLevel() != null) {
            grade.setLevel(request.getLevel());
        }

        if (request.getActive() != null) {
            grade.setActive(request.getActive());
        }

        if (request.getInstitutionId() != null) {

            Institution institution = institutionRepository

                    .findByIdAndDeletedFalse(request.getInstitutionId())

                    .orElseThrow(() -> new NotFoundException(
                            "Institución no encontrada"));

            validateInstitutionCanHaveGrades(institution);

            grade.setInstitution(institution);
        }

        gradeRepository.save(grade);

        return mapToResponse(grade);
    }

    /*
     * ELIMINAR
     */
    public void delete(Long id) {

        Grade grade = getEntity(id);

        grade.setDeleted(true);

        grade.setDeletedAt(LocalDateTime.now());

        grade.setActive(false);

        gradeRepository.save(grade);
    }

    /*
     * ENTITY
     */
    private Grade getEntity(Long id) {

        return gradeRepository

                .findByIdAndDeletedFalse(id)

                .orElseThrow(() -> new NotFoundException(
                        "Grado no encontrado"));
    }

    private void validateInstitutionCanHaveGrades(
            Institution institution) {

        if (
                institution.getType() != InstitutionType.ESCUELA
                        &&
                        institution.getType() != InstitutionType.COLEGIO
        ) {

            throw new BadRequestException(
                    "Solo escuelas y colegios pueden tener grados");
        }
    }

    /*
     * MAPPER
     */
    private GradeResponse mapToResponse(
            Grade grade) {

        return GradeResponse.builder()

                .id(grade.getId())

                .name(grade.getName())

                .code(grade.getCode())

                .level(grade.getLevel())

                .institutionId(
                        grade.getInstitution() != null
                                ? grade.getInstitution().getId()
                                : null)

                .institution(
                        grade.getInstitution() != null
                                ? grade.getInstitution().getName()
                                : null)

                .active(grade.isActive())

                .createdAt(grade.getCreatedAt())

                .updatedAt(grade.getUpdatedAt())

                .build();
    }
}
