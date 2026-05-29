package com.sgp.systemsgp.repository;

import com.sgp.systemsgp.model.Account;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AccountRepository
                extends JpaRepository<Account, Long> {

        @Query("""
                            SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
                            FROM Account a
                            JOIN a.roles r
                            WHERE r.name = :roleName
                        """)
        boolean existsByRoleName(@Param("roleName") String roleName);

        boolean existsByUsername(String username);

        boolean existsByPersonInstitutionalEmail(String institutionalEmail);

        Optional<Account> findByUsername(
                        String username);

        Optional<Account> findByUsernameAndDeletedFalse(
                        String username);

        Optional<Account> findByUsernameIgnoreCaseAndDeletedFalse(
                        String username);

        Optional<Account> findByPersonInstitutionalEmailIgnoreCaseAndDeletedFalse(
                        String institutionalEmail);

        Optional<Account> findByIdAndDeletedFalse(
                        Long id);

        Page<Account> findByDeletedFalse(
                        Pageable pageable);

        List<Account> findByDeletedFalseAndEnabledTrueAndLockedFalse();

        List<Account> findByInstitution_IdAndRoles_NameAndDeletedFalseAndEnabledTrueAndLockedFalse(
                        Long institutionId,
                        String roleName);

        @Query("""
                            SELECT DISTINCT a
                            FROM Account a
                            JOIN a.roles r
                            WHERE a.deleted = false
                              AND a.enabled = true
                              AND a.locked = false
                              AND r.name IN :roles
                        """)
        List<Account> findActiveAnnouncementRecipientsByRoleNames(
                        @Param("roles") Collection<String> roles);

        @Query("""
                            SELECT DISTINCT a
                            FROM Account a
                            LEFT JOIN a.roles r
                            LEFT JOIN a.person p
                            WHERE

                                (:username IS NULL OR
                                 LOWER(a.username)
                                 LIKE LOWER(CONCAT('%', :username, '%')))

                            AND

                                (:email IS NULL OR
                                 LOWER(p.institutionalEmail)
                                 LIKE LOWER(CONCAT('%', :email, '%')))

                            AND

                                (:names IS NULL OR
                                 LOWER(p.names)
                                 LIKE LOWER(CONCAT('%', :names, '%')))

                            AND

                                (:lastNames IS NULL OR
                                 LOWER(p.lastNames)
                                 LIKE LOWER(CONCAT('%', :lastNames, '%')))

                            AND

                                (:cedula IS NULL OR
                                 p.cedula LIKE CONCAT('%', :cedula, '%'))

                            AND

                                (:role IS NULL OR
                                 r.name = :role)

                            AND

                                (:enabled IS NULL OR
                                 a.enabled = :enabled)

                            AND

                                a.deleted = false
                        """)
        Page<Account> search(

                        String username,

                        String email,

                        String names,

                        String lastNames,

                        String cedula,

                        String role,

                        Boolean enabled,

                        Pageable pageable);

}
