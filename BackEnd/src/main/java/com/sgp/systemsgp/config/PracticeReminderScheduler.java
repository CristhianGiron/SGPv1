/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeReminderScheduler.java
 * @fecha         2026-11-10 22:13:37
 * @nota          Configura los componentes de el módulo Practice Reminder Scheduler en el backend.
 */

package com.sgp.systemsgp.config;
import com.sgp.systemsgp.service.practicedeadline.PracticeDeadlineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.*;
@Configuration @EnableScheduling @RequiredArgsConstructor @Slf4j @Profile("!test")
@ConditionalOnProperty(name="app.practice.reminders-enabled",havingValue="true",matchIfMissing=true)
public class PracticeReminderScheduler {
 private final PracticeDeadlineService service;
 @Scheduled(initialDelayString="${app.practice.reminders-initial-delay-ms:60000}",fixedDelayString="${app.practice.reminders-delay-ms:3600000}")
 public void remind(){for(var id:service.activeIds())try{service.remind(id);}catch(RuntimeException ex){log.error("No se pudo procesar el recordatorio de plazo {}",id,ex);}}
}
