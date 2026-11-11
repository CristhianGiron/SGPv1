/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          InstitutionCatalogAccess.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente InstitutionCatalogAccess del backend del SGP.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.repository.InstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InstitutionCatalogAccess {
    private final AcademicCatalogAccess academicAccess;
    private final InstitutionRepository institutions;
    private boolean school(InstitutionType type) { return type == InstitutionType.ESCUELA || type == InstitutionType.COLEGIO; }
    public boolean canCreate(String username, InstitutionType type) { return academicAccess.scope(username).admin() || school(type); }
    public boolean canManage(String username, Long id) { return canManage(username, id, null); }
    public boolean canManage(String username, Long id, InstitutionType requestedType) {
        if (academicAccess.scope(username).admin()) return true;
        return institutions.findById(id).map(i -> school(i.getType()) && (requestedType == null || school(requestedType))).orElse(false);
    }
    public boolean canRead(String username, Long id) {
        var scope = academicAccess.scope(username);
        return scope.admin() || institutions.findById(id).map(i -> school(i.getType()) || i.getType() == InstitutionType.UNIVERSIDAD && scope.university(id)).orElse(false);
    }
}
