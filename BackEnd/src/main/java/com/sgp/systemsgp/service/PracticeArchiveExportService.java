/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeArchiveExportService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Reúne los documentos y evidencias autorizados de una práctica para exportar su expediente ZIP.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.repository.*;
import com.sgp.systemsgp.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.zip.*;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class PracticeArchiveExportService {
    private final EnrollmentRepository enrollments;
    private final AccountRepository accounts;
    private final PracticeAccessService access;
    private final PracticeReportRepository reports;
    private final ActivityPlanRepository plans;
    private final FinalReportRepository finals;
    private final ActivityEvaluationRepository evaluations;
    private final PracticeFollowUpReportRepository followUps;
    private final CompletedActivityRecordRepository records;
    private final PracticePhotoRepository photos;
    private final PracticeReportService reportService;
    private final ActivityPlanService planService;
    private final FinalReportService finalService;
    private final ActivityEvaluationService evaluationService;
    private final PracticeFollowUpReportService followUpService;
    private final CompletedActivityRecordService recordService;
    private final PracticePhotoService photoService;

    public byte[] export(Long enrollmentId, String username) {
        var enrollment = enrollments.findById(enrollmentId).orElseThrow(() -> new NotFoundException("Práctica no encontrada"));
        var account = accounts.findByUsernameAndDeletedFalse(username).orElseThrow(() -> new AccessDeniedException("Acceso denegado"));
        if (!access.canViewEnrollment(enrollment, account)) throw new AccessDeniedException("No puedes consultar esta práctica");
        var index = new StringBuilder("EXPEDIENTE DE PRÁCTICA #" + enrollmentId + "\nGenerado: " + LocalDateTime.now()
                + "\nSolicitante: " + username + "\n\nContiene documentos definitivos autorizados y evidencias disponibles."
                + "\nLos borradores privados y los documentos sin aprobar no se incluyen como definitivos.\n\n");
        try (var bytes = new ByteArrayOutputStream(); var zip = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
            var writer = new ArchiveWriter(zip);
            var l1 = reports.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(enrollmentId);
            if (l1.isEmpty()) index.append("L.1: sin registrar\n");
            for (var doc : l1) document(writer, index, "L1-informe-actividades", doc.getId(), () -> reportService.getById(doc.getId(), username),
                    "APPROVED".equals(doc.getStatus().name()), () -> reportService.exportApprovedPdf(doc.getId(), username));
            var l2 = plans.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(enrollmentId);
            if (l2.isEmpty()) index.append("L.2: sin registrar\n");
            for (var doc : l2) document(writer, index, "L2-plan-actividades", doc.getId(), () -> planService.getById(doc.getId(), username),
                    "APPROVED".equals(doc.getStatus().name()), () -> planService.exportApprovedPdf(doc.getId(), username));
            var l3 = finals.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(enrollmentId);
            if (l3.isEmpty()) index.append("L.3: sin registrar\n");
            for (var doc : l3) document(writer, index, "L3-informe-tutor-institucional", doc.getId(), () -> finalService.getById(doc.getId(), username),
                    "APPROVED".equals(doc.getStatus().name()), () -> finalService.exportApprovedPdf(doc.getId(), username));
            var l4 = evaluations.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(enrollmentId);
            if (l4.isEmpty()) index.append("L.4: sin registrar\n");
            for (var doc : l4) document(writer, index, "L4-evaluacion-actividades", doc.getId(), () -> evaluationService.getById(doc.getId(), username), true,
                    () -> evaluationService.exportPdf(doc.getId(), username));
            var l5 = followUps.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(enrollmentId);
            if (l5.isEmpty()) index.append("L.5: sin registrar\n");
            for (var doc : l5) document(writer, index, "L5-reporte-seguimiento", doc.getId(), () -> followUpService.getById(doc.getId(), username), true,
                    () -> followUpService.exportPdf(doc.getId(), username));
            var l6 = records.findByEnrollment_IdAndDeletedFalseOrderByIdAsc(enrollmentId);
            if (l6.isEmpty()) index.append("L.6: sin registrar\n");
            for (var doc : l6) document(writer, index, "L6-registro-actividades", doc.getId(), () -> recordService.getById(doc.getId(), username),
                    "APPROVED".equals(doc.getStatus().name()), () -> recordService.exportApprovedPdf(doc.getId(), username));
            index.append("\nEVIDENCIAS\n");
            var evidence = photos.findByEnrollment_IdAndDeletedFalseOrderByUploadedAtDesc(enrollmentId);
            if (evidence.isEmpty()) index.append("Sin evidencias registradas\n");
            for (var photo : evidence) {
                try {
                    var file = photoService.getContent(photo.getId(), username);
                    String extension = switch (file.getContentType()) { case "image/jpeg" -> ".jpg"; case "image/png" -> ".png"; case "application/pdf" -> ".pdf"; default -> ".bin"; };
                    String path = "evidencias/evidencia-" + photo.getId() + extension;
                    writer.put(path, file.getData());
                    index.append(path).append(" | ").append(photo.getPracticeDate()).append(" | ")
                            .append(photo.getDescription() == null ? "Sin descripción" : photo.getDescription()).append('\n');
                } catch (AccessDeniedException exception) { index.append("Evidencia no disponible para este usuario\n"); }
            }
            writer.put("00-INDICE.txt", index.toString().getBytes(StandardCharsets.UTF_8));
            zip.finish(); return bytes.toByteArray();
        } catch (IOException exception) { throw new IllegalStateException("No se pudo generar el expediente", exception); }
    }

    private void document(ArchiveWriter writer, StringBuilder index, String name, Long id,
            Runnable authorize, boolean finalDocument, java.util.function.Supplier<byte[]> render) throws IOException {
        try {
            authorize.run();
            if (!finalDocument) { index.append(name).append(": pendiente de aprobación; no incluido\n"); return; }
            String path = "documentos/" + name + "-" + id + ".pdf";
            writer.put(path, render.get()); index.append(path).append('\n');
        } catch (AccessDeniedException exception) { index.append(name).append(": no disponible para este usuario\n"); }
        catch (com.sgp.systemsgp.exception.BadRequestException exception) { index.append(name).append(": no generado: ").append(exception.getMessage()).append('\n'); }
    }

    private static class ArchiveWriter {
        private final ZipOutputStream zip;
        private long total;
        ArchiveWriter(ZipOutputStream zip) { this.zip = zip; }
        void put(String path, byte[] bytes) throws IOException {
            total += bytes.length;
            if (total > 64L * 1024 * 1024) throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.PAYLOAD_TOO_LARGE, "El expediente supera 64 MB. Descarga las evidencias por separado.");
            zip.putNextEntry(new ZipEntry(path)); zip.write(bytes); zip.closeEntry();
        }
    }
}
