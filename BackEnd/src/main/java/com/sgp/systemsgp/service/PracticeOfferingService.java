/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeOfferingService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona las prácticas ofrecidas a un paralelo y su período de inscripción.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.dto.enrollment.CreatePracticeOfferingRequest;
import com.sgp.systemsgp.dto.enrollment.PracticeOfferingResponse;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.CourseStudentMembership;
import com.sgp.systemsgp.model.PracticeOffering;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.CourseStudentMembershipRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.PracticeOfferingRepository;

import com.sgp.systemsgp.dto.enrollment.*;
import com.sgp.systemsgp.dto.course.CourseStudentResponse;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.exception.*;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class PracticeOfferingService {
    private final PracticeOfferingRepository practices;
    private final CourseRepository courses;
    private final AccountRepository accounts;
    private final EnrollmentRepository enrollments;
    private final CourseStudentMembershipRepository memberships;
    private final PracticeAccessService access;

    public Course requireManager(String username, Long courseId) {
        var actor = accounts.findByUsernameAndDeletedFalse(username).orElseThrow(() -> new NotFoundException("Cuenta no encontrada"));
        var course = courses.findByIdAndDeletedFalse(courseId).orElseThrow(() -> new NotFoundException("Paralelo no encontrado"));
        if (!access.isAdmin(actor) && !access.isDirectorForCourse(course, actor) && !access.isPracticeTutorForCourse(course, actor))
            throw new AccessDeniedException("Solo dirección de la carrera, administración o el tutor asignado pueden gestionar esta práctica");
        return course;
    }
    public List<PracticeOfferingResponse> list(String username, Long courseId) {
        requireManager(username, courseId);
        return practices.findByCourse_IdOrderByIdAsc(courseId).stream().map(this::response).toList();
    }
    public List<CourseStudentResponse> roster(String username, Long courseId) {
        requireManager(username, courseId);
        return memberships.findByCourse_IdOrderByIdAsc(courseId).stream().filter(CourseStudentMembership::isActive).map(m -> {
            var s=m.getStudent();var p=s.getPerson();
            return new CourseStudentResponse(s.getId(),s.getUsername(),p==null?null:p.getNames(),p==null?null:p.getLastNames(),true,m.getAssignedAt());
        }).toList();
    }
    @Transactional
    public PracticeOfferingResponse create(String username, Long courseId, CreatePracticeOfferingRequest request) {
        var course=requireManager(username, courseId);
        var actor=accounts.findByUsernameAndDeletedFalse(username).orElseThrow();
        if (!access.isAdmin(actor) && !access.isDirectorForCourse(course,actor))
            throw new AccessDeniedException("Solo administración o dirección de la carrera puede crear prácticas");
        if (!course.isActive()) throw new BadRequestException("El paralelo debe estar activo");
        if (request.startDate()!=null && request.endDate()!=null && request.endDate().isBefore(request.startDate()))
            throw new BadRequestException("La fecha final no puede ser anterior al inicio");
        return response(practices.save(PracticeOffering.builder().course(course).name(request.name().strip()).capacity(request.capacity())
            .startDate(request.startDate()).endDate(request.endDate()).createdBy(actor).createdAt(LocalDateTime.now()).build()));
    }
    @Transactional
    public PracticeOfferingResponse setEnrollmentOpen(String username, Long id, boolean open) {
        var practice=practices.findForUpdate(id).orElseThrow(() -> new NotFoundException("Práctica no encontrada"));
        requireManager(username,practice.getCourse().getId());
        practice.setEnrollmentOpen(open);
        return response(practices.save(practice));
    }
    private PracticeOfferingResponse response(PracticeOffering p) {
        return new PracticeOfferingResponse(p.getId(),p.getCourse().getId(),p.getName(),p.getCapacity(),p.getStartDate(),p.getEndDate(),p.isEnrollmentOpen(),
            enrollments.countByPractice_IdAndStatus(p.getId(), EnrollmentStatus.APPROVED));
    }
}
