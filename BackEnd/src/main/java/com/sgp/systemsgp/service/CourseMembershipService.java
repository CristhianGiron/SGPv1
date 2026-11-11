/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseMembershipService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Gestiona la pertenencia académica a paralelos y comprueba la compatibilidad del ciclo.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.CourseStudentMembership;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.CourseStudentMembershipRepository;

import com.sgp.systemsgp.dto.course.CourseStudentResponse;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.*;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class CourseMembershipService {
    private final CourseStudentMembershipRepository memberships;
    private final CourseRepository courses;
    private final AccountRepository accounts;
    private final PracticeAccessService access;

    public List<CourseStudentResponse> roster(String username,Long courseId){
        managedCourse(username,courseId);
        return memberships.findByCourse_IdOrderByIdAsc(courseId).stream().map(m->response(m.getStudent(),m.isActive(),m.getAssignedAt())).toList();
    }
    public Page<CourseStudentResponse> candidates(String username,Long courseId,Pageable pageable){
        var course=managedCourse(username,courseId);var career=access.getCourseCareer(course);
        if(career==null)throw new BadRequestException("El paralelo debe tener una carrera definida");
        return accounts.findRosterCandidates(career.getId(),pageable).map(a->response(a,true,null));
    }
    @Transactional
    public CourseStudentResponse assign(String username,Long courseId,Long studentId){
        var course=managedCourse(username,courseId);
        var student=accounts.findForMembershipUpdate(studentId).orElseThrow(()->new NotFoundException("Estudiante no encontrado"));
        if(!access.hasRole(student,RoleName.ROLE_ESTUDIANTE)||!student.isEnabled()||student.isLocked())
            throw new BadRequestException("Selecciona una cuenta de estudiante habilitada");
        var cycle=access.getCourseAcademicCycle(course);
        if(cycle==null)throw new BadRequestException("El paralelo debe tener un ciclo académico definido");
        boolean conflict=memberships.findByStudent_IdAndActiveTrue(studentId).stream().anyMatch(m ->
            !Objects.equals(m.getCourse().getId(),courseId) && Objects.equals(cycle.getId(),access.getCourseAcademicCycle(m.getCourse())==null?null:access.getCourseAcademicCycle(m.getCourse()).getId()));
        if(conflict)throw new BadRequestException("El estudiante ya pertenece a otro paralelo de este ciclo. Retira primero su pertenencia anterior.");
        var studentCareer=student.getAcademicCycle()!=null?student.getAcademicCycle().getCareer():student.getCareer();
        var courseCareer=access.getCourseCareer(course);
        if(studentCareer==null||courseCareer==null||!Objects.equals(studentCareer.getId(),courseCareer.getId()))
            throw new BadRequestException("El estudiante debe pertenecer a la carrera del paralelo");
        var actor=accounts.findByUsernameAndDeletedFalse(username).orElseThrow(()->new NotFoundException("Cuenta no encontrada"));
        var membership=memberships.findByCourse_IdAndStudent_Id(courseId,studentId).orElseGet(()->CourseStudentMembership.builder().course(course).student(student).build());
        membership.setActiveCycle(cycle);membership.setActive(true);membership.setAssignedBy(actor);membership.setAssignedAt(LocalDateTime.now());membership.setUpdatedAt(LocalDateTime.now());
        memberships.save(membership);
        return response(student,true,membership.getAssignedAt());
    }
    @Transactional
    public void remove(String username,Long courseId,Long studentId){
        managedCourse(username,courseId);
        var membership=memberships.findByCourse_IdAndStudent_Id(courseId,studentId).orElseThrow(()->new NotFoundException("Pertenencia no encontrada"));
        accounts.findForMembershipUpdate(studentId).orElseThrow(()->new NotFoundException("Estudiante no encontrado"));
        membership.setActiveCycle(null);membership.setActive(false);membership.setUpdatedAt(LocalDateTime.now());memberships.save(membership);
    }
    public void requireMembership(Account student,Course course){
        if(!access.hasRole(student,RoleName.ROLE_ESTUDIANTE)
                ||!memberships.existsByCourse_IdAndStudent_IdAndActiveTrue(course.getId(),student.getId()))
            throw new BadRequestException("El estudiante no pertenece al paralelo de esta práctica. Dirección debe revisar su pertenencia académica.");
    }
    private Course managedCourse(String username,Long id){
        var actor=accounts.findByUsernameAndDeletedFalse(username).orElseThrow(()->new NotFoundException("Cuenta no encontrada"));
        var course=courses.findByIdAndDeletedFalse(id).orElseThrow(()->new NotFoundException("Paralelo no encontrado"));
        if(!access.isAdmin(actor)&&!access.isDirectorForCourse(course,actor))throw new AccessDeniedException("Solo administración o dirección de la carrera puede gestionar la pertenencia académica");
        return course;
    }
    private CourseStudentResponse response(Account student,boolean active,LocalDateTime assignedAt){
        var person=student.getPerson();return new CourseStudentResponse(student.getId(),student.getUsername(),person==null?null:person.getNames(),person==null?null:person.getLastNames(),active,assignedAt);
    }
}
