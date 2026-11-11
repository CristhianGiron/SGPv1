/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AuthSessionRepository.java
 * @fecha         2026-11-10 21:24:04
 * @nota          Define las consultas de persistencia para la autenticación de usuarios.
 */

package com.sgp.systemsgp.repository;
import com.sgp.systemsgp.model.AuthSession;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface AuthSessionRepository extends JpaRepository<AuthSession,String> {
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select s from AuthSession s where s.id=:id")
 Optional<AuthSession> findForUpdate(@Param("id") String id);
 List<AuthSession> findByAccount_IdAndRevokedAtIsNull(Long id);
}
