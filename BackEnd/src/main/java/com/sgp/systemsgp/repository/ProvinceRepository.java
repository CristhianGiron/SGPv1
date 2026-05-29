package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Province;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProvinceRepository
        extends JpaRepository<Province, Long> {

        Optional<Province> findByCode(String code);
        
        boolean existsByCode(String code);
}