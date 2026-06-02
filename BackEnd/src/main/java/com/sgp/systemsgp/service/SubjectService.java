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
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Grade;
import com.sgp.systemsgp.model.GradeParallel;
import com.sgp.systemsgp.model.Subject;
import com.sgp.systemsgp.repository.AcademicCycleRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.GradeParallelRepository;
import com.sgp.systemsgp.repository.GradeRepository;
import com.sgp.systemsgp.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SubjectService {

    private final SubjectRepository subjectRepository;

    private final AcademicCycleRepository academicCycleRepository;

    private final CourseRepository courseRepository;

    private final GradeRepository gradeRepository;

    private final GradeParallelRepository gradeParallelRepository;

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
                        request.getCourseId() == null

                        &&

                        request.getGradeId() == null
                        &&
                        request.getGradeParallelId() == null
        ) {

            throw new BadRequestException(
                    "Debe seleccionar un ciclo académico o un grado");
        }

        if (
                (request.getAcademicCycleId() != null || request.getCourseId() != null)

                        &&

                        (request.getGradeId() != null || request.getGradeParallelId() != null)
        ) {

            throw new BadRequestException(
                    "La asignatura no puede pertenecer a ambos");
        }

        AcademicCycle academicCycle = null;
        Course course = null;

        Grade grade = null;
        GradeParallel gradeParallel = null;

        /*
         * UNIVERSIDAD
         */
        if (request.getCourseId() != null) {

            course = courseRepository

                    .findByIdAndDeletedFalse(request.getCourseId())

                    .orElseThrow(() -> new NotFoundException(
                            "Paralelo no encontrado"));

            academicCycle = resolveCourseAcademicCycle(course);
        } else if (request.getAcademicCycleId() != null) {

            academicCycle = academicCycleRepository

                    .findByIdAndDeletedFalse(request.getAcademicCycleId())

                    .orElseThrow(() -> new NotFoundException(
                            "Ciclo académico no encontrado"));
        }

        /*
         * ESCUELA / COLEGIO
         */
        if (request.getGradeParallelId() != null) {

            gradeParallel = gradeParallelRepository

                    .findByIdAndDeletedFalse(request.getGradeParallelId())

                    .orElseThrow(() -> new NotFoundException(
                            "Paralelo no encontrado"));

            grade = gradeParallel.getGrade();
        } else if (request.getGradeId() != null) {

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

                .course(course)

                .grade(grade)

                .gradeParallel(gradeParallel)

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

            subject.setCourse(null);

            subject.setGrade(null);
        }

        if (request.getCourseId() != null) {

            Course course = courseRepository

                    .findByIdAndDeletedFalse(request.getCourseId())

                    .orElseThrow(() -> new NotFoundException(
                            "Paralelo no encontrado"));

            subject.setCourse(course);

            subject.setAcademicCycle(resolveCourseAcademicCycle(course));

            subject.setGrade(null);

            subject.setGradeParallel(null);
        }

        /*
         * GRADO
         */
        if (request.getGradeParallelId() != null) {

            GradeParallel parallel = gradeParallelRepository

                    .findByIdAndDeletedFalse(request.getGradeParallelId())

                    .orElseThrow(() -> new NotFoundException(
                            "Paralelo no encontrado"));

            subject.setGradeParallel(parallel);

            subject.setGrade(parallel.getGrade());

            subject.setAcademicCycle(null);
            subject.setCourse(null);
        }

        if (request.getGradeId() != null) {

            Grade grade = gradeRepository

                    .findByIdAndDeletedFalse(request.getGradeId())

                    .orElseThrow(() -> new NotFoundException(
                            "Grado no encontrado"));

            subject.setGrade(grade);

            subject.setGradeParallel(null);

            subject.setAcademicCycle(null);
            subject.setCourse(null);
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

        Grade grade = resolveGrade(subject);
        GradeParallel gradeParallel = subject.getGradeParallel();
        Course course = subject.getCourse();
        AcademicCycle academicCycle = course != null
                ? resolveCourseAcademicCycle(course)
                : subject.getAcademicCycle();

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
                        academicCycle != null
                                ? academicCycle.getId()
                                : null)

                .academicCycle(
                        academicCycle != null
                                ? academicCycle.getName()
                                : null)

                .courseId(
                        course != null
                                ? course.getId()
                                : null)

                .course(
                        course != null
                                ? course.getName()
                                : null)

                .careerId(
                        academicCycle != null

                                &&

                                academicCycle.getCareer() != null

                                        ? academicCycle
                                                .getCareer()
                                                .getId()

                                        : null)

                .career(
                        academicCycle != null

                                &&

                                academicCycle.getCareer() != null

                                        ? academicCycle
                                                .getCareer()
                                                .getName()

                                        : null)

                .facultyId(
                        academicCycle != null

                                &&

                                academicCycle.getCareer() != null

                                &&

                                academicCycle
                                        .getCareer()
                                        .getFaculty() != null

                                                ? academicCycle
                                                        .getCareer()
                                                        .getFaculty()
                                                        .getId()

                                                : null)

                .faculty(
                        academicCycle != null

                                &&

                                academicCycle.getCareer() != null

                                &&

                                academicCycle
                                        .getCareer()
                                        .getFaculty() != null

                                                ? academicCycle
                                                        .getCareer()
                                                        .getFaculty()
                                                        .getName()

                                                : null)

                /*
                 * ESCUELA / COLEGIO
                 */
                .gradeId(
                        grade != null
                                ? grade.getId()
                                : null)

                .grade(
                        grade != null
                                ? grade.getName()
                                : null)

                .gradeParallelId(
                        gradeParallel != null
                                ? gradeParallel.getId()
                                : null)

                .gradeParallel(
                        gradeParallel != null
                                ? gradeParallel.getName()
                                : null)

                .institutionId(
                        grade != null

                                &&

                                grade
                                        .getInstitution() != null

                                                ? grade
                                                        .getInstitution()
                                                        .getId()

                                                : null)

                .institution(
                        grade != null

                                &&

                                grade
                                        .getInstitution() != null

                                                ? grade
                                                        .getInstitution()
                                                        .getName()

                                                : null)

                .active(subject.isActive())

                .createdAt(subject.getCreatedAt())

                .updatedAt(subject.getUpdatedAt())

                .build();
    }

    private Grade resolveGrade(Subject subject) {

        if (subject.getGradeParallel() != null) {
            return subject.getGradeParallel().getGrade();
        }

        return subject.getGrade();
    }

    private AcademicCycle resolveCourseAcademicCycle(Course course) {

        if (course == null) {
            return null;
        }

        if (course.getAcademicCycle() != null) {
            return course.getAcademicCycle();
        }

        return course.getSubject() != null
                ? course.getSubject().getAcademicCycle()
                : null;
    }
}
