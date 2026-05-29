package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Canton;
import com.sgp.systemsgp.model.Parish;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParishRepository
                extends JpaRepository<Parish, Long> {

        List<Parish> findByCanton_Id(
                        Long cantonId);

        Optional<Parish> findByCode(String code);

        boolean existsByCode(String code);

}