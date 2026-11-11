/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CompletedActivityRecordPdfWriter.java
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente CompletedActivityRecordPdfWriter del backend del SGP.
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

final class CompletedActivityRecordPdfWriter extends PdfLayoutSupport {

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

    void close() throws IOException {

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
