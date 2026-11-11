/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          InstitutionalDefaultsServiceTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las instituciones mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.config.InstitutionalDefaultsProperties;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties="debug=false")
@ActiveProfiles("test")
@Transactional
class InstitutionalDefaultsServiceTest {
    @Autowired InstitutionRepository institutions;
    @Autowired FacultyRepository faculties;
    @Autowired CareerRepository careers;
    @Autowired AccountRepository accounts;
    @Autowired InstitutionalDefaultsProperties boundProperties;
    @Autowired org.springframework.web.context.WebApplicationContext context;
    @Autowired jakarta.persistence.EntityManager entityManager;
    InstitutionalDefaultsProperties properties;
    InstitutionalDefaultsService service;
    @BeforeEach void setup() {
        properties = new InstitutionalDefaultsProperties();
        service = new InstitutionalDefaultsService(properties, institutions, faculties, careers);
    }
    @Test void initializesTheDefaultHierarchyOnceWithoutCreatingUsers() {
        long count = accounts.count();
        service.initialize();
        var first = service.current();
        service.initialize();
        assertThat(service.current()).isEqualTo(first);
        assertThat(first.universityName()).isEqualTo("Universidad Nacional de Loja");
        assertThat(first.facultyId()).isNotNull(); assertThat(first.careerId()).isNotNull();
        var career = careers.findById(first.careerId()).orElseThrow();
        assertThat(career.getFaculty().getInstitution().getId()).isEqualTo(first.universityId());
        assertThat(accounts.count()).isEqualTo(count);
    }
    @Test void reusesAnExistingHierarchyDespiteDifferentCodesAndPunctuation() {
        Institution university = institutions.save(Institution.builder().name(properties.getUniversityName()).code("LEGACY-U").type(InstitutionType.UNIVERSIDAD).build());
        Faculty faculty = faculties.save(Faculty.builder().name("Facultad de la Educacion el Arte y la Comunicacion").code("LEGACY-F").institution(university).build());
        Career career = careers.save(Career.builder().name("Pedagogia de las Ciencias Experimentales Informatica").code("LEGACY-C").faculty(faculty).build());
        service.initialize();
        assertThat(service.current().careerId()).isEqualTo(career.getId());
        assertThat(institutions.findByCode("UNL")).isEmpty();
        assertThat(career.getCode()).isEqualTo("LEGACY-C");
    }
    @Test void doesNotReactivateAnInstitutionOrCreateChildrenUnderIt() {
        institutions.save(Institution.builder().name(properties.getUniversityName()).code("UNL").type(InstitutionType.UNIVERSIDAD).active(false).build());
        long before = faculties.count(); service.initialize();
        assertThat(faculties.count()).isEqualTo(before);
        assertThat(service.current().universityId()).isNull();
    }
    @Test void additionalUniversitiesCoexistWithTheDefaultAndCanBecomeTheConfiguredContext() {
        service.initialize(); Long original = service.current().universityId();
        properties.setUniversityCode("QA-OTHER-U"); properties.setUniversityName("Universidad de ejemplo");
        properties.setFacultyCode("QA-OTHER-F"); properties.setFacultyName("Facultad de ejemplo");
        properties.setCareerCode("QA-OTHER-C"); properties.setCareerName("Carrera de ejemplo");
        service.initialize();
        assertThat(service.current().universityId()).isNotEqualTo(original);
        assertThat(institutions.findById(original)).isPresent();
    }
    @Test void seedingCanBeDisabled() {
        properties.setSeedEnabled(false); long before = institutions.count(); service.initialize();
        assertThat(institutions.count()).isEqualTo(before);
    }

    @Test void applicationPropertiesBindSpanishNamesWithoutMojibake() {
        assertThat(boundProperties.getFacultyName()).isEqualTo("Facultad de la Educación, el Arte y la Comunicación");
        assertThat(boundProperties.getCareerName()).isEqualTo("Pedagogía de las Ciencias Experimentales - Informática");
    }

    @Test void publicEndpointReturnsCorrectNamesFromActualApplicationConfiguration() throws Exception {
        var mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup(context)
                .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity()).build();
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/public/institutional-defaults"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.facultyName").value(properties.getFacultyName()))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.careerName").value(properties.getCareerName()));
    }

    @Test void repairsPreviouslySeededNamesAndKeepsExistingIdsAndCustomNames() {
        service.initialize();
        var ids = service.current();
        var faculty = faculties.findById(ids.facultyId()).orElseThrow();
        var career = careers.findById(ids.careerId()).orElseThrow();
        faculty.setName(misdecoded(properties.getFacultyName()));
        career.setName(misdecoded(misdecoded(properties.getCareerName())));
        entityManager.flush(); entityManager.clear();
        service.initialize();
        entityManager.flush(); entityManager.clear();
        assertThat(faculties.findById(ids.facultyId()).orElseThrow().getName()).isEqualTo(properties.getFacultyName());
        assertThat(careers.findById(ids.careerId()).orElseThrow().getName()).isEqualTo(properties.getCareerName());
        assertThat(service.current()).isEqualTo(ids);
        faculties.findById(ids.facultyId()).orElseThrow().setName("Facultad de Diseño e Innovación");
        careers.findById(ids.careerId()).orElseThrow().setName("Diseño e Informática Aplicada");
        service.initialize();
        entityManager.flush(); entityManager.clear();
        assertThat(faculties.findById(ids.facultyId()).orElseThrow().getName()).isEqualTo("Facultad de Diseño e Innovación");
        assertThat(careers.findById(ids.careerId()).orElseThrow().getName()).isEqualTo("Diseño e Informática Aplicada");
    }

    private String misdecoded(String value) {
        return new String(value.getBytes(java.nio.charset.StandardCharsets.UTF_8), java.nio.charset.StandardCharsets.ISO_8859_1);
    }
}
