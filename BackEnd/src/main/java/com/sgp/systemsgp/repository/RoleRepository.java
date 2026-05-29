package com.sgp.systemsgp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sgp.systemsgp.model.Role;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(String name);
}