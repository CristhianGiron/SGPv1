/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeAttendanceConcurrencyTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de la asistencia a prácticas mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.practiceschedule.*;
import com.sgp.systemsgp.enums.*;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.model.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.assertThat;

/** Uses its own in-memory database because competing transactions must commit. */
@SpringBootTest(properties={"debug=false", "spring.datasource.url=jdbc:h2:mem:sgp_attendance_concurrency;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"})
@ActiveProfiles("test")
@DirtiesContext(classMode=DirtiesContext.ClassMode.AFTER_CLASS)
class PracticeAttendanceConcurrencyTest {
    @Autowired EntityManager em;
    @Autowired PlatformTransactionManager transactions;
    @Autowired PracticeScheduleService schedules;

    @Test void concurrentIdenticalAttendanceRequestsCommitOnlyOnce() throws Exception {
        var tx = new TransactionTemplate(transactions);
        long scheduleId = Objects.requireNonNull(tx.execute(status -> {
            var role = save(Role.builder().name(RoleName.ROLE_TUTOR_INSTITUCIONAL.name()).build());
            var school = save(Institution.builder().name("Concurrency school").code("CC-S").type(InstitutionType.ESCUELA).build());
            var student = save(Account.builder().username("concurrent.student").password("test-only").person(save(Person.builder().names("Student").build())).build());
            var tutor = save(Account.builder().username("concurrent.tutor").password("test-only").person(save(Person.builder().names("Tutor").build())).roles(Set.of(role)).institution(school).build());
            var course = save(Course.builder().name("Concurrency course").code("CC-P").institutionalTutor(tutor).capacity(10).build());
            var enrollment = save(Enrollment.builder().account(student).course(course).status(EnrollmentStatus.APPROVED).build());
            var period = new PracticeSchedulePeriodRequest();
            period.setDayOfWeek(DayOfWeek.MONDAY); period.setStartTime(LocalTime.of(8,0)); period.setEndTime(LocalTime.of(10,0));
            var request = new CreatePracticeScheduleRequest();request.setEnrollmentId(enrollment.getId());request.setPeriods(List.of(period));
            return schedules.create(tutor.getUsername(),request).getId();
        }));

        var pool = Executors.newFixedThreadPool(2);
        var ready = new CountDownLatch(2);
        var start = new CountDownLatch(1);
        Callable<Integer> attempt = () -> {
            ready.countDown();
            if (!start.await(10,TimeUnit.SECONDS)) throw new IllegalStateException("Concurrent requests did not start");
            try {
                new TransactionTemplate(transactions).executeWithoutResult(status -> {
                    var request = new PracticeAttendanceRequest();request.setAttendanceDate(LocalDate.of(2026,11,2));
                    request.setStartTime(LocalTime.of(8,0));request.setEndTime(LocalTime.of(10,0));request.setStatus(PracticeAttendanceStatus.PRESENT);
                    schedules.registerAttendance(scheduleId,"concurrent.tutor",request);
                });
                return 200;
            } catch (BadRequestException expected) { return 400; }
        };
        try {
            var first = pool.submit(attempt); var second = pool.submit(attempt);
            assertThat(ready.await(10,TimeUnit.SECONDS)).isTrue();start.countDown();
            assertThat(List.of(first.get(20,TimeUnit.SECONDS),second.get(20,TimeUnit.SECONDS))).containsExactlyInAnyOrder(200,400);
            tx.executeWithoutResult(status -> {
                var rows = schedules.getById(scheduleId,"concurrent.tutor").getAttendances();
                assertThat(rows).hasSize(1);assertThat(rows.get(0).getTotalMinutes()).isEqualTo(120);
            });
        } finally {
            start.countDown();pool.shutdownNow();pool.awaitTermination(10,TimeUnit.SECONDS);
        }
    }
    private <T>T save(T value){em.persist(value);return value;}
}
