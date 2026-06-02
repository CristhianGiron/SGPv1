package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.gradeparallel.CreateGradeParallelRequest;
import com.sgp.systemsgp.dto.gradeparallel.GradeParallelResponse;
import com.sgp.systemsgp.dto.gradeparallel.UpdateGradeParallelRequest;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Grade;
import com.sgp.systemsgp.model.GradeParallel;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.repository.GradeParallelRepository;
import com.sgp.systemsgp.repository.GradeRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GradeParallelService {

    private final GradeParallelRepository gradeParallelRepository;
    private final GradeRepository gradeRepository;

    public GradeParallelResponse create(CreateGradeParallelRequest request) {

        Grade grade = getGrade(request.getGradeId());
        String letter = normalizeLetter(request.getLetter());
        validateLetterAvailable(grade.getId(), letter);

        GradeParallel parallel = GradeParallel.builder()
                .letter(letter)
                .name(buildName(grade, letter))
                .grade(grade)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        gradeParallelRepository.save(parallel);

        return mapToResponse(parallel);
    }

    public List<GradeParallelResponse> getAll() {

        return gradeParallelRepository.findByDeletedFalse()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public GradeParallelResponse getById(Long id) {

        return mapToResponse(getEntity(id));
    }

    public GradeParallelResponse update(
            Long id,
            UpdateGradeParallelRequest request) {

        GradeParallel parallel = getEntity(id);

        if (request.getGradeId() != null) {
            parallel.setGrade(getGrade(request.getGradeId()));
        }

        if (request.getLetter() != null) {
            String letter = normalizeLetter(request.getLetter());

            if (!letter.equalsIgnoreCase(parallel.getLetter())) {
                validateLetterAvailable(parallel.getGrade().getId(), letter);
            }

            parallel.setLetter(letter);
        }

        parallel.setName(buildName(parallel.getGrade(), parallel.getLetter()));

        if (request.getActive() != null) {
            parallel.setActive(request.getActive());
        }

        gradeParallelRepository.save(parallel);

        return mapToResponse(parallel);
    }

    public void delete(Long id) {

        GradeParallel parallel = getEntity(id);
        parallel.setDeleted(true);
        parallel.setDeletedAt(LocalDateTime.now());
        parallel.setActive(false);
        gradeParallelRepository.save(parallel);
    }

    private GradeParallel getEntity(Long id) {

        return gradeParallelRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Paralelo no encontrado"));
    }

    private Grade getGrade(Long id) {

        return gradeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Grado no encontrado"));
    }

    private void validateLetterAvailable(
            Long gradeId,
            String letter) {

        if (gradeParallelRepository.existsByGrade_IdAndLetterIgnoreCaseAndDeletedFalse(
                gradeId,
                letter)) {
            throw new BadRequestException(
                    "Ya existe un paralelo con esa letra en el grado seleccionado");
        }
    }

    private String normalizeLetter(String letter) {

        return letter == null ? null : letter.trim().toUpperCase();
    }

    private String buildName(
            Grade grade,
            String letter) {

        return grade.getName() + " " + letter;
    }

    private GradeParallelResponse mapToResponse(GradeParallel parallel) {

        Grade grade = parallel.getGrade();
        Institution institution = grade != null ? grade.getInstitution() : null;

        return GradeParallelResponse.builder()
                .id(parallel.getId())
                .letter(parallel.getLetter())
                .name(parallel.getName())
                .gradeId(grade != null ? grade.getId() : null)
                .grade(grade != null ? grade.getName() : null)
                .institutionId(institution != null ? institution.getId() : null)
                .institution(institution != null ? institution.getName() : null)
                .active(parallel.isActive())
                .createdAt(parallel.getCreatedAt())
                .updatedAt(parallel.getUpdatedAt())
                .build();
    }
}
