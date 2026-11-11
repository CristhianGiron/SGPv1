/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          ActivityEvaluationPdfWriter.java
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente ActivityEvaluationPdfWriter del backend del SGP.
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

final class ActivityEvaluationPdfWriter extends PdfLayoutSupport {

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

    void close() throws IOException {
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
