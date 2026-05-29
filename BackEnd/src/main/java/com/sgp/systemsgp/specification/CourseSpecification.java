package com.sgp.systemsgp.specification;

import com.sgp.systemsgp.model.Course;

import org.springframework.data.jpa.domain.Specification;

public class CourseSpecification {

    public static Specification<Course> search(

            String name,

            Boolean active,

            Boolean locked,

            String institutionalTutor,

            String practiceTutor
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
