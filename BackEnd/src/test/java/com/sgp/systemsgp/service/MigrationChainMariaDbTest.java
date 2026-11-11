/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          MigrationChainMariaDbTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Migration Chain Maria Db Test mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import static org.junit.jupiter.api.Assertions.*;

/** Opt-in real SQL check. The runner creates and removes its own MariaDB instance. */
@EnabledIfEnvironmentVariable(named = "SGP_MIGRATION_TEST_URL", matches = "jdbc:mariadb://127\\.0\\.0\\.1:.*")
class MigrationChainMariaDbTest {
    @Test void migrationPreservesExistingPracticesWithoutGrantingAllCycleCourses() throws Exception {
        String url=System.getenv("SGP_MIGRATION_TEST_URL").replace("/sgp_migration_test","/sgp_migration_legacy_test");
        var previous=Flyway.configure().dataSource(url,"root","").locations("classpath:db/migration").target("20").load();
        assertEquals(20,previous.migrate().migrationsExecuted);
        try(var db=java.sql.DriverManager.getConnection(url,"root","");var sql=db.createStatement()){
            sql.executeUpdate("insert into accounts (id,username,password,deleted,enabled,locked,password_change_required) values (901,'legacy-student','test-only',0,1,0,0)");
            sql.executeUpdate("insert into courses (id,name,code,active,deleted,locked) values (901,'Assigned legacy','MEM-LEGACY',1,0,0),(902,'Unassigned legacy','MEM-OTHER',1,0,0)");
            sql.executeUpdate("insert into enrollments (account_id,course_id,status) values (901,901,'APPROVED')");
        }
        var upgraded=Flyway.configure().dataSource(url,"root","").locations("classpath:db/migration").load();
        assertEquals(7,upgraded.migrate().migrationsExecuted);
        try(var db=java.sql.DriverManager.getConnection(url,"root","");var sql=db.createStatement();var rows=sql.executeQuery("select course_id,student_id,active from course_student_memberships")){
            assertTrue(rows.next());assertEquals(901,rows.getLong("course_id"));assertEquals(901,rows.getLong("student_id"));assertTrue(rows.getBoolean("active"));assertFalse(rows.next());
        }
        try(var db=java.sql.DriverManager.getConnection(url,"root","");var sql=db.createStatement()) {
            try(var rows=sql.executeQuery("select e.practice_id,p.course_id from enrollments e join practice_offerings p on p.id=e.practice_id where e.account_id=901")) {
                assertTrue(rows.next());assertEquals(901,rows.getLong("course_id"));assertFalse(rows.next());
            }
            sql.executeUpdate("insert into practice_offerings (id,course_id,name,capacity,enrollment_open,created_at) values (999,901,'Second practice',10,1,CURRENT_TIMESTAMP(6))");
            sql.executeUpdate("insert into enrollments (account_id,course_id,practice_id,status) values (901,901,999,'APPROVED')");
            assertThrows(java.sql.SQLException.class,()->sql.executeUpdate("insert into enrollments (account_id,course_id,practice_id,status) values (901,901,999,'APPROVED')"));
            sql.executeUpdate("insert into academic_cycles (id,name,active,deleted) values (901,'Cycle 1',1,0)");
            sql.executeUpdate("update course_student_memberships set active_cycle_id=901 where student_id=901");
            assertThrows(java.sql.SQLException.class,()->sql.executeUpdate("insert into course_student_memberships (course_id,student_id,active,active_cycle_id,assigned_at) values (902,901,1,901,CURRENT_TIMESTAMP(6))"));
            sql.executeUpdate("update course_student_memberships set active=0,active_cycle_id=null where student_id=901");
            sql.executeUpdate("insert into course_student_memberships (course_id,student_id,active,active_cycle_id,assigned_at) values (902,901,1,901,CURRENT_TIMESTAMP(6))");
        }
        assertEquals(0,upgraded.migrate().migrationsExecuted);
    }

    @Test void migratesAnEmptyDatabaseAndValidatesItsHistory() {
        Flyway flyway = Flyway.configure().dataSource(System.getenv("SGP_MIGRATION_TEST_URL"), "root", "")
                .locations("classpath:db/migration").load();
        assertEquals(27, flyway.migrate().migrationsExecuted);
        assertDoesNotThrow(flyway::validate);
        assertEquals(0, flyway.migrate().migrationsExecuted);
        // Match production's validate-only startup. Keep test profile to disable seeders;
        // command-line properties force this disposable datasource over local settings.
        try (var context = new org.springframework.boot.builder.SpringApplicationBuilder(com.sgp.systemsgp.SystemsgpApplication.class)
                .run("--debug=false", "--spring.profiles.active=prod,test", "--server.address=127.0.0.1", "--server.port=0",
                        "--spring.datasource.url=" + System.getenv("SGP_MIGRATION_TEST_URL").replace("/sgp_migration_test", "/sgp_migration_boot_test"),
                        "--spring.datasource.username=root", "--spring.datasource.password=",
                        "--spring.datasource.driver-class-name=org.mariadb.jdbc.Driver",
                        "--spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MariaDBDialect",
                        "--spring.flyway.enabled=true", "--spring.flyway.baseline-on-migrate=false",
                        "--spring.jpa.hibernate.ddl-auto=validate", "--spring.sql.init.mode=never")) {
            assertTrue(context.isActive());
            assertEquals("27", context.getBean(Flyway.class).info().current().getVersion().toString());
            assertTrue(context.getBean(com.sgp.systemsgp.repository.documentversion.PracticeDocumentVersionRepository.class).summaries(0L).isEmpty());
            assertTrue(context.getBean(com.sgp.systemsgp.repository.practicedeadline.PracticeDeadlineRepository.class).activeIds().isEmpty());
            assertTrue(context.getBean(com.sgp.systemsgp.repository.documentversion.PracticeDocumentVersionRepository.class)
                .findFirstByKindAndDocumentIdAndPdfHashIsNotNullOrderByIdDesc(com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind.L2,0L).isEmpty());
        }
    }
}
