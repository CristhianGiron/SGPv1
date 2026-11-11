/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          RoleSeparationIntegrationTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Role Separation Integration Test mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.enums.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.mock.web.MockMultipartFile;
import java.util.Set;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties="debug=false")
@ActiveProfiles("test")
@Transactional
class RoleSeparationIntegrationTest {
    @Autowired EntityManager em;
    @Autowired WebApplicationContext context;
    MockMvc mvc;
    Institution firstUniversity, secondUniversity;
    Faculty firstFaculty, secondFaculty;
    Career firstCareer, secondCareer;
    AcademicCycle firstCycle, secondCycle;
    Course firstCourse, secondCourse;
    Account director, admin, student, tutor;

    @BeforeEach void fixtures() {
        firstUniversity = save(Institution.builder().name("Primera universidad").code("SC-U1").type(InstitutionType.UNIVERSIDAD).build());
        secondUniversity = save(Institution.builder().name("Segunda universidad").code("SC-U2").type(InstitutionType.UNIVERSIDAD).build());
        firstFaculty = save(Faculty.builder().name("Primera facultad").code("SC-F1").institution(firstUniversity).build());
        secondFaculty = save(Faculty.builder().name("Segunda facultad").code("SC-F2").institution(secondUniversity).build());
        firstCareer = save(Career.builder().name("Primera carrera").code("SC-C1").faculty(firstFaculty).build());
        secondCareer = save(Career.builder().name("Segunda carrera").code("SC-C2").faculty(secondFaculty).build());
        firstCycle = save(AcademicCycle.builder().name("Ciclo primero").career(firstCareer).build());
        secondCycle = save(AcademicCycle.builder().name("Ciclo segundo").career(secondCareer).build());
        director = account("scope.director", RoleName.ROLE_DIRECTOR_PRACTICAS, firstCareer, firstCycle, firstUniversity);
        admin = account("scope.admin", RoleName.ROLE_ADMIN, firstCareer, firstCycle, firstUniversity);
        student = account("scope.student", RoleName.ROLE_ESTUDIANTE, firstCareer, firstCycle, firstUniversity);
        tutor = account("scope.tutor", RoleName.ROLE_TUTOR_PRACTICAS, firstCareer, firstCycle, firstUniversity);
        firstCourse = save(Course.builder().code("SC-P1").name("Paralelo propio").academicCycle(firstCycle).practiceTutor(tutor).capacity(10).build());
        secondCourse = save(Course.builder().code("SC-P2").name("Paralelo ajeno").academicCycle(secondCycle).capacity(10).build());
        save(CourseStudentMembership.builder().course(firstCourse).student(student).active(true).assignedAt(java.time.LocalDateTime.now()).build());
        em.flush();
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }
    @Test void directorReadsOnlyTheirAcademicHierarchyAndCannotMutateIt() throws Exception {
        var who = user(director.getUsername()).roles("DIRECTOR_PRACTICAS");
        mvc.perform(get("/api/faculties").with(who)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(firstFaculty.getId()));
        mvc.perform(get("/api/careers").with(who)).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/academic-cycles").with(who)).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/faculties/" + secondFaculty.getId()).with(who)).andExpect(status().isForbidden());
        mvc.perform(get("/api/careers/" + secondCareer.getId()).with(who)).andExpect(status().isForbidden());
        mvc.perform(patch("/api/careers/" + firstCareer.getId() + "/disable").with(who)).andExpect(status().isForbidden());
        mvc.perform(get("/api/institutions/search?type=UNIVERSIDAD").with(who)).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].id").value(firstUniversity.getId()));
        mvc.perform(patch("/api/institutions/" + firstUniversity.getId() + "/disable").with(who)).andExpect(status().isForbidden());
    }
    @Test void administratorRetainsCrossUniversityManagement() throws Exception {
        mvc.perform(get("/api/careers").with(user(admin.getUsername()).roles("ADMIN"))).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(patch("/api/careers/" + secondCareer.getId() + "/disable").with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isOk());
    }
    @Test void studentAndTutorCannotSearchOtherAcademicScopesByChangingQueryParameters() throws Exception {
        mvc.perform(get("/api/courses/search").with(user(student.getUsername()).roles("ESTUDIANTE")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/courses/search?name=ajeno").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/courses/search").with(user(tutor.getUsername()).roles("TUTOR_PRACTICAS"))).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/faculties").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
    }
    @Test void tutorSelectionDoesNotExposeOtherUniversitiesOrPersonalIdentifiers() throws Exception {
        account("scope.foreign-tutor", RoleName.ROLE_TUTOR_PRACTICAS, secondCareer, secondCycle, secondUniversity); em.flush();
        mvc.perform(get("/api/account/search?role=ROLE_TUTOR_PRACTICAS").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].cedula").doesNotExist())
                .andExpect(jsonPath("$.content[0].institutionalEmail").doesNotExist());
    }
    @Test void publicRegistrationCannotProvisionStaffAccounts() throws Exception {
        long before = em.createQuery("select count(a) from Account a", Long.class).getSingleResult();
        for (String role : new String[]{"ROLE_TUTOR_PRACTICAS", "ROLE_TUTOR_INSTITUCIONAL", "ROLE_ADMIN"}) {
            String json = "{\"username\":\"qa.register\",\"password\":\"QaOnly-123456\",\"names\":\"QA\",\"lastNames\":\"Prueba\",\"cedula\":\"1100000000\",\"institutionalEmail\":\"qa@example.test\",\"role\":\"" + role + "\"}";
            mvc.perform(multipart("/api/auth/register").file(new MockMultipartFile("data", "", "application/json", json.getBytes(java.nio.charset.StandardCharsets.UTF_8))))
                    .andExpect(status().isBadRequest());
        }
        assertThat(em.createQuery("select count(a) from Account a", Long.class).getSingleResult()).isEqualTo(before);
    }
    @Test void administratorCanSearchWithoutOptionalBooleanFilters() throws Exception {
        var who = user(admin.getUsername()).roles("ADMIN");
        mvc.perform(get("/api/account/search").with(who)).andExpect(status().isOk());
        mvc.perform(get("/api/courses/search").with(who)).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/courses/search").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
    }
    @Test void practiceHistoryIsRestrictedToTheOwnerAndAssignedStaff() throws Exception {
        var own = save(Enrollment.builder().account(student).course(firstCourse).status(EnrollmentStatus.APPROVED).build());
        var otherStudent = account("scope.other", RoleName.ROLE_ESTUDIANTE, secondCareer, secondCycle, secondUniversity);
        var foreign = save(Enrollment.builder().account(otherStudent).course(secondCourse).status(EnrollmentStatus.APPROVED).build());
        save(PracticeAuditLog.builder().enrollment(own).actor(admin).action("ARCHIVE_PRACTICE").details("Historial propio").createdAt(java.time.LocalDateTime.of(2026,1,1,10,0)).build());
        save(PracticeAuditLog.builder().enrollment(foreign).actor(admin).action("ARCHIVE_PRACTICE").details("Historial ajeno").createdAt(java.time.LocalDateTime.of(2026,1,1,10,0)).build());
        em.flush();
        mvc.perform(get("/api/enrollments/"+own.getId()+"/history").with(user(student.getUsername()).roles("ESTUDIANTE")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].details").value("Historial propio"));
        mvc.perform(get("/api/enrollments/"+foreign.getId()+"/history").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/enrollments/"+own.getId()+"/history").with(user(tutor.getUsername()).roles("TUTOR_PRACTICAS"))).andExpect(status().isOk());
        mvc.perform(get("/api/enrollments/"+foreign.getId()+"/history").with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/enrollments/"+foreign.getId()+"/history").with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isOk());
        mvc.perform(get("/api/enrollments/"+own.getId()+"/history")).andExpect(status().isUnauthorized());
    }
    private Account account(String name, RoleName roleName, Career career, AcademicCycle cycle, Institution university) {
        Role role = em.createQuery("select r from Role r where r.name = :name", Role.class).setParameter("name", roleName.name()).getResultStream().findFirst().orElseGet(() -> save(Role.builder().name(roleName.name()).build()));
        Person person = save(Person.builder().names(name).cedula(name).institutionalEmail(name+"@example.test").build());
        return save(Account.builder().username(name).password("unused").person(person).career(career).academicCycle(cycle).institution(university).roles(Set.of(role)).build());
    }
    private <T> T save(T entity) { em.persist(entity); return entity; }
}
