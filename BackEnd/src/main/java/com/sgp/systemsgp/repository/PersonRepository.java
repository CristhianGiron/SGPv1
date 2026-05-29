package com.sgp.systemsgp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sgp.systemsgp.model.Person;

public interface PersonRepository extends JpaRepository<Person, Long> {
}