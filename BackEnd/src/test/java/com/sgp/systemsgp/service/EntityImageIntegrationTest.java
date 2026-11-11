/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EntityImageIntegrationTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las imágenes de las entidades mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.model.AcademicCycle;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Canton;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.EntityImage;
import com.sgp.systemsgp.model.Faculty;
import com.sgp.systemsgp.model.FinalReport;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Parish;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.Province;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.EntityImageRepository;

import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.http.MediaType;
import java.util.Set;
import java.io.ByteArrayOutputStream;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties="debug=false") @ActiveProfiles("test") @Transactional
class EntityImageIntegrationTest {
    @Autowired EntityManager em;
    @Autowired WebApplicationContext context;
    @Autowired EntityImageRepository images;
    @Autowired CourseRepository courses;
    @Autowired EntityImageService service;
    MockMvc mvc;
    AcademicCycle cycle, foreignCycle;
    Account admin, student, foreignStudent;
    @BeforeEach void setup() {
        var university = save(Institution.builder().code("IMG-UNI").name("Universidad de prueba").type(InstitutionType.UNIVERSIDAD).build());
        var faculty = save(Faculty.builder().code("IMG-FAC").name("Facultad de prueba").institution(university).build());
        var career = save(Career.builder().code("IMG-CAR").name("Carrera de prueba").faculty(faculty).build());
        var foreignCareer = save(Career.builder().code("IMG-FOREIGN").name("Otra carrera").faculty(faculty).build());
        cycle = save(AcademicCycle.builder().name("Ciclo de imágenes").career(career).build());
        foreignCycle = save(AcademicCycle.builder().name("Otro ciclo").career(foreignCareer).build());
        admin = account("image.admin", "ROLE_ADMIN", cycle);
        student = account("image.student", "ROLE_ESTUDIANTE", cycle);
        foreignStudent = account("image.foreign", "ROLE_ESTUDIANTE", foreignCycle);
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }
    @Test void createWithCoverPersistsAndOnlyAuthorizedViewersCanRead() throws Exception {
        Course course = create();
        assertThat(course.getCoverImage()).isNotNull();
        mvc.perform(get("/api/courses/"+course.getId()+"/cover").with(user(student.getUsername()).roles("ESTUDIANTE")))
                .andExpect(status().isOk()).andExpect(content().contentType("image/png")).andExpect(header().string("X-Content-Type-Options", "nosniff"));
        mvc.perform(get("/api/courses/"+course.getId()+"/cover").with(user(foreignStudent.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
        mvc.perform(get("/api/courses/"+course.getId()+"/cover")).andExpect(status().isUnauthorized());
    }
    @Test void studentsCannotUploadOrReplaceCovers() throws Exception {
        var course = create();
        mvc.perform(multipart("/api/courses").file(data()).file(png()).with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
        mvc.perform(multipart("/api/courses/"+course.getId()+"/cover").file(png()).with(r -> { r.setMethod("PUT");return r; }).with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
    }
    @Test void foreignDirectorCannotReplaceAnotherCareerCover() throws Exception {
        var course = create();
        var director = account("image.director", "ROLE_DIRECTOR_PRACTICAS", foreignCycle);
        director.setCareer(foreignCycle.getCareer());em.flush();
        mvc.perform(multipart("/api/courses/"+course.getId()+"/cover").file(png()).with(r -> { r.setMethod("PUT");return r; }).with(user(director.getUsername()).roles("DIRECTOR_PRACTICAS"))).andExpect(status().isForbidden());
    }
    @Test void invalidImageDoesNotCreateAnIncompleteCourse() throws Exception {
        long before = courses.count(), media = images.count();
        mvc.perform(multipart("/api/courses").file(data()).file(new MockMultipartFile("image", "fake.png", "image/png", "not an image".getBytes())).with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isBadRequest());
        assertThat(courses.count()).isEqualTo(before);assertThat(images.count()).isEqualTo(media);
    }
    @Test void emptyOversizedAndUnsupportedImagesAreRejected() throws Exception {
        for (var file : new MockMultipartFile[]{new MockMultipartFile("image", "empty.png", "image/png", new byte[0]), new MockMultipartFile("image", "large.png", "image/png", new byte[4*1024*1024+1]), new MockMultipartFile("image", "script.svg", "image/svg+xml", "<svg/>".getBytes())}) {
            mvc.perform(multipart("/api/courses").file(data()).file(file).with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isBadRequest());
        }
        assertThat(images.count()).isZero();
    }
    @Test void replacementChangesVersionAndRemovalRestoresDefaultState() throws Exception {
        var course = create();Long previous = course.getCoverImage().getId();
        mvc.perform(multipart("/api/courses/"+course.getId()+"/cover").file(png()).with(r -> { r.setMethod("PUT");return r; }).with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isOk());
        assertThat(course.getCoverImage().getId()).isNotEqualTo(previous);assertThat(images.existsById(previous)).isFalse();
        mvc.perform(delete("/api/courses/"+course.getId()+"/cover").with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isOk());
        assertThat(course.getCoverImage()).isNull();assertThat(images.count()).isZero();
        mvc.perform(get("/api/courses/"+course.getId()+"/cover").with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isNotFound());
    }
    @Test void jsonCreationWithoutImageIsStillSupported() throws Exception {
        mvc.perform(post("/api/courses").contentType(MediaType.APPLICATION_JSON).content(json()).with(user(admin.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.coverImageUrl").doesNotExist());
        assertThat(images.count()).isZero();
    }
    @Test void declaredFormatMustMatchActualImageBytes() throws Exception {
        mvc.perform(multipart("/api/courses").file(data()).file(new MockMultipartFile("image", "wrong.jpg", "image/jpeg", png().getBytes())).with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isBadRequest());
        assertThat(images.count()).isZero();
    }
    @Test void institutionLogoIsCreatedAtomicallyAndOnlyManagersCanRemoveIt() throws Exception {
        var province = save(Province.builder().code("IMG-P").name("Provincia imágenes").build());
        var canton = save(Canton.builder().code("IMG-C").name("Cantón imágenes").province(province).build());
        var parish = save(Parish.builder().code("IMG-R").name("Parroquia imágenes").canton(canton).build());
        String json = "{\"name\":\"Universidad con logo\",\"code\":\"IMG-LOGO\",\"type\":\"UNIVERSIDAD\",\"support\":\"PUBLICO\",\"provinceId\":"+province.getId()+",\"cantonId\":"+canton.getId()+",\"parishId\":"+parish.getId()+"}";
        mvc.perform(multipart("/api/institutions").file(new MockMultipartFile("data", "", "application/json", json.getBytes(java.nio.charset.StandardCharsets.UTF_8))).file(png()).with(user(admin.getUsername()).roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.logoImageUrl").isString());
        var institution = em.createQuery("select i from Institution i where i.code='IMG-LOGO'", Institution.class).getSingleResult();
        mvc.perform(get("/api/institutions/"+institution.getId()+"/logo").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isOk()).andExpect(content().contentType("image/png"));
        mvc.perform(delete("/api/institutions/"+institution.getId()+"/logo").with(user(student.getUsername()).roles("ESTUDIANTE"))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/institutions/"+institution.getId()+"/logo").with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isOk());
        assertThat(institution.getLogoImage()).isNull();
    }
    @Test void finalReportLetterheadPersistsReplacesAndRespectsDocumentAccess() throws Exception {
        var school = save(Institution.builder().code("L3-SCHOOL").name("Escuela de prueba").type(InstitutionType.ESCUELA).build());
        var tutor = account("letterhead.tutor", "ROLE_TUTOR_INSTITUCIONAL", cycle);
        tutor.setInstitution(school);
        var practiceTutor = account("letterhead.practice", "ROLE_TUTOR_PRACTICAS", cycle);
        var course = save(Course.builder().code("L3-COURSE").name("Curso L3").academicCycle(cycle)
                .institutionalTutor(tutor).practiceTutor(practiceTutor).build());
        var enrollment = save(Enrollment.builder().account(student).course(course)
                .status(com.sgp.systemsgp.enums.EnrollmentStatus.APPROVED).build());
        var report = save(FinalReport.builder().student(student).course(course).enrollment(enrollment)
                .educationalInstitution(school).studentFullName("Estudiante L3").educationalInstitutionName(school.getName())
                .status(com.sgp.systemsgp.enums.FinalReportStatus.SUBMITTED).build());
        em.flush();
        Long id = report.getId();
        String path = "/api/final-reports/" + id;
        var body = new MockMultipartFile("data", "", "application/json",
                "{\"completedHours\":46,\"completedMinutes\":55,\"reportDate\":\"2026-11-04\",\"conclusion1\":\"Conclusión de prueba\"}".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        mvc.perform(multipart(path + "/institutional-section").file(body).file(png())
                .with(r -> { r.setMethod("PATCH"); return r; }).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.completedHours").value(46))
                .andExpect(jsonPath("$.completedMinutes").value(55)).andExpect(jsonPath("$.letterheadImageUrl").value(path + "/letterhead"));
        em.flush(); em.clear();
        var persisted = em.find(FinalReport.class, id);
        assertThat(persisted.getLetterheadImage().getData()).isNotEmpty();
        Long oldImage = persisted.getLetterheadImage().getId();
        mvc.perform(get(path + "/letterhead").with(user(student.getUsername()).roles("ESTUDIANTE")))
                .andExpect(status().isOk()).andExpect(content().contentType("image/png"))
                .andExpect(header().string("Cache-Control", "no-store"));
        mvc.perform(get(path + "/letterhead").with(user(foreignStudent.getUsername()).roles("ESTUDIANTE")))
                .andExpect(status().isForbidden());
        mvc.perform(multipart(path + "/institutional-section").file(body).file(png())
                .with(r -> { r.setMethod("PATCH"); return r; }).with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL")))
                .andExpect(status().isOk());
        em.flush(); em.clear();
        assertThat(em.find(EntityImage.class, oldImage)).isNull();
        var replaced = em.find(FinalReport.class, id);
        assertThat(replaced.getLetterheadImage()).isNotNull();
        replaced.setLetterheadImage(null);
        replaced.setStatus(com.sgp.systemsgp.enums.FinalReportStatus.APPROVED);
        replaced.setInstitutionalTutorApproved(true);
        em.flush();
        mvc.perform(multipart(path + "/letterhead").file(png()).with(r -> { r.setMethod("PUT"); return r; })
                .with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.institutionalTutorApproved").value(true));
        mvc.perform(multipart(path + "/letterhead").file(png()).with(r -> { r.setMethod("PUT"); return r; })
                .with(user(tutor.getUsername()).roles("TUTOR_INSTITUCIONAL"))).andExpect(status().isBadRequest());
    }
    private Course create() throws Exception {
        mvc.perform(multipart("/api/courses").file(data()).file(png()).with(user(admin.getUsername()).roles("ADMIN"))).andExpect(status().isOk()).andExpect(jsonPath("$.coverImageUrl").isString());
        return courses.findByDeletedFalse().stream().filter(c -> c.getName().equals("Práctica con portada")).findFirst().orElseThrow();
    }
    private String json() { return "{\"name\":\"Práctica con portada\",\"description\":\"Práctica de prueba\",\"capacity\":10,\"academicCycleId\":"+cycle.getId()+"}"; }
    private MockMultipartFile data() { return new MockMultipartFile("data", "", "application/json", json().getBytes(java.nio.charset.StandardCharsets.UTF_8)); }
    private MockMultipartFile png() throws Exception { var out = new ByteArrayOutputStream();ImageIO.write(new BufferedImage(8, 4, BufferedImage.TYPE_INT_RGB), "png", out);return new MockMultipartFile("image", "cover.png", "image/png", out.toByteArray()); }
    private Account account(String username, String roleName, AcademicCycle academicCycle) {
        var role = em.createQuery("select r from Role r where r.name=:name", Role.class).setParameter("name", roleName).getResultStream().findFirst().orElseGet(() -> save(Role.builder().name(roleName).build()));
        var person = save(Person.builder().names(username).cedula(username).build());
        return save(Account.builder().username(username).password("unused").person(person).academicCycle(academicCycle).roles(Set.of(role)).build());
    }
    private <T> T save(T entity) { em.persist(entity);return entity; }
}
