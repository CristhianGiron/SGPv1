/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          InstitutionalDefaultsService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa la lógica de aplicación de las instituciones.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.model.Career;
import com.sgp.systemsgp.model.Faculty;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.repository.CareerRepository;
import com.sgp.systemsgp.repository.FacultyRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;

import com.sgp.systemsgp.config.InstitutionalDefaultsProperties;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.text.Normalizer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstitutionalDefaultsService {
    private final InstitutionalDefaultsProperties properties;
    private final InstitutionRepository institutions;
    private final FacultyRepository faculties;
    private final CareerRepository careers;

    @Transactional
    public void initialize() {
        if (!properties.isSeedEnabled()) return;
        Institution university = findUniversity();
        if (university == null) {
            university = institutions.save(Institution.builder().code(properties.getUniversityCode())
                    .name(properties.getUniversityName()).type(InstitutionType.UNIVERSIDAD).build());
        }
        if (university.getType() != InstitutionType.UNIVERSIDAD) throw new IllegalStateException("El código institucional configurado no corresponde a una universidad");
        if (university.isDeleted() || !university.isActive()) return;
        university.setName(repairDefaultName(university.getName(), properties.getUniversityName()));
        Faculty faculty = findFaculty(university);
        if (faculty == null) {
            if (faculties.existsByCode(properties.getFacultyCode())) throw new IllegalStateException("El código de facultad predeterminado ya pertenece a otro registro");
            faculty = faculties.save(Faculty.builder().name(properties.getFacultyName()).code(properties.getFacultyCode()).institution(university).build());
        }
        if (faculty.isDeleted() || !faculty.isActive()) return;
        faculty.setName(repairDefaultName(faculty.getName(), properties.getFacultyName()));
        Career career = findCareer(faculty);
        if (career == null) {
            if (careers.existsByCodeIgnoreCase(properties.getCareerCode())) throw new IllegalStateException("El código de carrera predeterminado ya pertenece a otro registro");
            careers.save(Career.builder().name(properties.getCareerName()).code(properties.getCareerCode()).faculty(faculty).build());
        } else if (career.isActive() && !career.isDeleted()) {
            career.setName(repairDefaultName(career.getName(), properties.getCareerName()));
        }
    }

    // Only repair exact misdecoded versions of the configured defaults, preserving custom names.
    private String repairDefaultName(String stored, String expected) {
        for (Charset charset : new Charset[]{StandardCharsets.ISO_8859_1, Charset.forName("windows-1252")}) {
            String damaged = expected;
            for (int pass = 0; pass < 2; pass++) {
                damaged = new String(damaged.getBytes(StandardCharsets.UTF_8), charset);
                if (damaged.equals(stored)) return expected;
            }
        }
        return stored;
    }

    public Defaults current() {
        Institution university = findUniversity();
        Faculty faculty = university != null ? findFaculty(university) : null;
        Career career = faculty != null ? findCareer(faculty) : null;
        boolean universityActive = university != null && university.isActive() && !university.isDeleted() && university.getType() == InstitutionType.UNIVERSIDAD;
        boolean facultyActive = universityActive && faculty != null && faculty.isActive() && !faculty.isDeleted();
        boolean careerActive = facultyActive && career != null && career.isActive() && !career.isDeleted();
        return new Defaults(universityActive ? university.getId() : null, properties.getUniversityName(), properties.getUniversityCode(),
                facultyActive ? faculty.getId() : null, properties.getFacultyName(), careerActive ? career.getId() : null, properties.getCareerName());
    }
    private Institution findUniversity() {
        return institutions.findByCode(properties.getUniversityCode()).orElseGet(() -> institutions.findAll().stream()
                .filter(i -> i.getType() == InstitutionType.UNIVERSIDAD && same(i.getName(), properties.getUniversityName())).findFirst().orElse(null));
    }
    private Faculty findFaculty(Institution university) {
        return faculties.findByInstitutionId(university.getId()).stream()
                .filter(f -> same(f.getCode(), properties.getFacultyCode()) || same(f.getName(), properties.getFacultyName())).findFirst().orElse(null);
    }
    private Career findCareer(Faculty faculty) {
        return careers.findByFacultyId(faculty.getId()).stream()
                .filter(c -> same(c.getCode(), properties.getCareerCode()) || same(c.getName(), properties.getCareerName())).findFirst().orElse(null);
    }
    private boolean same(String left, String right) { return normalize(left).equals(normalize(right)); }
    private String normalize(String value) {
        return Normalizer.normalize(Objects.toString(value, ""), Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }
    public record Defaults(Long universityId, String universityName, String universityCode, Long facultyId, String facultyName, Long careerId, String careerName) {}
}
