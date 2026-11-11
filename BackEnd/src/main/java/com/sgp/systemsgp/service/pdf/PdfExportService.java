/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PdfExportService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa la lógica de aplicación de los documentos PDF.
 */

package com.sgp.systemsgp.service.pdf;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionURI;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDBorderStyleDictionary;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class PdfExportService extends PdfLayoutSupport {

    public PdfSection section(
            String title,
            List<PdfField> fields) {

        return new PdfSection(title, fields, List.of(), List.of());
    }

    public PdfSection sectionWithTables(
            String title,
            List<PdfField> fields,
            List<PdfWeekTable> weekTables) {

        return new PdfSection(title, fields, weekTables, List.of());
    }

    public PdfSection sectionWithScheduleMatrices(
            String title,
            List<PdfField> fields,
            List<PdfScheduleMatrix> scheduleMatrices) {

        return new PdfSection(title, fields, List.of(), scheduleMatrices);
    }

    public PdfField field(
            String label,
            Object value) {

        return new PdfField(label, formatValue(value));
    }

    public PdfWeekTable weekTable(List<PdfWeekRow> rows) {

        return new PdfWeekTable(rows == null ? List.of() : rows);
    }

    public PdfWeekRow weekRow(
            Integer weekNumber,
            LocalDate startDate,
            LocalDate endDate,
            String bodyLabel,
            String bodyText) {

        return new PdfWeekRow(
                "SEMANA " + (weekNumber == null ? "" : weekNumber),
                formatAcademicRange(startDate, endDate),
                bodyLabel,
                bodyText);
    }

    public PdfScheduleMatrix scheduleMatrix(
            String title,
            List<PdfScheduleRow> rows) {

        return new PdfScheduleMatrix(
                title,
                rows == null ? List.of() : rows);
    }

    public PdfScheduleRow scheduleRow(
            Integer weekNumber,
            LocalDate startDate,
            LocalDate endDate,
            String activityText) {

        return new PdfScheduleRow(weekNumber, startDate, endDate, activityText);
    }

    public byte[] createPdf(
            String title,
            List<PdfSection> sections) {
        return createPdf(title, sections, null);
    }

    public byte[] createPdf(String title, List<PdfSection> sections, byte[] letterhead) {

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PdfWriter writer = new PdfWriter(
                    document,
                    new PDType1Font(Standard14Fonts.FontName.TIMES_ROMAN),
                    new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD));

            writer.universityBranding = !isInstitutionalFinalReport(title);
            writer.pageNumbers = academicTitle(title).equals("INFORME DE ACTIVIDADES CUMPLIDAS");
            if (isInstitutionalFinalReport(title)) {
                writer.letterhead = letterhead;
                writer.writeLetterhead();
                writer.writeInstitutionalFinalHeader();
            } else {
                writer.writeCover(title, sections);
            }

            int sectionNumber = 1;

            for (PdfSection section : sections) {
                if (writer.writeSection(section, sectionNumber)) {
                    sectionNumber++;
                }
            }

            writer.close();
            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo generar el PDF", exception);
        }
    }

    public byte[] createCompletedActivityRecordPdf(PdfCompletedActivityRecord record) {

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            CompletedActivityRecordPdfWriter writer =
                    new CompletedActivityRecordPdfWriter(document);
            writer.write(record);
            writer.close();
            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo generar el PDF", exception);
        }
    }

    public byte[] createPracticeFollowUpReportPdf(PdfPracticeFollowUpReport report) {

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PracticeFollowUpReportPdfWriter writer =
                    new PracticeFollowUpReportPdfWriter(document);
            writer.write(report);
            writer.close();
            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo generar el PDF", exception);
        }
    }

    public byte[] createActivityEvaluationPdf(PdfActivityEvaluation evaluation) {

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            ActivityEvaluationPdfWriter writer =
                    new ActivityEvaluationPdfWriter(document);
            writer.write(evaluation);
            writer.close();
            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo generar el PDF", exception);
        }
    }

    public record PdfSection(
            String title,
            List<PdfField> fields,
            List<PdfWeekTable> weekTables,
            List<PdfScheduleMatrix> scheduleMatrices) {
    }

    public record PdfField(String label, String value) {
    }

    public record PdfWeekTable(List<PdfWeekRow> rows) {
    }

    public record PdfWeekRow(String weekLabel, String dateRange, String bodyLabel, String bodyText) {
    }

    public record PdfScheduleMatrix(String title, List<PdfScheduleRow> rows) {
    }

    public record PdfScheduleRow(Integer weekNumber, LocalDate startDate, LocalDate endDate, String activityText) {
    }

    public record PdfCompletedActivityRecord(
            String educationalInstitutionName,
            String practiceType,
            String studentFullName,
            String studentIdentification,
            String cycle,
            String academicPeriod,
            String developmentMode,
            Integer totalMinutes,
            LocalDate deliveryDate,
            String studentSignatureName,
            String institutionalTutorName,
            List<PdfCompletedActivityEntry> entries) {
    }

    public record PdfCompletedActivityEntry(
            LocalDate activityDate,
            LocalTime startTime,
            LocalTime endTime,
            Integer totalMinutes,
            String developedActivities,
            String evidenceLink,
            byte[] evidenceImage) {
        public PdfCompletedActivityEntry(LocalDate activityDate, LocalTime startTime, LocalTime endTime,
                Integer totalMinutes, String developedActivities, String evidenceLink) {
            this(activityDate, startTime, endTime, totalMinutes, developedActivities, evidenceLink, null);
        }
    }

    public record PdfPracticeFollowUpReport(
            String educationalInstitutionName,
            String practiceType,
            String studentFullName,
            String studentIdentification,
            String cycle,
            String academicPeriod,
            String developmentMode,
            Integer totalMinutes,
            LocalDate deliveryDate,
            String academicTutorName,
            String academicTutorRole,
            List<PdfPracticeFollowUpSession> sessions) {
    }

    public record PdfPracticeFollowUpSession(
            LocalDate supervisionDate,
            LocalTime startTime,
            LocalTime endTime,
            Integer totalMinutes,
            String supervisedActivities,
            String observations) {
    }

    public record PdfActivityEvaluation(
            String educationalInstitutionName,
            String practiceType,
            String studentFullName,
            String studentIdentification,
            String cycle,
            String academicPeriod,
            String developmentMode,
            Integer hoursCompleted,
            BigDecimal activitiesCompletionPercentage,
            LocalDate evaluationDate,
            String academicTutorName,
            String academicTutorRole,
            List<PdfActivityEvaluationAspect> aspects) {
    }

    public record PdfActivityEvaluationAspect(
            String aspectType,
            String item,
            String level,
            Integer score) {
    }

}
