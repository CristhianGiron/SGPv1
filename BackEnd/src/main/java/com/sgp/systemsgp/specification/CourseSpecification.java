/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseSpecification.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Define los criterios de filtrado de los paralelos académicos.
 */

package com.sgp.systemsgp.specification;

import com.sgp.systemsgp.model.Course;

import jakarta.persistence.criteria.JoinType;

import org.springframework.data.jpa.domain.Specification;

public class CourseSpecification {

    public static Specification<Course> visibleTo(com.sgp.systemsgp.model.Account account) {
        return (root, query, cb) -> {
            var roles = account.getRoles().stream().map(com.sgp.systemsgp.model.Role::getName).toList();
            if (roles.contains("ROLE_ADMIN") || roles.contains("ROLE_DIRECTOR_PRACTICAS")) return cb.conjunction();
            if (roles.contains("ROLE_TUTOR_PRACTICAS")) return cb.equal(root.get("practiceTutor").get("id"), account.getId());
            if (roles.contains("ROLE_ESTUDIANTE")) {
                var memberships = query.subquery(Long.class);
                var member = memberships.from(com.sgp.systemsgp.model.CourseStudentMembership.class);
                memberships.select(member.get("id")).where(
                        cb.equal(member.get("course").get("id"),root.get("id")),
                        cb.equal(member.get("student").get("id"),account.getId()),cb.isTrue(member.get("active")));
                return cb.and(cb.isTrue(root.get("active")),cb.isFalse(root.get("locked")),cb.exists(memberships));
            }
            return cb.disjunction();
        };
    }

    public static Specification<Course> search(

            String name,

            Boolean active,

            Boolean locked,

            String institutionalTutor,

            String practiceTutor,

            Long careerId
    ) {

        return (root, query, cb) -> {

            var predicate = cb.conjunction();

            /*
             * NOMBRE
             */
            if (name != null && !name.isBlank()) {

                predicate = cb.and(
                        predicate,

                        cb.like(
                                cb.lower(root.get("name")),
                                "%" + name.toLowerCase() + "%"
                        )
                );
            }

            /*
             * ACTIVE
             */
            if (active != null) {

                predicate = cb.and(
                        predicate,

                        cb.equal(
                                root.get("active"),
                                active
                        )
                );
            }

            /*
             * LOCKED
             */
            if (locked != null) {

                predicate = cb.and(
                        predicate,

                        cb.equal(
                                root.get("locked"),
                                locked
                        )
                );
            }

            /*
             * TUTOR INSTITUCIONAL
             */
            if (institutionalTutor != null
                    && !institutionalTutor.isBlank()) {

                predicate = cb.and(
                        predicate,

                        cb.like(
                                cb.lower(
                                        root.get("institutionalTutor")
                                                .get("username")
                                ),
                                "%" + institutionalTutor.toLowerCase() + "%"
                        )
                );
            }

            /*
             * TUTOR PRÁCTICAS
             */
            if (practiceTutor != null
                    && !practiceTutor.isBlank()) {

                predicate = cb.and(
                        predicate,

                        cb.like(
                                cb.lower(
                                        root.get("practiceTutor")
                                                .get("username")
                                ),
                                "%" + practiceTutor.toLowerCase() + "%"
                        )
                );
            }

            if (careerId != null) {

                var academicCycle = root.join("academicCycle", JoinType.LEFT);
                var career = academicCycle.join("career", JoinType.LEFT);
                var subject = root.join("subject", JoinType.LEFT);
                var legacyAcademicCycle = subject.join("academicCycle", JoinType.LEFT);
                var legacyCareer = legacyAcademicCycle.join("career", JoinType.LEFT);

                predicate = cb.and(
                        predicate,
                        cb.or(
                                cb.equal(career.get("id"), careerId),
                                cb.and(cb.isNull(root.get("academicCycle")), cb.equal(legacyCareer.get("id"), careerId))
                        )
                );
            }

            /*
             * NO ELIMINADOS
             */
            predicate = cb.and(
                    predicate,

                    cb.equal(
                            root.get("deleted"),
                            false
                    )
            );

            return predicate;
        };
    }
}
