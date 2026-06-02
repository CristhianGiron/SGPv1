package com.sgp.systemsgp.specification;

import com.sgp.systemsgp.model.Course;

import jakarta.persistence.criteria.JoinType;

import org.springframework.data.jpa.domain.Specification;

public class CourseSpecification {

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
                                cb.equal(legacyCareer.get("id"), careerId)
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
