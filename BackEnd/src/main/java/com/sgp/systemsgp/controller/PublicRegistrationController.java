package com.sgp.systemsgp.controller;

import com.sgp.systemsgp.dto.academiccycle.AcademicCycleResponse;
import com.sgp.systemsgp.dto.course.CourseResponse;
import com.sgp.systemsgp.dto.grade.GradeResponse;
import com.sgp.systemsgp.dto.gradeparallel.GradeParallelResponse;
import com.sgp.systemsgp.dto.institution.InstitutionResponse;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Faculty;
import com.sgp.systemsgp.model.Grade;
import com.sgp.systemsgp.model.GradeParallel;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.GradeParallelRepository;
import com.sgp.systemsgp.repository.GradeRepository;
import com.sgp.systemsgp.service.AcademicCycleService;
import com.sgp.systemsgp.service.InstitutionService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PublicRegistrationController {

    private final AcademicCycleService academicCycleService;

    private final InstitutionService institutionService;

    private final CourseRepository courseRepository;

    private final GradeRepository gradeRepository;

    private final GradeParallelRepository gradeParallelRepository;

    @GetMapping("/academic-cycles")
    public List<AcademicCycleResponse> academicCycles() {

        return academicCycleService.getActiveForRegistration();
    }

    @GetMapping("/institutions")
    public Page<InstitutionResponse> institutions(
            @RequestParam(required = false) String type,
            @PageableDefault(size = 100) Pageable pageable) {

        return institutionService.getActiveForRegistration(
                type,
                pageable);
    }

    @GetMapping("/courses")
    public List<CourseResponse> courses(
            @RequestParam(required = false) Long academicCycleId) {

        List<Course> courses = academicCycleId != null
                ? courseRepository.findByAcademicCycle_IdAndDeletedFalse(academicCycleId)
                : courseRepository.findByDeletedFalse();

        return courses.stream()
                .filter(course -> course.isActive()
                        && !course.isLocked()
                        && course.getPracticeTutor() == null)
                .map(this::mapCourse)
                .toList();
    }

    @GetMapping("/grades")
    public List<GradeResponse> grades(
            @RequestParam(required = false) Long institutionId) {

        List<Grade> grades = institutionId != null
                ? gradeRepository.findByInstitutionId(institutionId)
                : gradeRepository.findByDeletedFalse();

        return grades.stream()
                .filter(grade -> !grade.isDeleted() && grade.isActive())
                .map(this::mapGrade)
                .toList();
    }

    @GetMapping("/grade-parallels")
    public List<GradeParallelResponse> gradeParallels(
            @RequestParam(required = false) Long gradeId) {

        List<GradeParallel> parallels = gradeId != null
                ? gradeParallelRepository.findByGrade_IdAndDeletedFalse(gradeId)
                : gradeParallelRepository.findByDeletedFalse();

        return parallels.stream()
                .filter(parallel -> parallel.isActive()
                        && parallel.getGrade() != null
                        && parallel.getGrade().isActive()
                        && !parallel.getGrade().isDeleted())
                .map(this::mapGradeParallel)
                .toList();
    }

    private CourseResponse mapCourse(Course course) {

        AcademicCycle academicCycle = course.getAcademicCycle();
        Career career = academicCycle != null ? academicCycle.getCareer() : null;
        Faculty faculty = career != null ? career.getFaculty() : null;

        return CourseResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .code(course.getCode())
                .capacity(course.getCapacity())
                .startDate(course.getStartDate())
                .endDate(course.getEndDate())
                .active(course.isActive())
                .locked(course.isLocked())
                .academicCycleId(academicCycle != null ? academicCycle.getId() : null)
                .academicCycle(academicCycle != null ? academicCycle.getName() : null)
                .careerId(career != null ? career.getId() : null)
                .career(career != null ? career.getName() : null)
                .facultyId(faculty != null ? faculty.getId() : null)
                .faculty(faculty != null ? faculty.getName() : null)
                .build();
    }

    private GradeResponse mapGrade(Grade grade) {

        Institution institution = grade.getInstitution();

        return GradeResponse.builder()
                .id(grade.getId())
                .name(grade.getName())
                .code(grade.getCode())
                .level(grade.getLevel())
                .institutionId(institution != null ? institution.getId() : null)
                .institution(institution != null ? institution.getName() : null)
                .active(grade.isActive())
                .createdAt(grade.getCreatedAt())
                .updatedAt(grade.getUpdatedAt())
                .build();
    }

    private GradeParallelResponse mapGradeParallel(GradeParallel parallel) {

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
