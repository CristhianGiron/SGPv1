package com.sgp.systemsgp.specification;

import com.sgp.systemsgp.model.Institution;

import org.springframework.data.jpa.domain.Specification;

public class InstitutionSpecification {

    public static Specification<Institution> search(

            String name,

            String code,

            String type,

            String support,

            Boolean active,

            Boolean agreementActive,

            Boolean acceptsInterns
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
             * CODE
             */
            if (code != null && !code.isBlank()) {

                predicate = cb.and(
                        predicate,
                        cb.like(
                                cb.lower(root.get("code")),
                                "%" + code.toLowerCase() + "%"
                        )
                );
            }

            /*
             * TYPE
             */
            if (type != null && !type.isBlank()) {

                predicate = cb.and(
                        predicate,
                        cb.equal(
                                root.get("type"),
                                Enum.valueOf(
                                        com.sgp.systemsgp.enums.InstitutionType.class,
                                        type.toUpperCase()
                                )
                        )
                );
            }

            /*
             * SUPPORT
             */
            if (support != null && !support.isBlank()) {

                predicate = cb.and(
                        predicate,
                        cb.equal(
                                root.get("support"),
                                Enum.valueOf(
                                        com.sgp.systemsgp.enums.InstitutionSupport.class,
                                        support.toUpperCase()
                                )
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
             * AGREEMENT
             */
            if (agreementActive != null) {

                predicate = cb.and(
                        predicate,
                        cb.equal(
                                root.get("agreementActive"),
                                agreementActive
                        )
                );
            }

            /*
             * INTERNS
             */
            if (acceptsInterns != null) {

                predicate = cb.and(
                        predicate,
                        cb.equal(
                                root.get("acceptsInterns"),
                                acceptsInterns
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