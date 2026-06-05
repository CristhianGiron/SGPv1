package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.InterfaceImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterfaceImageRepository extends JpaRepository<InterfaceImage, Long> {

    List<InterfaceImage> findByPlacementOrderByDisplayOrderAscCreatedAtDesc(String placement);

    List<InterfaceImage> findByPlacementAndActiveTrueOrderByDisplayOrderAscCreatedAtDesc(String placement);

    Optional<InterfaceImage> findByIdAndActiveTrue(Long id);
}
