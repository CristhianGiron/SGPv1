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

package com.sgp.systemsgp.service;

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
public class PdfExportService {

    private static final float MARGIN = 85F;
    private static final float PAGE_BOTTOM = 72F;
    private static final float BODY_SIZE = 12F;
    private static final float SECTION_SIZE = 12F;
    private static final float TITLE_SIZE = 12F;
    private static final float COVER_TITLE_SIZE = 14F;
    private static final float TABLE_SIZE = 12F;
    private static final float MATRIX_SIZE = 7.2F;
    private static final float TABLE_LEADING = 18F;
    private static final float BODY_LEADING = 21F;
    private static final float SECTION_LEADING = 24F;
    private static final float TITLE_LEADING = 24F;
    private static final float COVER_LEADING = 18F;
    private static final float SECTION_GAP = 14F;
    private static final float TABLE_GAP_BEFORE = 8F;
    private static final float TABLE_GAP_AFTER = 18F;
    private static final Color TABLE_HEADER_GRAY = new Color(128, 128, 128);
    private static final Color TABLE_BORDER = Color.BLACK;
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private void drawUniversityLogo(
            PDDocument document, PDPageContentStream stream,
            float x, float y, float boxWidth, float boxHeight) throws IOException {

        try (InputStream resource = PdfExportService.class.getResourceAsStream("/branding/unl-logo.png")) {
            if (resource == null) {
                throw new IOException("No se encontró el logotipo de la UNL");
            }
            BufferedImage source = ImageIO.read(resource);
            if (source == null) {
                throw new IOException("No se pudo leer el logotipo de la UNL");
            }
            // Exclude transparent padding so the original logo fits the available space.
            int left = source.getWidth(), top = source.getHeight(), right = -1, bottom = -1;
            for (int row = 0; row < source.getHeight(); row++) {
                for (int column = 0; column < source.getWidth(); column++) {
                    if ((source.getRGB(column, row) >>> 24) != 0) {
                        left = Math.min(left, column);
                        top = Math.min(top, row);
                        right = Math.max(right, column);
                        bottom = Math.max(bottom, row);
                    }
                }
            }
            if (right < left || bottom < top) {
                throw new IOException("El logotipo de la UNL está vacío");
            }
            BufferedImage logo = source.getSubimage(left, top, right - left + 1, bottom - top + 1);
            PDImageXObject image = LosslessFactory.createFromImage(document, logo);
            float scale = Math.min(boxWidth / logo.getWidth(), boxHeight / logo.getHeight());
            float width = logo.getWidth() * scale;
            float height = logo.getHeight() * scale;
            stream.drawImage(image, x + (boxWidth - width) / 2F, y + (boxHeight - height) / 2F, width, height);
        }
    }

    private void drawImage(PDDocument document, PDPageContentStream stream, byte[] bytes,
            float x, float y, float boxWidth, float boxHeight) throws IOException {
        PDImageXObject image = PDImageXObject.createFromByteArray(document, bytes, "document-image");
        float scale = Math.min(boxWidth / image.getWidth(), boxHeight / image.getHeight());
        float width = image.getWidth() * scale, height = image.getHeight() * scale;
        stream.drawImage(image, x + (boxWidth - width) / 2F, y + (boxHeight - height) / 2F, width, height);
    }

    private void fittedText(PDPageContentStream stream, String text, PDFont font, float size,
            float x, float y, float maxWidth) throws IOException {
        String value = safeText(text == null ? "" : text).replace('\n', ' ');
        float width = font.getStringWidth(value) / 1000F * size;
        float fitted = width > maxWidth ? size * maxWidth / width : size;
        stream.beginText();
        stream.setFont(font, fitted);
        stream.newLineAtOffset(x, y);
        stream.showText(value);
        stream.endText();
    }

    private void landscapeHeader(PDDocument document, PDPageContentStream stream, float width, float height) throws IOException {
        drawUniversityLogo(document, stream, 78F, height - 74F, 100F, 35F);
        PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        fittedText(stream, "Carrera de", bold, 7F, width - 225F, height - 48F, 150F);
        fittedText(stream, "Pedagogía de las Ciencias Experimentales", bold, 7F, width - 225F, height - 57F, 150F);
        fittedText(stream, "Titulación Pedagogía de la Informática", bold, 7F, width - 225F, height - 66F, 150F);
        stream.setStrokingColor(Color.BLACK);
        stream.setLineWidth(0.7F);
        stream.moveTo(width - 228F, height - 38F);
        stream.lineTo(width - 228F, height - 72F);
        stream.moveTo(70F, height - 76F);
        stream.lineTo(width - 70F, height - 76F);
        stream.stroke();
    }

