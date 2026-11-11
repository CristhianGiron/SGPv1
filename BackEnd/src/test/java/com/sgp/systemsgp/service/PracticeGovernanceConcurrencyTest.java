/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeGovernanceConcurrencyTest.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Comprueba el comportamiento de el módulo Practice Governance Concurrency Test mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.documentversion.PracticeDocumentKind;
import com.sgp.systemsgp.enums.practicedeadline.PracticeDeadlineStage;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.practicedeadline.PracticeDeadline;
import com.sgp.systemsgp.service.documentversion.PracticeDocumentVersionService;
import com.sgp.systemsgp.service.practicedeadline.PracticeDeadlineService;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.enums.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.assertThat;
@SpringBootTest(properties={"debug=false","spring.datasource.url=jdbc:h2:mem:sgp_governance_concurrency;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"})
@ActiveProfiles("test") @DirtiesContext(classMode=DirtiesContext.ClassMode.AFTER_CLASS)
class PracticeGovernanceConcurrencyTest {
 @Autowired EntityManager em;
 @Autowired PlatformTransactionManager transactions;
 @Autowired PracticeDocumentVersionService versions;
 @Autowired PracticeDeadlineService deadlines;
 @Test void concurrentReminderWorkersNotifyOnceAndVersionsHaveDistinctSequenceNumbers()throws Exception{
  var tx=new TransactionTemplate(transactions);
  var ids=Objects.requireNonNull(tx.execute(status->{
   var student=save(Account.builder().username("governance.concurrent.student").password("test-only").person(save(Person.builder().names("Ana").build())).build());
   var course=save(Course.builder().name("Parallel concurrency").code("GC-P").capacity(10).build());
   var enrollment=save(Enrollment.builder().account(student).course(course).status(EnrollmentStatus.APPROVED).build());
   var deadline=save(PracticeDeadline.builder().enrollment(enrollment).kind(PracticeDocumentKind.L2).stage(PracticeDeadlineStage.SUBMISSION).dueAt(LocalDateTime.now(ZoneId.of("America/Guayaquil")).minusHours(1)).reminderHours(48).reason("Plazo de prueba").updatedBy(student).updatedAt(LocalDateTime.now()).revision(1).build());
   return new long[]{enrollment.getId(),deadline.getId()};
  }));
  var results=parallel(()->new TransactionTemplate(transactions).execute(status->deadlines.remind(ids[1])));
  assertThat(results).containsExactlyInAnyOrder(0,1);
  parallel(()->{new TransactionTemplate(transactions).executeWithoutResult(status->{var enrollment=em.find(Enrollment.class,ids[0]);versions.record(PracticeDocumentKind.L2,77L,enrollment,"governance.concurrent.student","SUBMITTED",Map.of("status","SUBMITTED"),null);});return 1;});
  tx.executeWithoutResult(status->{var rows=versions.list(ids[0],"governance.concurrent.student");assertThat(rows).hasSize(2);assertThat(rows.stream().map(r->r.revisionNumber()).toList()).containsExactlyInAnyOrder(1,2);});
 }
 private List<Integer> parallel(Callable<Integer> action)throws Exception{
  var pool=Executors.newFixedThreadPool(2);var ready=new CountDownLatch(2);var start=new CountDownLatch(1);
  Callable<Integer> call=()->{ready.countDown();if(!start.await(10,TimeUnit.SECONDS))throw new IllegalStateException("No arranca la prueba concurrente");return action.call();};
  try{var first=pool.submit(call);var second=pool.submit(call);assertThat(ready.await(10,TimeUnit.SECONDS)).isTrue();start.countDown();return List.of(first.get(30,TimeUnit.SECONDS),second.get(30,TimeUnit.SECONDS));}
  finally{start.countDown();pool.shutdownNow();pool.awaitTermination(10,TimeUnit.SECONDS);}
 }
 private <T>T save(T value){em.persist(value);return value;}
}
