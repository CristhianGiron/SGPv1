/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeFollowUpReportPdfWriter.java
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente PracticeFollowUpReportPdfWriter del backend del SGP.
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

import com.sgp.systemsgp.service.pdf.PdfExportService.*;

final class PracticeFollowUpReportPdfWriter extends PdfLayoutSupport {

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

    void close() throws IOException {
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
