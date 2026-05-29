package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Canton;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CantonRepository
                extends JpaRepository<Canton, Long> {

        List<Canton> findByProvince_Id(
                        Long provinceId);

        Optional<Canton> findByCode(String code);

        boolean existsByCode(String code);

}