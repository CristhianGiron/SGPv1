package com.sgp.systemsgp.service;

import java.util.List;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sgp.systemsgp.dto.subject.CreateSubjectRequest;
import com.sgp.systemsgp.dto.subject.SubjectResponse;
import com.sgp.systemsgp.dto.subject.UpdateSubjectRequest;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Grade;
import com.sgp.systemsgp.model.Subject;
import com.sgp.systemsgp.repository.AcademicCycleRepository;
import com.sgp.systemsgp.repository.GradeRepository;
import com.sgp.systemsgp.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SubjectService {

    private final SubjectRepository subjectRepository;

    private final AcademicCycleRepository academicCycleRepository;

    private final GradeRepository gradeRepository;

    /*
     * CREAR
     */
    public SubjectResponse create(
            CreateSubjectRequest request) {

        if (
                request.getCode() != null

                        &&

                        subjectRepository.existsByCode(
                                request.getCode())
        ) {

            throw new BadRequestException(
                    "El código de la asignatura ya existe");
        }

        /*
         * VALIDAR RELACIÓN
         */
        if (
                request.getAcademicCycleId() == null

                        &&

                        request.getGradeId() == null
        ) {

            throw new BadRequestException(
                    "Debe seleccionar un ciclo académico o un grado");
        }

        if (
                request.getAcademicCycleId() != null

                        &&

                        request.getGradeId() != null
        ) {

            throw new BadRequestException(
                    "La asignatura no puede pertenecer a ambos");
        }

        AcademicCycle academicCycle = null;

        Grade grade = null;

        /*
         * UNIVERSIDAD
         */
        if (request.getAcademicCycleId() != null) {

            academicCycle = academicCycleRepository

                    .findByIdAndDeletedFalse(request.getAcademicCycleId())

                    .orElseThrow(() -> new NotFoundException(
                            "Ciclo académico no encontrado"));
        }

        /*
         * ESCUELA / COLEGIO
         */
        if (request.getGradeId() != null) {

            grade = gradeRepository

                    .findByIdAndDeletedFalse(request.getGradeId())

                    .orElseThrow(() -> new NotFoundException(
                            "Grado no encontrado"));
        }

        Subject subject = Subject.builder()

                .name(request.getName())

                .code(request.getCode())

                .description(request.getDescription())

                .credits(request.getCredits())

                .hours(request.getHours())

                .academicCycle(academicCycle)

                .grade(grade)

                .active(
                        request.getActive() != null
                                ? request.getActive()
                                : true)

                .build();

        subjectRepository.save(subject);

        return mapToResponse(subject);
    }

    /*
     * LISTAR
     */
    public List<SubjectResponse> getAll() {

        return subjectRepository.findByDeletedFalse()

                .stream()

                .map(this::mapToResponse)

                .toList();
    }

    /*
     * OBTENER
     */
    public SubjectResponse getById(Long id) {

        return mapToResponse(getEntity(id));
    }

    /*
     * UPDATE
     */
    public SubjectResponse update(

            Long id,

            UpdateSubjectRequest request) {

        Subject subject = getEntity(id);

        if (request.getName() != null) {
            subject.setName(request.getName());
        }

        if (request.getCode() != null) {
            subject.setCode(request.getCode());
        }

        if (request.getDescription() != null) {
            subject.setDescription(request.getDescription());
        }

        if (request.getCredits() != null) {
            subject.setCredits(request.getCredits());
        }

        if (request.getHours() != null) {
            subject.setHours(request.getHours());
        }

        if (request.getActive() != null) {
            subject.setActive(request.getActive());
        }

        /*
         * CICLO ACADÉMICO
         */
        if (request.getAcademicCycleId() != null) {

            AcademicCycle academicCycle =
                            academicCycleRepository

                            .findByIdAndDeletedFalse(
                                    request.getAcademicCycleId())

                            .orElseThrow(() -> new NotFoundException(
                                    "Ciclo académico no encontrado"));

            subject.setAcademicCycle(academicCycle);

            subject.setGrade(null);
        }

        /*
         * GRADO
         */
        if (request.getGradeId() != null) {

            Grade grade = gradeRepository

                    .findByIdAndDeletedFalse(request.getGradeId())

                    .orElseThrow(() -> new NotFoundException(
                            "Grado no encontrado"));

            subject.setGrade(grade);

            subject.setAcademicCycle(null);
        }

        subjectRepository.save(subject);

        return mapToResponse(subject);
    }

    /*
     * ELIMINAR
     */
    public void delete(Long id) {

        Subject subject = getEntity(id);

        subject.setDeleted(true);

        subject.setDeletedAt(LocalDateTime.now());

        subject.setActive(false);

        subjectRepository.save(subject);
    }

    /*
     * ENTITY
     */
    private Subject getEntity(Long id) {

        return subjectRepository

                .findByIdAndDeletedFalse(id)

                .orElseThrow(() -> new NotFoundException(
                        "Asignatura no encontrada"));
    }

    /*
     * MAPPER
     */
    private SubjectResponse mapToResponse(
            Subject subject) {

        return SubjectResponse.builder()

                .id(subject.getId())

                .name(subject.getName())

                .code(subject.getCode())

                .description(subject.getDescription())

                .credits(subject.getCredits())

                .hours(subject.getHours())

                /*
                 * UNIVERSIDAD
                 */
                .academicCycleId(
                        subject.getAcademicCycle() != null
                                ? subject.getAcademicCycle().getId()
                                : null)

                .academicCycle(
                        subject.getAcademicCycle() != null
                                ? subject.getAcademicCycle().getName()
                                : null)

                .careerId(
                        subject.getAcademicCycle() != null

                                &&

                                subject.getAcademicCycle().getCareer() != null

                                        ? subject.getAcademicCycle()
                                                .getCareer()
                                                .getId()

                                        : null)

                .career(
                        subject.getAcademicCycle() != null

                                &&

                                subject.getAcademicCycle().getCareer() != null

                                        ? subject.getAcademicCycle()
                                                .getCareer()
                                                .getName()

                                        : null)

                .facultyId(
                        subject.getAcademicCycle() != null

                                &&

                                subject.getAcademicCycle().getCareer() != null

                                &&

                                subject.getAcademicCycle()
                                        .getCareer()
                                        .getFaculty() != null

                                                ? subject.getAcademicCycle()
                                                        .getCareer()
                                                        .getFaculty()
                                                        .getId()

                                                : null)

                .faculty(
                        subject.getAcademicCycle() != null

                                &&

                                subject.getAcademicCycle().getCareer() != null

                                &&

                                subject.getAcademicCycle()
                                        .getCareer()
                                        .getFaculty() != null

                                                ? subject.getAcademicCycle()
                                                        .getCareer()
                                                        .getFaculty()
                                                        .getName()

                                                : null)

                /*
                 * ESCUELA / COLEGIO
                 */
                .gradeId(
                        subject.getGrade() != null
                                ? subject.getGrade().getId()
                                : null)

                .grade(
                        subject.getGrade() != null
                                ? subject.getGrade().getName()
                                : null)

                .institutionId(
                        subject.getGrade() != null

                                &&

                                subject.getGrade()
                                        .getInstitution() != null

                                                ? subject.getGrade()
                                                        .getInstitution()
                                                        .getId()

                                                : null)

                .institution(
                        subject.getGrade() != null

                                &&

                                subject.getGrade()
                                        .getInstitution() != null

                                                ? subject.getGrade()
                                                        .getInstitution()
                                                        .getName()

                                                : null)

                .active(subject.isActive())

                .createdAt(subject.getCreatedAt())

                .updatedAt(subject.getUpdatedAt())

                .build();
    }
}
