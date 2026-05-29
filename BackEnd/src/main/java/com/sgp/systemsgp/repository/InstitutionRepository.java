package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.enums.InstitutionType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface InstitutionRepository
        extends JpaRepository<Institution, Long>,
        JpaSpecificationExecutor<Institution> {

    boolean existsByCode(String code);

    Optional<Institution> findByCode(String code);

    Page<Institution> findByDeletedFalse(Pageable pageable);

    Page<Institution> findByDeletedFalseAndActiveTrue(Pageable pageable);

    Page<Institution> findByDeletedFalseAndActiveTrueAndType(InstitutionType type, Pageable pageable);

    Page<Institution> findByDeletedFalseAndActiveTrueAndTypeAndAgreementActiveTrueAndAcceptsInternsTrue(
            InstitutionType type,
            Pageable pageable);

    Optional<Institution> findByIdAndDeletedFalse(Long id);

}