    private float landscapeDocumentHeader(PDPageContentStream stream, float width, float height,
            String title, String institution, String practiceType, String student, String identification,
            String cycle, String period, String mode) throws IOException {
        PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        float y = height - 110F;
        fittedText(stream, "PRÁCTICA PREPROFESIONAL EN EL COMPONENTE LABORAL", bold, 12.5F, 70F, y, 420F);
        float titleX = width - 308F;
        stream.setNonStrokingColor(TABLE_HEADER_GRAY);
        stream.addRect(titleX, y - 21F, 238F, 32F);
        stream.fill();
        stream.setNonStrokingColor(Color.WHITE);
        String[] lines = title.split("\n");
        for (int i = 0; i < lines.length; i++) {
            fittedText(stream, lines[i], new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD),
                    13F, titleX + 6F, y - i * 15F, 226F);
        }
        stream.setNonStrokingColor(Color.BLACK);
        y -= 31F;
        landscapeLabel(stream, "Institución Educativa Receptora: ", institution, 70F, y, width - 140F);
        y -= 15F;
        landscapeLabel(stream, "Tipo de Práctica: ", "", 70F, y, 110F);
        fittedText(stream, "OBSERVACIÓN ( " + ("OBSERVACION".equals(practiceType) ? "X" : " ") + " )", regular, 10.5F, 183F, y, 136F);
        fittedText(stream, "ELABORACIÓN ( " + ("ELABORACION".equals(practiceType) ? "X" : " ") + " )", regular, 10.5F, 325F, y, 140F);
        fittedText(stream, "DOCENTE ( " + ("DOCENTE".equals(practiceType) ? "X" : " ") + " )", regular, 10.5F, 482F, y, 130F);
        y -= 15F;
        landscapeLabel(stream, "Nombre del Estudiante: ", student, 70F, y, 440F);
        landscapeLabel(stream, "Cédula: ", identification, 525F, y, 145F);
        landscapeLabel(stream, "Ciclo: ", cycle, width - 160F, y, 90F);
        y -= 15F;
        landscapeLabel(stream, "Periodo Académico: ", period, 70F, y, 340F);
        landscapeLabel(stream, "Desarrollo de actividades: ", "", 418F, y, 155F);
        fittedText(stream, "on line ( " + ("ONLINE".equals(mode) ? "X" : " ") + " )", regular, 10.5F, 583F, y, 73F);
        fittedText(stream, "presencial ( " + ("PRESENCIAL".equals(mode) ? "X" : " ") + " )", regular, 10.5F, 662F, y, 110F);
        return y - 14F;
    }

    private void landscapeLabel(PDPageContentStream stream, String label, String value,
            float x, float y, float width) throws IOException {
        PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        float labelWidth = bold.getStringWidth(label) / 1000F * 10.5F;
        fittedText(stream, label, bold, 10.5F, x, y, width);
        fittedText(stream, value, regular, 10.5F, x + labelWidth, y, Math.max(20F, width - labelWidth));
    }

    private void fitColumns(float[] columns, float available) {
        float sum = 0F;
        for (float column : columns) sum += column;
        for (int i = 0; i < columns.length; i++) columns[i] *= available / sum;
    }

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

    private String formatValue(Object value) {

        if (value == null) {
            return null;
        }

        if (value instanceof LocalDateTime dateTime) {
            return DATE_TIME_FORMATTER.format(dateTime);
        }

        if (value instanceof LocalDate date) {
            return DATE_FORMATTER.format(date);
        }

        if (value instanceof LocalTime time) {
            return TIME_FORMATTER.format(time);
        }

        return String.valueOf(value);
    }

    private String formatAcademicRange(
            LocalDate startDate,
            LocalDate endDate) {

        if (startDate == null && endDate == null) {
            return "";
        }

        if (startDate == null) {
            return "HASTA " + formatAcademicDate(endDate);
        }

        if (endDate == null || startDate.equals(endDate)) {
            return formatAcademicDate(startDate);
        }

        return "DEL " + formatAcademicDate(startDate)
                + " AL " + formatAcademicDate(endDate);
    }

    private String formatAcademicDate(LocalDate date) {

        if (date == null) {
            return "";
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
                "EEEE d 'DE' MMMM 'DE' yyyy",
                new Locale("es", "ES"));

        return formatter.format(date).toUpperCase(Locale.forLanguageTag("es-EC"));
    }

    private String safeText(String value) {

        if (value == null) {
            return "";
        }

        StringBuilder builder = new StringBuilder();

        // Spanish keyboards and pasted text may use either composed or combining accents.
        for (char character : Normalizer.normalize(value, Normalizer.Form.NFC).toCharArray()) {
            if (character == '\u200B' || character == '\uFEFF' || character == '\u00AD') {
                continue;
            } else if (character == '\n' || character == '\r') {
                builder.append(character);
            } else if (character == '\u2022') {
                builder.append(character);
            } else if (character == '\u2013' || character == '\u2014') {
                builder.append(character);
            } else if (character == '\u2018' || character == '\u2019') {
                builder.append(character);
            } else if (character == '\u201C' || character == '\u201D') {
                builder.append(character);
            } else if (character == '\t' || character == '\u00A0') {
                builder.append(' ');
            } else if (character == '\u2026' || character == '\u20AC'
                    || character >= 32 && character <= 126 || character >= 160 && character <= 255) {
                builder.append(character);
            } else {
                builder.append('?');
            }
        }

        return builder.toString();
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

    private record PdfScheduleColumn(String key, Integer weekNumber, String monthLabel) {
    }

    private record PdfScheduleActivity(String text, String weekKey) {
    }

    private record PdfScheduleMonthGroup(String label, int span) {
    }

    private class CompletedActivityRecordPdfWriter {

        private static final float LEFT = 70F;
        private static final float RIGHT = 70F;
        private static final float TOP = 42F;
        private static final float BOTTOM = 42F;
        private static final float HEADER_SIZE = 11F;
        private static final float NORMAL_SIZE = 10F;
        private static final float SMALL_SIZE = 8F;
        private static final float TABLE_HEADER_SIZE = 9F;
        private static final float ROW_LEADING = 12F;
        private static final float MIN_ROW_HEIGHT = 82F;
        private static final Color HEADER_GRAY = new Color(128, 128, 128);

        private final PDDocument document;
        private final PDFont regularFont;
        private final PDFont boldFont;
        private PDPageContentStream contentStream;
        private PDPage page;
        private float width;
        private float height;
        private float y;

        CompletedActivityRecordPdfWriter(PDDocument document) throws IOException {

            this.document = document;
            this.regularFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            this.boldFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            addPage();
        }

        void write(PdfCompletedActivityRecord record) throws IOException {

            writePageHeader();
            writeDocumentHeader(record);
            writeTable(record);
            writeTotalAndSignatures(record);
        }

        private void writePageHeader() throws IOException {
            landscapeHeader(document, contentStream, width, height);
            y = height - 110F;
        }

        private void writeDocumentHeader(PdfCompletedActivityRecord record) throws IOException {
            y = landscapeDocumentHeader(contentStream, width, height, "REGISTRO DE LAS ACTIVIDADES\nCUMPLIDAS",
                    record.educationalInstitutionName(), record.practiceType(), record.studentFullName(),
                    record.studentIdentification(), record.cycle(), record.academicPeriod(), record.developmentMode());
        }

        private void writeTable(PdfCompletedActivityRecord record) throws IOException {

            float[] columns = {68F, 50F, 50F, 55F, 370F, 165F};
            fitColumns(columns, width - LEFT - RIGHT);
            String[] headers = {
                    "Fecha",
                    "Hora de\nInicio",
                    "Hora de\nFin",
                    "Total\nHoras\nMinutos",
                    "Actividades desarrolladas",
                    "Evidencia"
            };

            drawTableHeader(columns, headers);

            List<PdfCompletedActivityEntry> entries =
                    record.entries() == null ? List.of() : record.entries();

            for (PdfCompletedActivityEntry entry : entries) {
                List<String> activities = wrap(entry.developedActivities(), regularFont, NORMAL_SIZE, columns[4] - 12F);
                List<String> evidence = wrap(entry.evidenceLink(), regularFont, SMALL_SIZE, columns[5] - 12F);
                int activityOffset = 0, evidenceOffset = 0;
                boolean firstPart = true;
                do {
                    float imageHeight = firstPart && entry.evidenceImage() != null ? 112F : 0F;
                    if (y - Math.max(MIN_ROW_HEIGHT, imageHeight + 34F) < BOTTOM) {
                        addPage(); writePageHeader(); drawTableHeader(columns, headers);
                    }
                    int activityCapacity = Math.max(1, (int) ((y - BOTTOM - 24F) / ROW_LEADING));
                    int evidenceCapacity = Math.max(1, (int) ((y - BOTTOM - 24F - imageHeight) / 10F));
                    int activityCount = Math.min(activityCapacity, activities.size() - activityOffset);
                    int evidenceCount = Math.min(evidenceCapacity, evidence.size() - evidenceOffset);
                    float rowHeight = Math.max(MIN_ROW_HEIGHT, Math.max(activityCount * ROW_LEADING + 24F,
                            evidenceCount * 10F + 24F + imageHeight));
                    PdfCompletedActivityEntry part = new PdfCompletedActivityEntry(entry.activityDate(), entry.startTime(), entry.endTime(),
                            entry.totalMinutes(), entry.developedActivities(), entry.evidenceLink(), firstPart ? entry.evidenceImage() : null);
                    drawActivityRow(columns, part, activities.subList(activityOffset, activityOffset + activityCount),
                            evidence.subList(evidenceOffset, evidenceOffset + evidenceCount), rowHeight);
                    activityOffset += activityCount;
                    evidenceOffset += evidenceCount;
                    firstPart = false;
                    if (activityOffset < activities.size() || evidenceOffset < evidence.size()) {
                        addPage(); writePageHeader(); drawTableHeader(columns, headers);
                    }
                } while (activityOffset < activities.size() || evidenceOffset < evidence.size());
            }
        }

        private void drawTableHeader(float[] columns, String[] headers) throws IOException {

            float rowHeight = 38F;
            float x = LEFT;
            for (int index = 0; index < columns.length; index++) {
                drawCell(x, y - rowHeight, columns[index], rowHeight);
                writeCenteredCell(
                        headers[index],
                        boldFont,
                        TABLE_HEADER_SIZE,
                        x,
                        y - rowHeight,
                        columns[index],
                        rowHeight);
                x += columns[index];
            }

            y -= rowHeight;
        }

        private void drawActivityRow(
                float[] columns,
                PdfCompletedActivityEntry entry,
                List<String> activityLines,
                List<String> evidenceLines,
                float rowHeight) throws IOException {

            float x = LEFT;
            float bottom = y - rowHeight;

            for (float column : columns) {
                drawCell(x, bottom, column, rowHeight);
                x += column;
            }

            writeCenteredCell(formatDate(entry.activityDate()), regularFont, NORMAL_SIZE, LEFT, bottom, columns[0], rowHeight);
            writeCenteredCell(formatTime(entry.startTime()), regularFont, NORMAL_SIZE, LEFT + columns[0], bottom, columns[1], rowHeight);
            writeCenteredCell(formatTime(entry.endTime()), regularFont, NORMAL_SIZE, LEFT + columns[0] + columns[1], bottom, columns[2], rowHeight);
            writeCenteredCell(formatTemplateMinutes(entry.totalMinutes()), regularFont, NORMAL_SIZE, LEFT + columns[0] + columns[1] + columns[2], bottom, columns[3], rowHeight);

            writeLines(
                    activityLines,
                    regularFont,
                    NORMAL_SIZE,
                    LEFT + columns[0] + columns[1] + columns[2] + columns[3] + 6F,
                    y - 16F,
                    ROW_LEADING);

            float evidenceX = LEFT + columns[0] + columns[1] + columns[2] + columns[3] + columns[4];
            if (entry.evidenceImage() != null) {
                drawImage(document, contentStream, entry.evidenceImage(), evidenceX + 6F,
                        y - 112F, columns[5] - 12F, 100F);
            }
            writeLines(
                    evidenceLines,
                    regularFont,
                    SMALL_SIZE,
                    LEFT + columns[0] + columns[1] + columns[2] + columns[3] + columns[4] + 6F,
                    y - (entry.evidenceImage() == null ? 16F : 126F),
                    10F,
                    Color.BLUE);

            addEvidenceLinkAnnotation(
                    entry.evidenceLink(),
                    LEFT + columns[0] + columns[1] + columns[2] + columns[3] + columns[4],
                    bottom,
                    columns[5],
                    rowHeight);

            y = bottom;
        }

        private void addEvidenceLinkAnnotation(
                String url,
                float x,
                float bottom,
                float cellWidth,
                float cellHeight) throws IOException {

            if (!hasText(url) || !url.startsWith("http")) {
                return;
            }

            PDActionURI action = new PDActionURI();
            action.setURI(url);

            PDBorderStyleDictionary border = new PDBorderStyleDictionary();
            border.setWidth(0);

            PDAnnotationLink link = new PDAnnotationLink();
            link.setAction(action);
            link.setBorderStyle(border);
            link.setRectangle(new PDRectangle(x + 4F, bottom + 4F, cellWidth - 8F, cellHeight - 8F));
            page.getAnnotations().add(link);
        }

        private void writeTotalAndSignatures(PdfCompletedActivityRecord record) throws IOException {

            if (y < BOTTOM + 170F) {
                addPage();
                writePageHeader();
            }

            y -= 18F;
            writeText("Total de horas ejecutadas", boldFont, NORMAL_SIZE, LEFT, y);
            writeText(formatTemplateMinutes(record.totalMinutes()), boldFont, NORMAL_SIZE, LEFT + 150F, y);
            y -= 28F;
            writeLabelValue("Fecha: ", formatDate(record.deliveryDate()), LEFT, y);

            y -= 72F;
            float leftSignatureX = LEFT + 40F;
            float rightSignatureX = width - RIGHT - 260F;
            drawLine(leftSignatureX, y, leftSignatureX + 230F, y);
            drawLine(rightSignatureX, y, rightSignatureX + 230F, y);
            writeText("f.)", regularFont, NORMAL_SIZE, leftSignatureX - 22F, y);
            writeText("f.)", regularFont, NORMAL_SIZE, rightSignatureX - 22F, y);
            writeCenteredText(record.studentSignatureName(), boldFont, SMALL_SIZE + 1F, leftSignatureX, y - 16F, 230F);
            writeCenteredText("ESTUDIANTE DE LA CPCEI-UNL", regularFont, SMALL_SIZE, leftSignatureX, y - 29F, 230F);
            writeCenteredText(record.institutionalTutorName(), boldFont, SMALL_SIZE + 1F, rightSignatureX, y - 16F, 230F);
            writeCenteredText("TUTOR INSTITUCIONAL", regularFont, SMALL_SIZE, rightSignatureX, y - 29F, 230F);
        }

        private void addPage() throws IOException {

            if (contentStream != null) {
                contentStream.close();
            }

            page = new PDPage(new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()));
            document.addPage(page);
            contentStream = new PDPageContentStream(document, page);
            width = page.getMediaBox().getWidth();
            height = page.getMediaBox().getHeight();
            y = height - TOP;
        }

        private void close() throws IOException {

            if (contentStream != null) {
                contentStream.close();
                contentStream = null;
            }
        }

        private boolean isPracticeType(PdfCompletedActivityRecord record, String expected) {

            return record.practiceType() != null
                    && record.practiceType().equalsIgnoreCase(expected);
        }

        private boolean isMode(PdfCompletedActivityRecord record, String expected) {

            return record.developmentMode() != null
                    && record.developmentMode().equalsIgnoreCase(expected);
        }

        private String checkbox(boolean checked) {

            return checked ? "( X )" : "(   )";
        }

        private void writeLabelValue(String label, String value, float x, float baseline) throws IOException {

            writeText(label, boldFont, HEADER_SIZE, x, baseline);
            writeText(nullSafeText(value), regularFont, HEADER_SIZE, x + textWidth(label, boldFont, HEADER_SIZE), baseline);
        }

        private void writeCenteredCell(
                String text,
                PDFont font,
                float fontSize,
                float x,
                float bottom,
                float cellWidth,
                float cellHeight) throws IOException {

            List<String> lines = wrap(text, font, fontSize, cellWidth - 8F);
            float blockHeight = lines.size() * (fontSize + 2F);
            float baseline = bottom + ((cellHeight + blockHeight) / 2F) - fontSize;
            for (String line : lines) {
                float lineWidth = textWidth(line, font, fontSize);
                writeText(line, font, fontSize, x + ((cellWidth - lineWidth) / 2F), baseline);
                baseline -= fontSize + 2F;
            }
        }

        private void writeCenteredText(
                String text,
                PDFont font,
                float fontSize,
                float x,
                float baseline,
                float maxWidth) throws IOException {

            List<String> lines = wrap(text, font, fontSize, maxWidth);
            float currentY = baseline;
            for (String line : lines) {
                float lineWidth = textWidth(line, font, fontSize);
                writeText(line, font, fontSize, x + ((maxWidth - lineWidth) / 2F), currentY);
                currentY -= fontSize + 2F;
            }
        }

        private void writeLines(
                List<String> lines,
                PDFont font,
                float fontSize,
                float x,
                float baseline,
                float leading) throws IOException {

            writeLines(lines, font, fontSize, x, baseline, leading, Color.BLACK);
        }

        private void writeLines(
                List<String> lines,
                PDFont font,
                float fontSize,
                float x,
                float baseline,
                float leading,
                Color color) throws IOException {

            float currentY = baseline;
            for (String line : lines) {
                writeText(line, font, fontSize, x, currentY, color);
                currentY -= leading;
            }
        }

        private List<String> wrap(
                String text,
                PDFont font,
                float fontSize,
                float maxWidth) throws IOException {

            List<String> lines = new ArrayList<>();
            String normalized = nullSafeText(text).replace("\r\n", "\n").replace('\r', '\n');

            for (String paragraph : normalized.split("\n", -1)) {
                String[] words = paragraph.trim().split("\\s+");
                String current = "";

                for (String word : words) {
                    if (word.isBlank()) {
                        continue;
                    }

                    if (textWidth(word, font, fontSize) > maxWidth) {
                        if (!current.isBlank()) {
                            lines.add(current);
                            current = "";
                        }

                        lines.addAll(splitLongWord(word, font, fontSize, maxWidth));
                        continue;
                    }

                    String candidate = current.isBlank() ? word : current + " " + word;
                    if (textWidth(candidate, font, fontSize) <= maxWidth) {
                        current = candidate;
                    } else {
                        if (!current.isBlank()) {
                            lines.add(current);
                        }
                        current = word;
                    }
                }

                if (!current.isBlank()) {
                    lines.add(current);
                }
            }

            return lines.isEmpty() ? List.of("") : lines;
        }

        private List<String> splitLongWord(
                String word,
                PDFont font,
                float fontSize,
                float maxWidth) throws IOException {

            List<String> chunks = new ArrayList<>();
            StringBuilder current = new StringBuilder();

            for (char character : word.toCharArray()) {
                String candidate = current.toString() + character;

                if (!current.isEmpty() && textWidth(candidate, font, fontSize) > maxWidth) {
                    chunks.add(current.toString());
                    current = new StringBuilder();
                }

                current.append(character);
            }

            if (!current.isEmpty()) {
                chunks.add(current.toString());
            }

            return chunks;
        }

        private String formatDate(LocalDate date) {

            return date == null ? "" : DateTimeFormatter.ofPattern("dd/MM/yyyy").format(date);
        }

        private String formatTime(LocalTime time) {

            return time == null ? "" : DateTimeFormatter.ofPattern("HH'h':mm").format(time);
        }

        private String formatTemplateMinutes(Integer totalMinutes) {

            if (totalMinutes == null) {
                return "";
            }

            int hours = totalMinutes / 60;
            int minutes = totalMinutes % 60;

            return String.format("%02dh:%02d", hours, minutes);
        }

        private String nullSafeText(String value) {

            return value == null ? "" : safeText(value);
        }

        private void drawCell(float x, float yPosition, float cellWidth, float cellHeight) throws IOException {

            contentStream.setStrokingColor(Color.BLACK);
            contentStream.setLineWidth(0.8F);
            contentStream.addRect(x, yPosition, cellWidth, cellHeight);
            contentStream.stroke();
        }

        private void drawLine(float x1, float y1, float x2, float y2) throws IOException {

            contentStream.setStrokingColor(Color.BLACK);
            contentStream.setLineWidth(0.8F);
            contentStream.moveTo(x1, y1);
            contentStream.lineTo(x2, y2);
            contentStream.stroke();
        }

        private void drawFilledRect(
                float x,
                float yPosition,
                float rectWidth,
                float rectHeight,
                Color fill) throws IOException {

            contentStream.setNonStrokingColor(fill);
            contentStream.addRect(x, yPosition, rectWidth, rectHeight);
            contentStream.fill();
            contentStream.setNonStrokingColor(Color.BLACK);
        }

        private void writeText(
                String text,
                PDFont font,
                float fontSize,
                float x,
                float baseline) throws IOException {

            writeText(text, font, fontSize, x, baseline, Color.BLACK);
        }

        private void writeText(
                String text,
                PDFont font,
                float fontSize,
                float x,
                float baseline,
                Color color) throws IOException {

            if (text == null || text.isBlank()) {
                return;
            }

            contentStream.beginText();
            contentStream.setNonStrokingColor(color);
            contentStream.setFont(font, fontSize);
            contentStream.newLineAtOffset(x, baseline);
            contentStream.showText(safeText(text));
            contentStream.endText();
            contentStream.setNonStrokingColor(Color.BLACK);
        }

        private float textWidth(String text, PDFont font, float fontSize) throws IOException {

            return font.getStringWidth(safeText(text)) / 1000F * fontSize;
        }
    }

    private class PracticeFollowUpReportPdfWriter {

        private static final float LEFT = 70F;
        private static final float RIGHT = 70F;
        private static final float TOP = 42F;
        private static final float BOTTOM = 42F;
        private static final float HEADER_SIZE = 11F;
        private static final float NORMAL_SIZE = 8F;
        private static final float SMALL_SIZE = 8F;
        private static final float TABLE_HEADER_SIZE = 7F;
        private static final float ROW_LEADING = 9.5F;
        private static final float MIN_ROW_HEIGHT = 22F;
        private static final Color HEADER_GRAY = new Color(128, 128, 128);

        private final PDDocument document;
        private final PDFont regularFont;
        private final PDFont boldFont;
        private PDPageContentStream contentStream;
        private PDPage page;
        private float width;
        private float height;
        private float y;

        PracticeFollowUpReportPdfWriter(PDDocument document) throws IOException {

            this.document = document;
            this.regularFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            this.boldFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            addPage();
        }

        void write(PdfPracticeFollowUpReport report) throws IOException {

            writePageHeader();
            writeDocumentHeader(report);
            writeTable(report);
            writeTotalAndSignature(report);
        }

        private void writePageHeader() throws IOException {
            landscapeHeader(document, contentStream, width, height);
            y = height - 110F;
        }

        private void writeDocumentHeader(PdfPracticeFollowUpReport report) throws IOException {
            y = landscapeDocumentHeader(contentStream, width, height, "REPORTE DE SEGUIMIENTO DE\nPRÁCTICA PREPROFESIONAL",
                    report.educationalInstitutionName(), report.practiceType(), report.studentFullName(),
                    report.studentIdentification(), report.cycle(), report.academicPeriod(), report.developmentMode());
        }

        private void writeTable(PdfPracticeFollowUpReport report) throws IOException {

            float[] columns = {60F, 36F, 36F, 48F, 440F, 82F};
            fitColumns(columns, width - LEFT - RIGHT);
            String[] headers = {
                    "FECHA DE\nVISITA Y/O\nSUPERVISION",
                    "HORA\nDE\nINICIO",
                    "HORA\nDE FIN",
                    "TOTAL\nHORAS\nMINUTOS",
                    "ACTIVIDADES SUPERVISADAS",
                    "OBSERVACIONES"
            };

            drawTableHeader(columns, headers);

            List<PdfPracticeFollowUpSession> sessions =
                    report.sessions() == null ? List.of() : report.sessions();

            for (PdfPracticeFollowUpSession session : sessions) {
                List<String> activities = wrap(session.supervisedActivities(), regularFont, NORMAL_SIZE, columns[4] - 8F);
                List<String> observations = wrap(defaultObservation(session.observations()), regularFont, NORMAL_SIZE, columns[5] - 8F);
                int offset = 0, size = Math.max(activities.size(), observations.size());
                do {
                    if (y - MIN_ROW_HEIGHT < BOTTOM) {
                        addPage(); writePageHeader(); drawTableHeader(columns, headers);
                    }
                    int capacity = Math.max(1, (int) ((y - BOTTOM - 7F) / ROW_LEADING));
                    int count = Math.min(capacity, size - offset);
                    List<String> activityChunk = activities.subList(Math.min(offset, activities.size()), Math.min(offset + count, activities.size()));
                    List<String> observationChunk = observations.subList(Math.min(offset, observations.size()), Math.min(offset + count, observations.size()));
                    drawSessionRow(columns, session, activityChunk, observationChunk, Math.max(MIN_ROW_HEIGHT, count * ROW_LEADING + 7F));
                    offset += count;
                    if (offset < size) { addPage(); writePageHeader(); drawTableHeader(columns, headers); }
                } while (offset < size);
            }
        }

        private void drawTableHeader(float[] columns, String[] headers) throws IOException {

            float rowHeight = 38F;
            float x = LEFT;
            for (int index = 0; index < columns.length; index++) {
                drawCell(x, y - rowHeight, columns[index], rowHeight);
                writeCenteredCell(headers[index], boldFont, TABLE_HEADER_SIZE, x, y - rowHeight, columns[index], rowHeight);
                x += columns[index];
            }

            y -= rowHeight;
        }

        private void drawSessionRow(
                float[] columns,
                PdfPracticeFollowUpSession session,
                List<String> activityLines,
                List<String> observationLines,
                float rowHeight) throws IOException {

            float bottom = y - rowHeight;
            float x = LEFT;
            for (float column : columns) {
                drawCell(x, bottom, column, rowHeight);
                x += column;
            }

            writeCenteredCell(formatDate(session.supervisionDate()), regularFont, NORMAL_SIZE, LEFT, bottom, columns[0], rowHeight);
            writeCenteredCell(formatTime(session.startTime()), regularFont, NORMAL_SIZE, LEFT + columns[0], bottom, columns[1], rowHeight);
            writeCenteredCell(formatTime(session.endTime()), regularFont, NORMAL_SIZE, LEFT + columns[0] + columns[1], bottom, columns[2], rowHeight);
            writeCenteredCell(formatFollowUpMinutes(session.totalMinutes()), regularFont, NORMAL_SIZE, LEFT + columns[0] + columns[1] + columns[2], bottom, columns[3], rowHeight);

            writeLines(
                    activityLines,
                    regularFont,
                    NORMAL_SIZE,
                    LEFT + columns[0] + columns[1] + columns[2] + columns[3] + 4F,
                    y - 11F,
                    ROW_LEADING);
            writeLines(
                    observationLines,
                    regularFont,
                    NORMAL_SIZE,
                    LEFT + columns[0] + columns[1] + columns[2] + columns[3] + columns[4] + 4F,
                    y - 11F,
                    ROW_LEADING);

            y = bottom;
        }

        private void writeTotalAndSignature(PdfPracticeFollowUpReport report) throws IOException {

            if (y < BOTTOM + 170F) {
                addPage();
                writePageHeader();
            }

            y -= 18F;
            writeText("Total horas", boldFont, NORMAL_SIZE, LEFT, y);
            writeText(formatFollowUpMinutes(report.totalMinutes()), boldFont, NORMAL_SIZE, LEFT + 130F, y);
            y -= 30F;
            writeLabelValue("Fecha: ", formatDate(report.deliveryDate()), LEFT, y);

            y -= 62F;
            float signatureX = LEFT;
            writeText("f.)", regularFont, NORMAL_SIZE, signatureX, y);
            writeCenteredText(report.academicTutorName(), regularFont, SMALL_SIZE + 1F, signatureX, y - 16F, 374F);
            fittedText(contentStream, defaultAcademicTutorRole(report.academicTutorRole()), boldFont,
                    SMALL_SIZE, signatureX, y - 29F, 374F);
            writeCenteredText("TUTOR ACADÉMICO DE LA CPCEI-UNL", boldFont, SMALL_SIZE, signatureX, y - 42F, 374F);
        }

        private void addPage() throws IOException {
            if (contentStream != null) {
                contentStream.close();
            }

            page = new PDPage(new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()));
            document.addPage(page);
            contentStream = new PDPageContentStream(document, page);
            width = page.getMediaBox().getWidth();
            height = page.getMediaBox().getHeight();
            y = height - TOP;
        }

        private void close() throws IOException {
            if (contentStream != null) {
                contentStream.close();
                contentStream = null;
            }
        }

        private boolean isPracticeType(PdfPracticeFollowUpReport report, String expected) {
            return report.practiceType() != null
                    && report.practiceType().equalsIgnoreCase(expected);
        }

        private boolean isMode(PdfPracticeFollowUpReport report, String expected) {
            return report.developmentMode() != null
                    && report.developmentMode().equalsIgnoreCase(expected);
        }

        private String checkbox(boolean checked) {
            return checked ? "( X )" : "(   )";
        }

        private String defaultObservation(String value) {
            return value == null || value.isBlank() ? "Ninguna" : value;
        }

        private String defaultAcademicTutorRole(String value) {
            return value == null || value.isBlank()
                    ? "DOCENTE TUTOR DE PRÁCTICAS"
                    : value;
        }

        private void writeLabelValue(String label, String value, float x, float baseline) throws IOException {
            writeText(label, boldFont, HEADER_SIZE, x, baseline);
            writeText(nullSafeText(value), regularFont, HEADER_SIZE, x + textWidth(label, boldFont, HEADER_SIZE), baseline);
        }

        private void writeCenteredCell(String text, PDFont font, float fontSize, float x, float bottom, float cellWidth, float cellHeight) throws IOException {
            List<String> lines = wrap(text, font, fontSize, cellWidth - 6F);
            float blockHeight = lines.size() * (fontSize + 1F);
            float baseline = bottom + ((cellHeight + blockHeight) / 2F) - fontSize;
            for (String line : lines) {
                float lineWidth = textWidth(line, font, fontSize);
                writeText(line, font, fontSize, x + ((cellWidth - lineWidth) / 2F), baseline);
                baseline -= fontSize + 1F;
            }
        }

        private void writeCenteredText(String text, PDFont font, float fontSize, float x, float baseline, float maxWidth) throws IOException {
            List<String> lines = wrap(text, font, fontSize, maxWidth);
            float currentY = baseline;
            for (String line : lines) {
                float lineWidth = textWidth(line, font, fontSize);
                writeText(line, font, fontSize, x + ((maxWidth - lineWidth) / 2F), currentY);
                currentY -= fontSize + 2F;
            }
        }

        private void writeLines(List<String> lines, PDFont font, float fontSize, float x, float baseline, float leading) throws IOException {
            float currentY = baseline;
            for (String line : lines) {
                writeText(line, font, fontSize, x, currentY);
                currentY -= leading;
            }
        }

        private List<String> wrap(String text, PDFont font, float fontSize, float maxWidth) throws IOException {
            List<String> lines = new ArrayList<>();
            String normalized = nullSafeText(text).replace("\r\n", "\n").replace('\r', '\n');
            for (String paragraph : normalized.split("\n", -1)) {
                String[] words = paragraph.trim().split("\\s+");
                String current = "";
                for (String word : words) {
                    if (word.isBlank()) {
                        continue;
                    }
                    if (textWidth(word, font, fontSize) > maxWidth) {
                        if (!current.isBlank()) {
                            lines.add(current);
                            current = "";
                        }
                        lines.addAll(splitLongWord(word, font, fontSize, maxWidth));
                        continue;
                    }
                    String candidate = current.isBlank() ? word : current + " " + word;
                    if (textWidth(candidate, font, fontSize) <= maxWidth) {
                        current = candidate;
                    } else {
                        if (!current.isBlank()) {
                            lines.add(current);
                        }
                        current = word;
                    }
                }
                if (!current.isBlank()) {
                    lines.add(current);
                }
            }
            return lines.isEmpty() ? List.of("") : lines;
        }

        private List<String> splitLongWord(String word, PDFont font, float fontSize, float maxWidth) throws IOException {
            List<String> chunks = new ArrayList<>();
            StringBuilder current = new StringBuilder();
            for (char character : word.toCharArray()) {
                String candidate = current.toString() + character;
                if (!current.isEmpty() && textWidth(candidate, font, fontSize) > maxWidth) {
                    chunks.add(current.toString());
                    current = new StringBuilder();
                }
                current.append(character);
            }
            if (!current.isEmpty()) {
                chunks.add(current.toString());
            }
            return chunks;
        }

        private String formatDate(LocalDate date) {
            return date == null ? "" : DateTimeFormatter.ofPattern("dd/MM/yyyy").format(date);
        }

        private String formatTime(LocalTime time) {
            return time == null ? "" : DateTimeFormatter.ofPattern("HH':'mm").format(time);
        }

        private String formatFollowUpMinutes(Integer totalMinutes) {
            if (totalMinutes == null) {
                return "";
            }
            int hours = totalMinutes / 60;
            int minutes = totalMinutes % 60;
            if (minutes == 0) {
                return hours + (hours == 1 ? " Hora" : " Horas");
            }
            return String.format("%02dh:%02d", hours, minutes);
        }

        private String nullSafeText(String value) {
            return value == null ? "" : safeText(value);
        }

        private void drawCell(float x, float yPosition, float cellWidth, float cellHeight) throws IOException {
            contentStream.setStrokingColor(Color.BLACK);
            contentStream.setLineWidth(0.8F);
            contentStream.addRect(x, yPosition, cellWidth, cellHeight);
            contentStream.stroke();
        }

        private void drawLine(float x1, float y1, float x2, float y2) throws IOException {
            contentStream.setStrokingColor(Color.BLACK);
            contentStream.setLineWidth(0.8F);
            contentStream.moveTo(x1, y1);
            contentStream.lineTo(x2, y2);
            contentStream.stroke();
        }

        private void drawFilledRect(float x, float yPosition, float rectWidth, float rectHeight, Color fill) throws IOException {
            contentStream.setNonStrokingColor(fill);
            contentStream.addRect(x, yPosition, rectWidth, rectHeight);
            contentStream.fill();
            contentStream.setNonStrokingColor(Color.BLACK);
        }

        private void writeText(String text, PDFont font, float fontSize, float x, float baseline) throws IOException {
            writeText(text, font, fontSize, x, baseline, Color.BLACK);
        }

        private void writeText(String text, PDFont font, float fontSize, float x, float baseline, Color color) throws IOException {
            if (text == null || text.isBlank()) {
                return;
            }
            contentStream.beginText();
            contentStream.setNonStrokingColor(color);
            contentStream.setFont(font, fontSize);
            contentStream.newLineAtOffset(x, baseline);
            contentStream.showText(safeText(text));
            contentStream.endText();
            contentStream.setNonStrokingColor(Color.BLACK);
        }

        private float textWidth(String text, PDFont font, float fontSize) throws IOException {
            return font.getStringWidth(safeText(text)) / 1000F * fontSize;
        }
    }

    private class ActivityEvaluationPdfWriter {

        private static final float LEFT = 70F;
        private static final float RIGHT = 70F;
        private static final float TOP = 42F;
        private static final float BOTTOM = 38F;
        private static final float HEADER_SIZE = 11F;
        private static final float NORMAL_SIZE = 8.2F;
        private static final float SMALL_SIZE = 7.4F;
        private static final float ROW_LEADING = 9.4F;
        private static final Color HEADER_GRAY = new Color(128, 128, 128);

        private final PDDocument document;
        private final PDFont regularFont;
        private final PDFont boldFont;
        private PDPageContentStream contentStream;
        private PDPage page;
        private float width;
        private float height;
        private float y;

        ActivityEvaluationPdfWriter(PDDocument document) throws IOException {

            this.document = document;
            this.regularFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            this.boldFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            addPage();
        }

        void write(PdfActivityEvaluation evaluation) throws IOException {

            writePageHeader();
            writeDocumentHeader(evaluation);
            writeEvaluationTable(evaluation);
            writeSignature(evaluation);
        }

        private void writePageHeader() throws IOException {
            landscapeHeader(document, contentStream, width, height);
            y = height - 110F;
        }

        private void writeDocumentHeader(PdfActivityEvaluation evaluation) throws IOException {
            y = landscapeDocumentHeader(contentStream, width, height, "EVALUACIÓN DE ACTIVIDADES\nREALIZADAS",
                    evaluation.educationalInstitutionName(), evaluation.practiceType(), evaluation.studentFullName(),
                    evaluation.studentIdentification(), evaluation.cycle(), evaluation.academicPeriod(), evaluation.developmentMode());
        }

        private void writeEvaluationTable(PdfActivityEvaluation evaluation) throws IOException {

            float[] columns = {28F, 532F, 66F, 66F, 66F};
            fitColumns(columns, width - LEFT - RIGHT);
            drawTableHeader(columns);

            List<PdfActivityEvaluationAspect> generalAspects = aspectsByType(evaluation, "GENERAL");
            List<PdfActivityEvaluationAspect> specificAspects = aspectsByType(evaluation, "ESPECIFICO");

            drawSectionRow(columns, "Aspectos Generales");
            drawAspectRows(columns, generalAspects);
            drawSectionRow(columns, "Aspectos Especificos");
            drawAspectRows(columns, specificAspects);
            drawAccreditationRows(columns, evaluation);
        }

        private void drawTableHeader(float[] columns) throws IOException {

            float tableWidth = tableWidth(columns);
            float x = LEFT;
            float topHeight = 14F;
            float headerHeight = 22F;

            drawCell(LEFT, y - topHeight - headerHeight, columns[0] + columns[1], topHeight + headerHeight);
            drawCell(LEFT + columns[0] + columns[1], y - topHeight, columns[2] + columns[3] + columns[4], topHeight);
            writeCenteredText("ASPECTOS EVALUADOS", boldFont, HEADER_SIZE, LEFT, y - 22F, columns[0] + columns[1]);
            writeCenteredText("NIVELES", regularFont, HEADER_SIZE, LEFT + columns[0] + columns[1], y - 10F, columns[2] + columns[3] + columns[4]);

            x = LEFT + columns[0] + columns[1];
            drawCell(x, y - topHeight - headerHeight, columns[2], headerHeight);
            drawCell(x + columns[2], y - topHeight - headerHeight, columns[3], headerHeight);
            drawCell(x + columns[2] + columns[3], y - topHeight - headerHeight, columns[4], headerHeight);
            writeCenteredText("Alto\n(3)", regularFont, NORMAL_SIZE, x, y - topHeight - 8F, columns[2]);
            writeCenteredText("Medio\n(2)", regularFont, NORMAL_SIZE, x + columns[2], y - topHeight - 8F, columns[3]);
            writeCenteredText("Bajo\n(1)", regularFont, NORMAL_SIZE, x + columns[2] + columns[3], y - topHeight - 8F, columns[4]);

            y -= topHeight + headerHeight;
        }

        private void drawSectionRow(float[] columns, String title) throws IOException {

            ensureTableSpace(15F, columns);
            drawCell(LEFT, y - 15F, tableWidth(columns), 15F);
            writeText(title, boldFont, HEADER_SIZE - 1F, LEFT + 4F, y - 10F);
            y -= 15F;
        }

        private void drawAspectRows(
                float[] columns,
                List<PdfActivityEvaluationAspect> aspects) throws IOException {

            if (aspects.isEmpty()) {
                drawAspectRow(columns, 1, "Sin aspectos registrados", null, null);
                return;
            }

            int index = 1;
            for (PdfActivityEvaluationAspect aspect : aspects) {
                drawAspectRow(columns, index, aspect.item(), aspect.level(), aspect.score());
                index++;
            }
        }

        private void drawAspectRow(
                float[] columns,
                int number,
                String item,
                String level,
                Integer score) throws IOException {

            List<String> itemLines = wrap(item, regularFont, NORMAL_SIZE, columns[1] - 8F);
            float rowHeight = Math.max(12F, itemLines.size() * ROW_LEADING + 5F);
            ensureTableSpace(rowHeight, columns);

            float bottom = y - rowHeight;
            float x = LEFT;
            for (float column : columns) {
                drawCell(x, bottom, column, rowHeight);
                x += column;
            }

            float centerBaseline = bottom + ((rowHeight - NORMAL_SIZE) / 2F) + 1F;
            writeCenteredText(String.valueOf(number), regularFont, NORMAL_SIZE, LEFT, centerBaseline, columns[0]);
            writeLines(itemLines, regularFont, NORMAL_SIZE, LEFT + columns[0] + 4F, y - 9F, ROW_LEADING);
            writeScore(columns, bottom, rowHeight, level, score);
            y = bottom;
        }

        private void drawAccreditationRows(
                float[] columns,
                PdfActivityEvaluation evaluation) throws IOException {

            float tableWidth = tableWidth(columns);
            ensureTableSpace(30F, columns);
            drawCell(LEFT, y - 15F, tableWidth, 15F);
            writeText("Evaluación y Acreditación", boldFont, HEADER_SIZE - 1F, LEFT + 4F, y - 10F);
            y -= 15F;

            float leftWidth = tableWidth / 2F;
            drawCell(LEFT, y - 15F, leftWidth, 15F);
            drawCell(LEFT + leftWidth, y - 15F, leftWidth, 15F);
            writeLabelValue("Número de horas cumplidas: ", formatHours(evaluation.hoursCompleted()), LEFT + 4F, y - 10F);
            writeLabelValue("Porcentaje de actividades cumplidas: ", formatPercentage(evaluation.activitiesCompletionPercentage()), LEFT + leftWidth + 4F, y - 10F);
            y -= 15F;
        }

        private void writeSignature(PdfActivityEvaluation evaluation) throws IOException {

            if (y < BOTTOM + 120F) {
                addPage();
                writePageHeader();
            }

            y -= 26F;
            writeLabelValue("Fecha: ", formatDate(evaluation.evaluationDate()), LEFT, y);
            y -= 10F;

            float boxWidth = 374F;
            float boxHeight = 78F;
            float boxBottom = y - boxHeight;
            drawCell(LEFT, boxBottom, boxWidth, boxHeight);
            writeText("f.)", regularFont, NORMAL_SIZE, LEFT + 6F, boxBottom + 43F);
            drawLine(LEFT, boxBottom + 39F, LEFT + boxWidth, boxBottom + 39F);
            writeCenteredText(evaluation.academicTutorName(), regularFont, NORMAL_SIZE + 1F, LEFT, boxBottom + 28F, boxWidth);
            writeCenteredText(defaultAcademicTutorRole(evaluation.academicTutorRole()), boldFont, NORMAL_SIZE, LEFT, boxBottom + 16F, boxWidth);
            writeCenteredText("TUTOR ACADÉMICO DE LA CPCEI-UNL", boldFont, NORMAL_SIZE, LEFT, boxBottom + 4F, boxWidth);
        }

        private void ensureTableSpace(float needed, float[] columns) throws IOException {

            if (y - needed >= BOTTOM + 88F) {
                return;
            }

            addPage();
            writePageHeader();
            drawTableHeader(columns);
        }

        private void addPage() throws IOException {
            if (contentStream != null) {
                contentStream.close();
            }

            page = new PDPage(new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()));
            document.addPage(page);
            contentStream = new PDPageContentStream(document, page);
            width = page.getMediaBox().getWidth();
            height = page.getMediaBox().getHeight();
            y = height - TOP;
        }

        private void close() throws IOException {
            if (contentStream != null) {
                contentStream.close();
                contentStream = null;
            }
        }

        private List<PdfActivityEvaluationAspect> aspectsByType(
                PdfActivityEvaluation evaluation,
                String expected) {

            if (evaluation.aspects() == null) {
                return List.of();
            }

            return evaluation.aspects()
                    .stream()
                    .filter(aspect -> aspect.aspectType() != null
                            && aspect.aspectType().equalsIgnoreCase(expected))
                    .toList();
        }

        private boolean isPracticeType(PdfActivityEvaluation evaluation, String expected) {
            return evaluation.practiceType() != null
                    && evaluation.practiceType().equalsIgnoreCase(expected);
        }

        private boolean isMode(PdfActivityEvaluation evaluation, String expected) {
            return evaluation.developmentMode() != null
                    && evaluation.developmentMode().equalsIgnoreCase(expected);
        }

        private String checkbox(boolean checked) {
            return checked ? "( X )" : "(   )";
        }

        private String defaultAcademicTutorRole(String value) {
            return value == null || value.isBlank()
                    ? "DOCENTE TUTOR DE PRÁCTICAS"
                    : value;
        }

        private String formatDate(LocalDate date) {
            return date == null ? "" : DateTimeFormatter.ofPattern("dd/MM/yyyy").format(date);
        }

        private String formatHours(Integer hours) {
            if (hours == null) {
                return "";
            }
            return hours + (hours == 1 ? " Hora" : " Horas");
        }

        private String formatPercentage(BigDecimal percentage) {
            if (percentage == null) {
                return "";
            }
            return percentage.stripTrailingZeros().toPlainString() + "%";
        }

        private void writeScore(
                float[] columns,
                float bottom,
                float rowHeight,
                String level,
                Integer score) throws IOException {

            int value = score != null ? score : scoreFromLevel(level);
            if (value < 1 || value > 3) {
                return;
            }

            int levelColumnIndex = switch (value) {
                case 3 -> 2;
                case 2 -> 3;
                default -> 4;
            };

            float x = LEFT;
            for (int index = 0; index < levelColumnIndex; index++) {
                x += columns[index];
            }

            float centerBaseline = bottom + ((rowHeight - NORMAL_SIZE) / 2F) + 1F;
            writeCenteredText(String.valueOf(value), regularFont, NORMAL_SIZE, x, centerBaseline, columns[levelColumnIndex]);
        }

        private int scoreFromLevel(String level) {
            if (level == null) {
                return 0;
            }
            if (level.equalsIgnoreCase("ALTO")) {
                return 3;
            }
            if (level.equalsIgnoreCase("MEDIO")) {
                return 2;
            }
            if (level.equalsIgnoreCase("BAJO")) {
                return 1;
            }
            return 0;
        }

        private float tableWidth(float[] columns) {
            float total = 0F;
            for (float column : columns) {
                total += column;
            }
            return total;
        }

        private void writeLabelValue(String label, String value, float x, float baseline) throws IOException {
            writeText(label, boldFont, HEADER_SIZE, x, baseline);
            writeText(nullSafeText(value), regularFont, HEADER_SIZE, x + textWidth(label, boldFont, HEADER_SIZE), baseline);
        }

        private void writeCenteredText(String text, PDFont font, float fontSize, float x, float baseline, float maxWidth) throws IOException {
            List<String> lines = wrap(text, font, fontSize, maxWidth - 6F);
            float currentY = baseline;
            for (String line : lines) {
                float lineWidth = textWidth(line, font, fontSize);
                writeText(line, font, fontSize, x + ((maxWidth - lineWidth) / 2F), currentY);
                currentY -= fontSize + 2F;
            }
        }

        private void writeLines(List<String> lines, PDFont font, float fontSize, float x, float baseline, float leading) throws IOException {
            float currentY = baseline;
            for (String line : lines) {
                writeText(line, font, fontSize, x, currentY);
                currentY -= leading;
            }
        }

        private List<String> wrap(String text, PDFont font, float fontSize, float maxWidth) throws IOException {
            List<String> lines = new ArrayList<>();
            String normalized = nullSafeText(text).replace("\r\n", "\n").replace('\r', '\n');
            for (String paragraph : normalized.split("\n", -1)) {
                String[] words = paragraph.trim().split("\\s+");
                String current = "";
                for (String word : words) {
                    if (word.isBlank()) {
                        continue;
                    }
                    if (textWidth(word, font, fontSize) > maxWidth) {
                        if (!current.isBlank()) {
                            lines.add(current);
                            current = "";
                        }
                        lines.addAll(splitLongWord(word, font, fontSize, maxWidth));
                        continue;
                    }
                    String candidate = current.isBlank() ? word : current + " " + word;
                    if (textWidth(candidate, font, fontSize) <= maxWidth) {
                        current = candidate;
                    } else {
                        if (!current.isBlank()) {
                            lines.add(current);
                        }
                        current = word;
                    }
                }
                if (!current.isBlank()) {
                    lines.add(current);
                }
            }
            return lines.isEmpty() ? List.of("") : lines;
        }

        private List<String> splitLongWord(String word, PDFont font, float fontSize, float maxWidth) throws IOException {
            List<String> chunks = new ArrayList<>();
            StringBuilder current = new StringBuilder();
            for (char character : word.toCharArray()) {
                String candidate = current.toString() + character;
                if (!current.isEmpty() && textWidth(candidate, font, fontSize) > maxWidth) {
                    chunks.add(current.toString());
                    current = new StringBuilder();
                }
                current.append(character);
            }
            if (!current.isEmpty()) {
                chunks.add(current.toString());
            }
            return chunks;
        }

        private String nullSafeText(String value) {
            return value == null ? "" : safeText(value);
        }

        private void drawCell(float x, float yPosition, float cellWidth, float cellHeight) throws IOException {
            contentStream.setStrokingColor(Color.BLACK);
            contentStream.setLineWidth(0.8F);
            contentStream.addRect(x, yPosition, cellWidth, cellHeight);
            contentStream.stroke();
        }

        private void drawLine(float x1, float y1, float x2, float y2) throws IOException {
            contentStream.setStrokingColor(Color.BLACK);
            contentStream.setLineWidth(0.8F);
            contentStream.moveTo(x1, y1);
            contentStream.lineTo(x2, y2);
            contentStream.stroke();
        }

        private void drawFilledRect(float x, float yPosition, float rectWidth, float rectHeight, Color fill) throws IOException {
            contentStream.setNonStrokingColor(fill);
            contentStream.addRect(x, yPosition, rectWidth, rectHeight);
            contentStream.fill();
            contentStream.setNonStrokingColor(Color.BLACK);
        }

        private void writeText(String text, PDFont font, float fontSize, float x, float baseline) throws IOException {
            writeText(text, font, fontSize, x, baseline, Color.BLACK);
        }

        private void writeText(String text, PDFont font, float fontSize, float x, float baseline, Color color) throws IOException {
            if (text == null || text.isBlank()) {
                return;
            }
            contentStream.beginText();
            contentStream.setNonStrokingColor(color);
            contentStream.setFont(font, fontSize);
            contentStream.newLineAtOffset(x, baseline);
            contentStream.showText(safeText(text));
            contentStream.endText();
            contentStream.setNonStrokingColor(Color.BLACK);
        }

        private float textWidth(String text, PDFont font, float fontSize) throws IOException {
            return font.getStringWidth(safeText(text)) / 1000F * fontSize;
        }
    }

    private class PdfWriter {

        private final PDDocument document;
        private final PDFont regularFont;
        private final PDFont boldFont;
        private PDPageContentStream contentStream;
        private boolean universityBranding;
        private boolean pageNumbers;
        private byte[] letterhead;
        private int subsectionNumber;
        private int pageNumber;
        private float y;

        PdfWriter(
                PDDocument document,
                PDFont regularFont,
                PDFont boldFont) throws IOException {

            this.document = document;
            this.regularFont = regularFont;
            this.boldFont = boldFont;
            addPage();
        }

        void writeCover(
                String title,
                List<PdfSection> sections) throws IOException {

            drawUniversityLogo(document, contentStream,
                    (pageWidth() - 225F) / 2F, pageHeight() - 126F, 225F, 76F);
            y = pageHeight() - 180F;
            writeCentered("FACULTAD DE LA EDUCACIÓN, EL ARTE Y LA", boldFont, 18F, 21F);
            writeCentered("COMUNICACIÓN", boldFont, 18F, 21F);
            y = pageHeight() - 242F;
            writeCentered("CARRERA DE PEDAGOGÍA DE LAS CIENCIAS", boldFont, 18F, 21F);
            writeCentered("EXPERIMENTALES", boldFont, 18F, 21F);
            y = pageHeight() - 322F;
            writeCentered("TITULACIÓN EN PEDAGOGÍA DE LA INFORMÁTICA", boldFont, 15F, 20F);
            y = pageHeight() - 348F;
            writeCoverTitleBox(coverTitleLines(title));
            y = pageHeight() - 540F;
            coverField("Estudiante", coverValue(sections, "Estudiante"));
            coverField("Tutor Académico", coverValue(sections, "Tutor Academico"));
            coverField("Ciclo", firstPresentCoverValue(sections, "Ciclo", "Curso"));
            coverField("Período Académico", coverValue(sections, "Periodo Academico"));

            addPage();
        }

        private void writeLetterhead() throws IOException {
            if (letterhead != null) {
                drawImage(document, contentStream, letterhead, MARGIN, pageHeight() - 112F,
                        pageWidth() - MARGIN * 2F, 96F);
                y = pageHeight() - 140F;
            }
        }

        void writeInstitutionalFinalHeader() throws IOException {

            y = pageHeight() - (letterhead == null ? 76F : 142F);
            writeCentered(
                    "INFORME FINAL DE PRÁCTICAS PREPROFESIONALES",
                    boldFont,
                    14F,
                    22F);
            y -= 12F;
        }

        boolean writeSection(
                PdfSection section,
                int sectionNumber) throws IOException {

            List<PdfField> fields = section.fields() == null
                    ? List.of()
                    : section.fields()
                            .stream()
                            .filter(field -> hasText(field.value()))
                            .toList();
            List<PdfWeekTable> tables = visibleWeekTables(section);
            List<PdfScheduleMatrix> matrices = visibleScheduleMatrices(section);

            if (fields.isEmpty() && tables.isEmpty() && matrices.isEmpty()) {
                return false;
            }

            if (isLegalizationSection(section.title())) {
                writeLegalizationSection(fields, sectionNumber);
                return true;
            }

            if (isElaborationApprovalSection(section.title())) {
                writeElaborationApprovalSection(fields, sectionNumber);
                return true;
            }

            if (isInstitutionalSignatureSection(section.title())) {
                writeInstitutionalSignatureSection(fields);
                return true;
            }

            if (!matrices.isEmpty() && pageWidth() < pageHeight()) addPage(true);
            if (matrices.isEmpty() && pageWidth() > pageHeight()) addPage();
            sectionBreak();
            ensureSpace(tables.isEmpty() ? SECTION_LEADING + BODY_LEADING * 4F : 150F);
            writeWrapped(
                    sectionNumber + ". " + safeText(section.title()).toUpperCase(),
                    boldFont,
                    SECTION_SIZE,
                    SECTION_LEADING);

            subsectionNumber = 0;
            for (PdfField field : fields) {
                writeField(field);
            }

            for (PdfWeekTable table : tables) {
                writeWeekTable(table);
            }

            for (PdfScheduleMatrix matrix : matrices) {
                writeScheduleMatrix(matrix);
            }

            return true;
        }

        private void writeLegalizationSection(
                List<PdfField> fields,
                int sectionNumber) throws IOException {

            String tutorName = fieldValue(fields, "Tutor Academico");
            String role = fieldValue(fields, "Rol");

            sectionBreak();
            ensureSpace(180F);
            writeWrapped(
                    sectionNumber + ". LEGALIZACIÓN",
                    boldFont,
                    SECTION_SIZE,
                    SECTION_LEADING);
            verticalSpace(70F);

            float x = MARGIN + 28F;
            for (String line : wrapText(tutorName, regularFont, BODY_SIZE, pageWidth() - x - MARGIN)) {
                ensureSpace(18F);
                writeTextAt(line, regularFont, BODY_SIZE, Color.BLACK, x, y);
                y -= 18F;
            }
            for (String line : wrapText(role, boldFont, BODY_SIZE, pageWidth() - x - MARGIN)) {
                ensureSpace(18F);
                writeTextAt(line, boldFont, BODY_SIZE, Color.BLACK, x, y);
                y -= 18F;
            }
        }

        private void writeElaborationApprovalSection(
                List<PdfField> fields,
                int sectionNumber) throws IOException {

            String studentName = fieldValue(fields, "Estudiante");
            String tutorName = fieldValue(fields, "Tutor Academico");
            String role = fieldValue(fields, "Rol");

            sectionBreak();
            ensureSpace(380F);
            writeWrapped(
                    sectionNumber + ". ELABORACIÓN Y APROBACIÓN",
                    boldFont,
                    SECTION_SIZE,
                    SECTION_LEADING);
            verticalSpace(8F);
            writeSignatureBar("Elaboración");
            verticalSpace(76F);
            writeCentered(studentName, regularFont, BODY_SIZE, 18F);
            writeCentered("ESTUDIANTE", boldFont, BODY_SIZE, 18F);
            verticalSpace(6F);
            writeSignatureBar("Aprobación");
            verticalSpace(76F);
            writeCentered(tutorName, regularFont, BODY_SIZE, 18F);

            for (String line : splitLines(role)) {
                writeCentered(line, boldFont, BODY_SIZE, 18F);
            }
        }

        private void writeInstitutionalSignatureSection(List<PdfField> fields) throws IOException {

            String tutorName = fieldValue(fields, "Tutor Institucional");
            String role = fieldValue(fields, "Rol");

            sectionBreak();
            ensureSpace(180F);
            verticalSpace(42F);

            float x = MARGIN + 34F;
            String date = fieldValue(fields, "Fecha");
            writeTextAt("Fecha: " + (hasText(date) ? date : "............................."), regularFont, BODY_SIZE, Color.BLACK, x, y);
            y -= 72F;
            writeTextAt("f)", regularFont, BODY_SIZE, Color.BLACK, x, y);
            y -= 28F;
            writeTextAt(tutorName, regularFont, BODY_SIZE, Color.BLACK, x, y);
            y -= 24F;
            writeTextAt(role, regularFont, BODY_SIZE, Color.BLACK, x, y);
        }

        private void writeSignatureBar(String label) throws IOException {

            float width = 378F;
            float height = 22F;
            float x = (pageWidth() - width) / 2F;
            float bottom = y - height;

            writeCenteredLinesInCell(List.of(label), boldFont, BODY_SIZE, Color.BLACK, x, bottom, width, height);
            y = bottom;
        }

        private String fieldValue(List<PdfField> fields, String label) {

            return fields.stream()
                    .filter(field -> normalizedKey(field.label()).equals(normalizedKey(label)))
                    .map(PdfField::value)
                    .filter(PdfExportService.this::hasText)
                    .findFirst()
                    .orElse("");
        }

        private List<String> splitLines(String value) {

            return safeText(value).lines()
                    .map(String::trim)
                    .filter(line -> !line.isBlank())
                    .toList();
        }

        void writeTitle(String title) throws IOException {

            writeWrapped(
                    safeText(title),
                    boldFont,
                    TITLE_SIZE,
                    TITLE_LEADING);
            y -= 8F;
        }

        void writeSection(PdfSection section) throws IOException {

            List<PdfField> fields = section.fields() == null
                    ? List.of()
                    : section.fields()
                            .stream()
                            .filter(field -> hasText(field.value()))
                            .toList();
            List<PdfWeekTable> tables = visibleWeekTables(section);
            List<PdfScheduleMatrix> matrices = visibleScheduleMatrices(section);

            if (fields.isEmpty() && tables.isEmpty() && matrices.isEmpty()) {
                return;
            }

            sectionBreak();
            ensureSpace(SECTION_LEADING + BODY_LEADING);
            writeWrapped(
                    safeText(section.title()),
                    boldFont,
                    SECTION_SIZE,
                    SECTION_LEADING);

            subsectionNumber = 0;
            for (PdfField field : fields) {
                writeField(field);
            }

            for (PdfWeekTable table : tables) {
                writeWeekTable(table);
            }

            for (PdfScheduleMatrix matrix : matrices) {
                writeScheduleMatrix(matrix);
            }
        }

        void writeField(PdfField field) throws IOException {
            String label = field.label();
            if (label.equals("@subheading") || label.equals("@heading")) {
                ensureSpace(70F);
                y -= 8F;
                String heading = label.equals("@subheading") ? (char) ('A' + subsectionNumber++) + ".  " + field.value() : field.value();
                writeTextAt(heading, boldFont, BODY_SIZE, Color.BLACK, MARGIN + 21F, y);
                y -= BODY_LEADING;
                return;
            }
            if (label.equals("@paragraph")) {
                writeParagraph(field.value(), false);
                return;
            }
            if (label.equals("@bullet")) {
                writeParagraph(field.value(), true);
                return;
            }
            if (List.of("Objetivo General", "Misión", "Visión", "Legal", "Humano", "Tecnológicos", "Físicos").contains(label)) {
                ensureSpace(70F);
                writeWrapped(label, boldFont, BODY_SIZE, BODY_LEADING);
                writeParagraph(field.value(), false);
                return;
            }
            if (label.equals("Estudiante")) label = "Nombres y Apellidos";
            if (normalizedKey(label).equals("tutor academico")) label = "Tutor Académico";
            if (normalizedKey(label).equals("periodo academico")) label = "Período Académico";
            List<String> lines = wrapText(label + ": " + field.value(), regularFont, BODY_SIZE, pageWidth() - MARGIN * 2F - 56F);
            ensureSpace(Math.min(lines.size(), 2) * BODY_LEADING);
            for (int i = 0; i < lines.size(); i++) {
                ensureSpace(BODY_LEADING);
                String line = lines.get(i);
                if (i == 0 && line.startsWith(label + ":")) {
                    String prefix = label + ": ";
                    writeTextAt(prefix, boldFont, BODY_SIZE, Color.BLACK, MARGIN + 56F, y);
                    writeTextAt(line.substring(Math.min(prefix.length(), line.length())), regularFont, BODY_SIZE,
                            Color.BLACK, MARGIN + 56F + textWidth(prefix, boldFont, BODY_SIZE), y);
                } else {
                    writeTextAt(line, regularFont, BODY_SIZE, Color.BLACK, MARGIN + 56F, y);
                }
                y -= BODY_LEADING;
            }
        }

        private void writeParagraph(String value, boolean bullet) throws IOException {
            float inset = bullet ? 24F : 0F;
            for (String paragraph : safeText(value).split("\n")) {
                if (paragraph.isBlank()) { verticalSpace(10F); continue; }
                List<String> lines = wrapText(paragraph, regularFont, BODY_SIZE, pageWidth() - MARGIN * 2F - inset);
                for (int i = 0; i < lines.size(); i++) {
                    ensureSpace(BODY_LEADING);
                    if (bullet && i == 0) writeTextAt("•", regularFont, BODY_SIZE, Color.BLACK, MARGIN + 6F, y);
                    String line = lines.get(i);
                    contentStream.beginText();
                    contentStream.setFont(regularFont, BODY_SIZE);
                    contentStream.newLineAtOffset(MARGIN + inset, y);
                    long spaces = line.chars().filter(c -> c == ' ').count();
                    float gap = i < lines.size() - 1 && spaces > 0
                            ? (pageWidth() - MARGIN * 2F - inset - textWidth(line, regularFont, BODY_SIZE)) / spaces : 0F;
                    contentStream.setWordSpacing(gap);
                    contentStream.showText(line);
                    contentStream.setWordSpacing(0F);
                    contentStream.endText();
                    y -= BODY_LEADING;
                }
            }
            y -= 6F;
        }

        void writeWeekTable(PdfWeekTable table) throws IOException {

            if (table == null || table.rows() == null || table.rows().isEmpty()) {
                return;
            }

            verticalSpace(TABLE_GAP_BEFORE);

            for (PdfWeekRow row : table.rows()) {
                writeWeekRow(row);
            }

            verticalSpace(TABLE_GAP_AFTER);
        }

        private void writeWeekRow(PdfWeekRow row) throws IOException {
            float tableWidth = pageWidth() - MARGIN * 2F;
            float weekWidth = 92F, detailWidth = tableWidth - weekWidth;
            List<String> dates = wrapText(safeText(row.dateRange()), boldFont, TABLE_SIZE, detailWidth - 16F);
            List<String> body = weekBodyLines(row.bodyText(), detailWidth - 58F);
            float headerHeight = Math.max(38F, 14F + dates.size() * TABLE_LEADING);
            int offset = 0;
            do {
                ensureSpace(headerHeight + TABLE_LEADING * 2F + 24F);
                int capacity = Math.max(1, (int) ((y - PAGE_BOTTOM - headerHeight - 24F) / TABLE_LEADING));
                int count = Math.min(capacity, body.size() - offset);
                float bodyHeight = Math.max(58F, count * TABLE_LEADING + 24F);
                float headerBottom = y - headerHeight, bottom = headerBottom - bodyHeight;
                drawCellBorder(MARGIN, headerBottom, weekWidth, headerHeight);
                drawCellBorder(MARGIN + weekWidth, headerBottom, detailWidth, headerHeight);
                drawCellBorder(MARGIN, bottom, weekWidth, bodyHeight);
                drawCellBorder(MARGIN + weekWidth, bottom, detailWidth, bodyHeight);
                writeCenteredLinesInCell(wrapText(row.weekLabel(), boldFont, TABLE_SIZE, weekWidth - 12F),
                        boldFont, TABLE_SIZE, Color.BLACK, MARGIN, headerBottom, weekWidth, headerHeight);
                writeCenteredLinesInCell(dates, boldFont, TABLE_SIZE, Color.BLACK,
                        MARGIN + weekWidth, headerBottom, detailWidth, headerHeight);
                writeCenteredLinesInCell(List.of(safeText(row.bodyLabel())), regularFont, TABLE_SIZE, Color.BLACK,
                        MARGIN, bottom, weekWidth, bodyHeight);
                writeBulletLines(body.subList(offset, offset + count), MARGIN + weekWidth + 8F, headerBottom - 20F);
                offset += count;
                y = bottom - 12F;
                if (offset < body.size()) addPage();
            } while (offset < body.size());
        }

        private void writeScheduleMatrix(PdfScheduleMatrix matrix) throws IOException {
            List<PdfScheduleColumn> allColumns = scheduleColumns(matrix.rows());
            List<PdfScheduleActivity> activities = scheduleActivities(matrix.rows(), allColumns);
            if (allColumns.isEmpty() || activities.isEmpty()) return;
            for (int columnOffset = 0; columnOffset < allColumns.size(); columnOffset += 18) {
                if (columnOffset > 0) addPage(true);
                List<PdfScheduleColumn> columns = allColumns.subList(columnOffset, Math.min(columnOffset + 18, allColumns.size()));
                float tableWidth = pageWidth() - MARGIN * 2F;
                float activityWidth = Math.max(340F, tableWidth - columns.size() * 24F);
                float weekWidth = (tableWidth - activityWidth) / columns.size();
                y = drawScheduleHeader(matrix, columns, tableWidth, activityWidth, weekWidth, 20F, 20F, 20F, y);
                for (int index = 0; index < activities.size(); index++) {
                    PdfScheduleActivity activity = activities.get(index);
                    List<String> lines = wrapText(activity.text(), regularFont, MATRIX_SIZE, activityWidth - 6F);
                    int offset = 0;
                    do {
                        if (y - 22F < PAGE_BOTTOM) {
                            addPage(true);
                            y = drawScheduleHeader(matrix, columns, tableWidth, activityWidth, weekWidth, 20F, 20F, 20F, y);
                        }
                        int capacity = Math.max(1, (int) ((y - PAGE_BOTTOM - 12F) / (MATRIX_SIZE + 1F)));
                        int count = Math.min(capacity, lines.size() - offset);
                        float height = Math.max(22F, count * (MATRIX_SIZE + 1F) + 12F);
                        drawScheduleRow(new PdfScheduleActivity(String.join("\n", lines.subList(offset, offset + count)), activity.weekKey()),
                                columns, activityWidth, weekWidth, height, y, index);
                        offset += count;
                        y -= height;
                        if (offset < lines.size()) {
                            addPage(true);
                            y = drawScheduleHeader(matrix, columns, tableWidth, activityWidth, weekWidth, 20F, 20F, 20F, y);
                        }
                    } while (offset < lines.size());
                }
            }
            y -= TABLE_GAP_AFTER;
        }

        private float drawScheduleHeader(
                PdfScheduleMatrix matrix,
                List<PdfScheduleColumn> columns,
                float tableWidth,
                float activityColumnWidth,
                float weekColumnWidth,
                float titleHeight,
                float monthHeight,
                float weekHeight,
                float top) throws IOException {

            float titleBottom = top - titleHeight;
            drawFilledCell(MARGIN, titleBottom, tableWidth, titleHeight, TABLE_HEADER_GRAY);
            drawCellBorder(MARGIN, titleBottom, tableWidth, titleHeight);
            writeCenteredLinesInCell(
                    wrapText(safeText(matrix.title()), boldFont, MATRIX_SIZE + 1.3F, tableWidth - 8F),
                    boldFont,
                    MATRIX_SIZE + 1.3F,
                    Color.WHITE,
                    MARGIN,
                    titleBottom,
                    tableWidth,
                    titleHeight);

            float monthBottom = titleBottom - monthHeight;
            drawFilledCell(MARGIN, monthBottom, activityColumnWidth, monthHeight, TABLE_HEADER_GRAY);
            drawCellBorder(MARGIN, monthBottom, activityColumnWidth, monthHeight);
            writeCenteredLinesInCell(List.of("Actividades"), boldFont, MATRIX_SIZE, Color.WHITE, MARGIN, monthBottom, activityColumnWidth, monthHeight);

            float x = MARGIN + activityColumnWidth;

            for (PdfScheduleMonthGroup group : scheduleMonthGroups(columns)) {
                float width = group.span() * weekColumnWidth;
                drawFilledCell(x, monthBottom, width, monthHeight, TABLE_HEADER_GRAY);
                drawCellBorder(x, monthBottom, width, monthHeight);
                writeCenteredLinesInCell(List.of(group.label()), boldFont, MATRIX_SIZE, Color.WHITE, x, monthBottom, width, monthHeight);
                x += width;
            }

            float weekBottom = monthBottom - weekHeight;
            drawFilledCell(MARGIN, weekBottom, activityColumnWidth, weekHeight, TABLE_HEADER_GRAY);
            drawCellBorder(MARGIN, weekBottom, activityColumnWidth, weekHeight);
            writeCenteredLinesInCell(List.of("Semanas"), boldFont, MATRIX_SIZE, Color.WHITE, MARGIN, weekBottom, activityColumnWidth, weekHeight);

            x = MARGIN + activityColumnWidth;

            for (PdfScheduleColumn column : columns) {
                drawFilledCell(x, weekBottom, weekColumnWidth, weekHeight, TABLE_HEADER_GRAY);
                drawCellBorder(x, weekBottom, weekColumnWidth, weekHeight);
                writeCenteredLinesInCell(List.of(String.valueOf(column.weekNumber())), boldFont, MATRIX_SIZE, Color.WHITE, x, weekBottom, weekColumnWidth, weekHeight);
                x += weekColumnWidth;
            }

            return weekBottom;
        }

        private void drawScheduleRow(
                PdfScheduleActivity activity,
                List<PdfScheduleColumn> columns,
                float activityColumnWidth,
                float weekColumnWidth,
                float rowHeight,
                float top,
                int rowIndex) throws IOException {

            float bottom = top - rowHeight;
            drawCellBorder(MARGIN, bottom, activityColumnWidth, rowHeight);
            writeTopWrappedInCell(
                    activity.text(),
                    regularFont,
                    MATRIX_SIZE,
                    MARGIN + 3F,
                    bottom + 4F,
                    activityColumnWidth - 6F,
                    rowHeight - 6F);

            float x = MARGIN + activityColumnWidth;

            for (PdfScheduleColumn column : columns) {
                if (column.key().equals(activity.weekKey())) {
                    drawFilledCell(
                            x + 0.8F,
                            bottom + 0.8F,
                            weekColumnWidth - 1.6F,
                            rowHeight - 1.6F,
                            scheduleColor(rowIndex));
                }

                drawCellBorder(x, bottom, weekColumnWidth, rowHeight);
                x += weekColumnWidth;
            }
        }

        private void writeTopWrappedInCell(
                String text,
                PDFont font,
                float fontSize,
                float x,
                float bottom,
                float width,
                float height) throws IOException {

            List<String> lines = wrapText(safeText(text), font, fontSize, width);
            float baseline = bottom + height - fontSize;
            int maxLines = Math.max(1, (int) Math.floor(height / (fontSize + 1F)));

            for (int index = 0; index < Math.min(lines.size(), maxLines); index++) {
                writeTextAt(lines.get(index), font, fontSize, Color.BLACK, x, baseline);
                baseline -= fontSize + 1F;
            }
        }

        private List<PdfScheduleColumn> scheduleColumns(List<PdfScheduleRow> rows) {

            List<PdfScheduleColumn> columns = new ArrayList<>();

            (rows == null ? List.<PdfScheduleRow>of() : rows)
                    .stream()
                    .filter(row -> row.weekNumber() != null)
                    .sorted((first, second) -> Integer.compare(first.weekNumber(), second.weekNumber()))
                    .forEach(row -> {
                        String key = scheduleColumnKey(row);
                        boolean exists = columns.stream().anyMatch(column -> column.key().equals(key));

                        if (!exists) {
                            columns.add(new PdfScheduleColumn(
                                    key,
                                    row.weekNumber(),
                                    scheduleMonthLabel(row.startDate(), row.endDate())));
                        }
                    });

            return columns;
        }

        private List<PdfScheduleActivity> scheduleActivities(
                List<PdfScheduleRow> rows,
                List<PdfScheduleColumn> columns) {

            List<PdfScheduleActivity> activities = new ArrayList<>();

            for (PdfScheduleRow row : rows == null ? List.<PdfScheduleRow>of() : rows) {
                String key = scheduleColumnKey(row);

                if (columns.stream().noneMatch(column -> column.key().equals(key))) {
                    continue;
                }

                List<String> items = splitBulletItems(row.activityText());

                if (items.isEmpty() && hasScheduleReference(row)) {
                    items = List.of("Actividades no especificadas");
                }

                for (String item : items) {
                    activities.add(new PdfScheduleActivity(item, key));
                }
            }

            return activities;
        }

        private String scheduleColumnKey(PdfScheduleRow row) {

            return String.valueOf(row.weekNumber());
        }

        private List<PdfScheduleMonthGroup> scheduleMonthGroups(List<PdfScheduleColumn> columns) {

            List<PdfScheduleMonthGroup> groups = new ArrayList<>();

            for (PdfScheduleColumn column : columns) {
                if (!groups.isEmpty()
                        && groups.get(groups.size() - 1).label().equals(column.monthLabel())) {
                    PdfScheduleMonthGroup last = groups.remove(groups.size() - 1);
                    groups.add(new PdfScheduleMonthGroup(last.label(), last.span() + 1));
                    continue;
                }

                groups.add(new PdfScheduleMonthGroup(column.monthLabel(), 1));
            }

            return groups;
        }

        private String scheduleMonthLabel(
                LocalDate startDate,
                LocalDate endDate) {

            LocalDate date = startDate != null ? startDate : endDate;

            if (date == null) {
                return "Mes";
            }

            String label = date.getMonth()
                    .getDisplayName(java.time.format.TextStyle.FULL, new Locale("es", "ES"));

            return label.substring(0, 1).toUpperCase(new Locale("es", "ES"))
                    + label.substring(1).toLowerCase(new Locale("es", "ES"));
        }

        private Color scheduleColor(int index) {

            Color[] colors = {
                    new Color(0, 240, 16),
                    new Color(255, 226, 106),
                    new Color(106, 169, 216),
                    new Color(127, 107, 176),
                    new Color(143, 189, 123),
                    new Color(221, 102, 102),
                    new Color(241, 168, 91),
                    new Color(61, 127, 31),
                    new Color(138, 79, 8),
                    new Color(240, 0, 223)
            };

            return colors[index % colors.length];
        }

        private List<String> weekBodyLines(
                String text,
                float maxWidth) throws IOException {

            List<String> result = new ArrayList<>();
            List<String> items = splitBulletItems(text);

            if (items.isEmpty()) {
                return List.of("");
            }

            for (String item : items) {
                List<String> wrapped = wrapText(
                        safeText(item),
                        regularFont,
                        TABLE_SIZE,
                        maxWidth);

                if (result.isEmpty()) {
                    result.add("BULLET " + wrapped.get(0));
                } else {
                    result.add("");
                    result.add("BULLET " + wrapped.get(0));
                }

                for (int index = 1; index < wrapped.size(); index++) {
                    result.add("CONT " + wrapped.get(index));
                }
            }

            return result;
        }

        private List<String> splitBulletItems(String text) {

            String normalized = safeText(text)
                    .replace("\r\n", "\n")
                    .replace('\r', '\n')
                    .replace("•", "\n")
                    .replaceAll("(?m)^\\s*[-*]\\s+", "");

            List<String> items = new ArrayList<>();

            for (String line : normalized.split("\\n+")) {
                String trimmed = line.trim();

                if (!trimmed.isBlank()) {
                    items.add(trimmed);
                }
            }

            return items;
        }

        private void writeBulletLines(
                List<String> lines,
                float x,
                float firstBaseline) throws IOException {

            float currentY = firstBaseline;

            for (String line : lines) {
                if (line == null || line.isBlank()) {
                    currentY -= TABLE_LEADING;
                    continue;
                }

                boolean bullet = line.startsWith("BULLET ");
                String text = line.replaceFirst("^(BULLET|CONT)\\s+", "");
                float textX = bullet ? x + 26F : x + 42F;

                if (bullet) {
                    writeTextAt("•", boldFont, TABLE_SIZE + 2F, Color.BLACK, x + 8F, currentY);
                }

                writeTextAt(text, regularFont, TABLE_SIZE, Color.BLACK, textX, currentY);
                currentY -= TABLE_LEADING;
            }
        }

        private void drawFilledCell(
                float x,
                float yPosition,
                float width,
                float height,
                Color fill) throws IOException {

            contentStream.setNonStrokingColor(fill);
            contentStream.addRect(x, yPosition, width, height);
            contentStream.fill();
            contentStream.setNonStrokingColor(Color.BLACK);
        }

        private void drawCellBorder(
                float x,
                float yPosition,
                float width,
                float height) throws IOException {

            contentStream.setStrokingColor(TABLE_BORDER);
            contentStream.setLineWidth(0.75F);
            contentStream.addRect(x, yPosition, width, height);
            contentStream.stroke();
        }

        private void writeTextAt(
                String text,
                PDFont font,
                float fontSize,
                Color color,
                float x,
                float baseline) throws IOException {

            if (text == null || text.isBlank()) {
                return;
            }

            contentStream.beginText();
            contentStream.setNonStrokingColor(color);
            contentStream.setFont(font, fontSize);
            contentStream.newLineAtOffset(x, baseline);
            contentStream.showText(safeText(text));
            contentStream.endText();
            contentStream.setNonStrokingColor(Color.BLACK);
        }

        private void writeCenteredLinesInCell(
                List<String> lines,
                PDFont font,
                float fontSize,
                Color color,
                float x,
                float yPosition,
                float width,
                float height) throws IOException {

            float blockHeight = lines.size() * TABLE_LEADING;
            float baseline = yPosition + ((height + blockHeight) / 2F) - TABLE_LEADING + 3F;

            for (String line : lines) {
                float lineWidth = textWidth(line, font, fontSize);
                writeTextAt(
                        line,
                        font,
                        fontSize,
                        color,
                        x + ((width - lineWidth) / 2F),
                        baseline);
                baseline -= TABLE_LEADING;
            }
        }

        void close() throws IOException {

            if (contentStream != null) {
                contentStream.close();
                contentStream = null;
            }
        }

        private void addPage() throws IOException {
            addPage(false);
        }

        private void addPage(boolean landscape) throws IOException {

            if (contentStream != null) {
                contentStream.close();
            }

            PDPage page = new PDPage(landscape
                    ? new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()) : PDRectangle.A4);
            document.addPage(page);
            contentStream = new PDPageContentStream(document, page);
            pageNumber++;
            if (pageNumber > 1 && pageNumbers) {
                writePageNumber(page);
            }
            y = page.getMediaBox().getHeight() - MARGIN;
            if (universityBranding && pageNumber > 1) {
                if (landscape) landscapeHeader(document, contentStream, pageWidth(), pageHeight());
                else writeAcademicHeader();
                y = pageHeight() - 112F;
            }
            writeLetterhead();
        }

        private void writeAcademicHeader() throws IOException {
            drawUniversityLogo(document, contentStream, MARGIN + 8F, pageHeight() - 66F, 100F, 34F);
            float x = pageWidth() - 240F;
            fittedText(contentStream, "Carrera de", new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 7F, x, pageHeight() - 44F, 155F);
            fittedText(contentStream, "Pedagogía de las Ciencias Experimentales", new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 7F, x, pageHeight() - 53F, 155F);
            fittedText(contentStream, "Titulación Pedagogía de la Informática", new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 7F, x, pageHeight() - 62F, 155F);
            contentStream.setStrokingColor(Color.BLACK);
            contentStream.setLineWidth(0.7F);
            contentStream.moveTo(x - 3F, pageHeight() - 34F);
            contentStream.lineTo(x - 3F, pageHeight() - 69F);
            contentStream.moveTo(MARGIN, pageHeight() - 78F);
            contentStream.lineTo(pageWidth() - MARGIN, pageHeight() - 78F);
            contentStream.stroke();
        }

        private void ensureSpace(float requiredHeight) throws IOException {

            if (y - requiredHeight < PAGE_BOTTOM) {
                addPage();
            }
        }

        private void sectionBreak() throws IOException {

            float pageTop = pageHeight() - (letterhead != null ? 140F : universityBranding && pageNumber > 1 ? 112F : MARGIN);

            if (y < pageTop - 1F) {
                verticalSpace(SECTION_GAP);
            }
        }

        private void verticalSpace(float space) throws IOException {

            if (y - space < PAGE_BOTTOM) {
                addPage();
                return;
            }

            y -= space;
        }

        private void writeWrapped(
                String text,
                PDFont font,
                float fontSize,
                float leading) throws IOException {

            float maxWidth = pageWidth() - (MARGIN * 2);
            List<String> lines = wrapText(
                    text,
                    font,
                    fontSize,
                    maxWidth);

            for (String line : lines) {
                ensureSpace(leading);
                writeLine(
                        line,
                        font,
                        fontSize,
                        leading);
            }
        }

        private void writeLine(
                String line,
                PDFont font,
                float fontSize,
                float leading) throws IOException {

            if (line == null || line.isBlank()) {
                y -= leading;
                return;
            }

            contentStream.beginText();
            contentStream.setFont(font, fontSize);
            contentStream.newLineAtOffset(MARGIN, y);
            contentStream.showText(line);
            contentStream.endText();
            y -= leading;
        }

        private void writeCentered(
                String text,
                PDFont font,
                float fontSize,
                float leading) throws IOException {

            float maxWidth = pageWidth() - (MARGIN * 2);
            List<String> lines = wrapText(
                    text,
                    font,
                    fontSize,
                    maxWidth);

            for (String line : lines) {
                ensureSpace(leading);
                float textWidth = textWidth(line, font, fontSize);
                float x = (pageWidth() - textWidth) / 2F;

                contentStream.beginText();
                contentStream.setFont(font, fontSize);
                contentStream.newLineAtOffset(x, y);
                contentStream.showText(line);
                contentStream.endText();
                y -= leading;
            }
        }

        private void coverField(String label, String value) throws IOException {
            if (!hasText(value)) return;
            PDFont labelFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDFont valueFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            float available = pageWidth() - MARGIN * 2F;
            String heading = label + ":";
            writeTextAt(heading, labelFont, 15F, Color.BLACK,
                    (pageWidth() - textWidth(heading, labelFont, 15F)) / 2F, y);
            float size = Math.max(10F, Math.min(14F, 14F * available / textWidth(safeText(value), valueFont, 14F)));
            List<String> lines = wrapText(value, valueFont, size, available);
            float baseline = y - 28F;
            for (String line : lines) {
                writeTextAt(line, valueFont, size, Color.BLACK,
                        (pageWidth() - textWidth(line, valueFont, size)) / 2F, baseline);
                baseline -= 17F;
            }
            y -= 58F;
        }

        private void writeCoverTitleBox(List<String> lines) throws IOException {
            float boxWidth = pageWidth() - 170F;
            float boxHeight = lines.size() == 3 ? 114F : 122F;
            float x = (pageWidth() - boxWidth) / 2F;
            drawFilledCell(x, y - boxHeight, boxWidth, boxHeight, TABLE_HEADER_GRAY);
            float leading = lines.size() == 3 ? 37F : 25F;
            for (int i = 0; i < lines.size(); i++) {
                String line = lines.get(i);
                float fontSize = Math.min(22F, 22F * (boxWidth - 12F) / textWidth(line, boldFont, 22F));
                writeTextAt(line, boldFont, fontSize, Color.WHITE,
                        (pageWidth() - textWidth(line, boldFont, fontSize)) / 2F, y - 20F - i * leading);
            }
            y -= boxHeight;
        }

        private float pageWidth() {
            return contentStream == null || document.getNumberOfPages() == 0
                    ? PDRectangle.A4.getWidth()
                    : document.getPage(document.getNumberOfPages() - 1).getMediaBox().getWidth();
        }

        private float pageHeight() {
            return contentStream == null || document.getNumberOfPages() == 0
                    ? PDRectangle.A4.getHeight()
                    : document.getPage(document.getNumberOfPages() - 1).getMediaBox().getHeight();
        }

        private void writePageNumber(PDPage page) throws IOException {

            String text = String.valueOf(pageNumber);
            float textWidth = textWidth(text, regularFont, BODY_SIZE);
            float x = (page.getMediaBox().getWidth() - textWidth) / 2F;
            float top = 36F;

            contentStream.beginText();
            contentStream.setFont(regularFont, BODY_SIZE);
            contentStream.newLineAtOffset(x, top);
            contentStream.showText(text);
            contentStream.endText();
        }

        private List<String> wrapText(
                String text,
                PDFont font,
                float fontSize,
                float maxWidth) throws IOException {

            List<String> lines = new ArrayList<>();
            String normalizedText = safeText(text).replace("\r\n", "\n");

            for (String paragraph : normalizedText.split("\n", -1)) {
                wrapParagraph(
                        paragraph,
                        font,
                        fontSize,
                        maxWidth,
                        lines);
            }

            return lines.isEmpty() ? List.of("") : lines;
        }

        private void wrapParagraph(
                String paragraph,
                PDFont font,
                float fontSize,
                float maxWidth,
                List<String> lines) throws IOException {

            String[] words = paragraph.trim().split("\\s+");
            String currentLine = "";

            for (String word : words) {
                if (word.isBlank()) {
                    continue;
                }

                String candidate = currentLine.isBlank()
                        ? word
                        : currentLine + " " + word;

                if (textWidth(candidate, font, fontSize) <= maxWidth) {
                    currentLine = candidate;
                    continue;
                }

                if (!currentLine.isBlank()) {
                    lines.add(currentLine);
                }

                currentLine = word;
            }

            lines.add(currentLine);
        }

        private float textWidth(
                String text,
                PDFont font,
                float fontSize) throws IOException {

            return font.getStringWidth(safeText(text)) / 1000F * fontSize;
        }
    }

    private String academicTitle(String title) {

        if (title == null) {
            return "DOCUMENTO DE PRÁCTICA";
        }

        String normalized = title.replaceAll("\\s+#\\d+\\s*$", "").trim();

        if (normalized.equalsIgnoreCase("Plan de actividades")) {
            return "PLAN DE ACTIVIDADES";
        }

        if (normalized.equalsIgnoreCase("Informe de actividades cumplidas")
                || normalized.equalsIgnoreCase("Informe de practicas")) {
            return "INFORME DE ACTIVIDADES CUMPLIDAS";
        }

        if (isInstitutionalFinalReport(normalized)
                || normalized.equalsIgnoreCase("Informe final")) {
            return "INFORME FINAL DE PRÁCTICAS PREPROFESIONALES";
        }

        return normalized.toUpperCase();
    }

    private boolean isInstitutionalFinalReport(String title) {

        if (title == null) {
            return false;
        }

        String normalized = title.replaceAll("\\s+#\\d+\\s*$", "").trim();
        return normalized.equalsIgnoreCase("Informe final de practicas preprofesionales")
                || normalized.equalsIgnoreCase("Informe final de prácticas preprofesionales");
    }

    private boolean isLegalizationSection(String title) {

        return normalizedKey(title).equals("legalizacion");
    }

    private boolean isElaborationApprovalSection(String title) {

        return normalizedKey(title).equals("elaboracion y aprobacion");
    }

    private boolean isInstitutionalSignatureSection(String title) {

        return normalizedKey(title).equals("firma tutor institucional");
    }

    private String normalizedKey(String value) {

        if (value == null) {
            return "";
        }

        return value.trim()
                .toLowerCase(Locale.ROOT)
                .replace('á', 'a')
                .replace('é', 'e')
                .replace('í', 'i')
                .replace('ó', 'o')
                .replace('ú', 'u');
    }

    private List<String> coverTitleLines(String title) {

        String academicTitle = academicTitle(title);

        if (academicTitle.equals("PLAN DE ACTIVIDADES")) {
            return List.of(
                    "PLAN DE ACTIVIDADES",
                    "PRÁCTICA PREPROFESIONAL",
                    "COMPONENTE LABORAL");
        }

        if (academicTitle.equals("INFORME DE ACTIVIDADES CUMPLIDAS")) {
            return List.of(
                    "INFORME DE ACTIVIDADES",
                    "CUMPLIDAS",
                    "PRÁCTICAS PREPROFESIONALES",
                    "COMPONENTE LABORAL");
        }

        return List.of(academicTitle);
    }

    private String firstPresentCoverValue(
            List<PdfSection> sections,
            String... labels) {

        for (String label : labels) {
            String value = coverValue(sections, label);
            if (hasText(value)) {
                return value;
            }
        }

        return "";
    }

    private String coverValue(
            List<PdfSection> sections,
            String label) {

        if (sections == null) {
            return "";
        }

        return sections.stream()
                .flatMap(section -> section.fields() == null
                        ? List.<PdfField>of().stream()
                        : section.fields().stream())
                .filter(field -> normalizedKey(label).equals(normalizedKey(field.label())))
                .map(PdfField::value)
                .filter(this::hasText)
                .findFirst()
                .orElse("");
    }

    private List<PdfWeekTable> visibleWeekTables(PdfSection section) {

        if (section.weekTables() == null) {
            return List.of();
        }

        return section.weekTables()
                .stream()
                .filter(table -> table != null
                        && table.rows() != null
                        && table.rows()
                                .stream()
                                .anyMatch(row -> hasText(row.bodyText())))
                .toList();
    }

    private List<PdfScheduleMatrix> visibleScheduleMatrices(PdfSection section) {

        if (section.scheduleMatrices() == null) {
            return List.of();
        }

        return section.scheduleMatrices()
                .stream()
                .filter(matrix -> matrix != null
                        && matrix.rows() != null
                        && matrix.rows()
                                .stream()
                                .anyMatch(this::hasVisibleScheduleRow))
                .toList();
    }

    private boolean hasVisibleScheduleRow(PdfScheduleRow row) {

        return row != null
                && (hasText(row.activityText()) || hasScheduleReference(row));
    }

    private boolean hasScheduleReference(PdfScheduleRow row) {

        return row != null
                && (row.weekNumber() != null
                        || row.startDate() != null
                        || row.endDate() != null);
    }

    private boolean hasText(String value) {

        return value != null && !value.isBlank();
    }
}
