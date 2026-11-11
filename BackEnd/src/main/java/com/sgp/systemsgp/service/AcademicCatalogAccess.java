/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AcademicCatalogAccess.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente AcademicCatalogAccess del backend del SGP.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AcademicCatalogAccess {
    private final AccountRepository accounts;
    private final PracticeAccessService practiceAccess;

    public Scope scope(String username) {
        Account account = accounts.findByUsernameAndDeletedFalse(username).orElseThrow(() -> new NotFoundException("Cuenta no encontrada"));
        boolean admin = practiceAccess.isAdmin(account);
        if (!admin && !practiceAccess.hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)) throw new AccessDeniedException("No puedes consultar la estructura académica");
        Career career = account.getCareer();
        Faculty faculty = career != null ? career.getFaculty() : null;
        Institution university = faculty != null ? faculty.getInstitution() : null;
        return new Scope(admin, career != null ? career.getId() : null, faculty != null ? faculty.getId() : null, university != null ? university.getId() : null);
    }
    public record Scope(boolean admin, Long careerId, Long facultyId, Long universityId) {
        public boolean career(Long id) { return admin || id != null && Objects.equals(id, careerId); }
        public boolean faculty(Long id) { return admin || id != null && Objects.equals(id, facultyId); }
        public boolean university(Long id) { return admin || id != null && Objects.equals(id, universityId); }
        public void require(boolean allowed) { if (!allowed) throw new AccessDeniedException("Este registro no pertenece a tu ámbito académico"); }
    }
}
