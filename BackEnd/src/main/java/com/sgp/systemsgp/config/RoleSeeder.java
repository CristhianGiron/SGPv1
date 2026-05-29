package com.sgp.systemsgp.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.model.Role;
import com.sgp.systemsgp.repository.RoleRepository;

@Configuration
@Profile("!test")
@RequiredArgsConstructor
public class RoleSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {

        for (RoleName roleName : RoleName.values()) {

            roleRepository.findByName(roleName.name())
                    .orElseGet(() -> roleRepository.save(
                            Role.builder()
                                    .name(roleName.name())
                                    .build()));
        }
    }
}
