/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AuthSession.java
 * @fecha         2026-11-10 21:24:04
 * @nota          Representa los datos persistentes de la autenticación de usuarios.
 */

package com.sgp.systemsgp.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="auth_sessions") @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthSession {
 @Id @Column(length=36) private String id;
 @ManyToOne(optional=false) @JoinColumn(name="account_id",nullable=false) private Account account;
 @Column(nullable=false,length=64) private String refreshHash;
 @Column(nullable=false) private Instant createdAt;
 @Column(nullable=false) private Instant expiresAt;
 private Instant revokedAt;
}
