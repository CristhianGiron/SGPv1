/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PdfLayoutSupport.java
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente PdfLayoutSupport del backend del SGP.
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

abstract class PdfLayoutSupport {
    protected static final float MARGIN = 85F;
    protected static final float PAGE_BOTTOM = 72F;
    protected static final float BODY_SIZE = 12F;
    protected static final float SECTION_SIZE = 12F;
    protected static final float TITLE_SIZE = 12F;
    protected static final float COVER_TITLE_SIZE = 14F;
    protected static final float TABLE_SIZE = 12F;
    protected static final float MATRIX_SIZE = 7.2F;
    protected static final float TABLE_LEADING = 18F;
    protected static final float BODY_LEADING = 21F;
    protected static final float SECTION_LEADING = 24F;
    protected static final float TITLE_LEADING = 24F;
    protected static final float COVER_LEADING = 18F;
    protected static final float SECTION_GAP = 14F;
    protected static final float TABLE_GAP_BEFORE = 8F;
    protected static final float TABLE_GAP_AFTER = 18F;
    protected static final Color TABLE_HEADER_GRAY = new Color(128, 128, 128);
    protected static final Color TABLE_BORDER = Color.BLACK;
    protected static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");
    protected static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm");
    protected static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    protected void drawUniversityLogo(
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

    protected void drawImage(PDDocument document, PDPageContentStream stream, byte[] bytes,
            float x, float y, float boxWidth, float boxHeight) throws IOException {
        PDImageXObject image = PDImageXObject.createFromByteArray(document, bytes, "document-image");
        float scale = Math.min(boxWidth / image.getWidth(), boxHeight / image.getHeight());
        float width = image.getWidth() * scale, height = image.getHeight() * scale;
        stream.drawImage(image, x + (boxWidth - width) / 2F, y + (boxHeight - height) / 2F, width, height);
    }

    protected void fittedText(PDPageContentStream stream, String text, PDFont font, float size,
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

    protected void landscapeHeader(PDDocument document, PDPageContentStream stream, float width, float height) throws IOException {
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

    protected float landscapeDocumentHeader(PDPageContentStream stream, float width, float height,
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

    protected void landscapeLabel(PDPageContentStream stream, String label, String value,
            float x, float y, float width) throws IOException {
        PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        float labelWidth = bold.getStringWidth(label) / 1000F * 10.5F;
        fittedText(stream, label, bold, 10.5F, x, y, width);
        fittedText(stream, value, regular, 10.5F, x + labelWidth, y, Math.max(20F, width - labelWidth));
    }

    protected void fitColumns(float[] columns, float available) {
        float sum = 0F;
        for (float column : columns) sum += column;
        for (int i = 0; i < columns.length; i++) columns[i] *= available / sum;
    }

    protected String formatValue(Object value) {

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

    protected String formatAcademicRange(
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

    protected String formatAcademicDate(LocalDate date) {

        if (date == null) {
            return "";
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
                "EEEE d 'DE' MMMM 'DE' yyyy",
                new Locale("es", "ES"));

        return formatter.format(date).toUpperCase(Locale.forLanguageTag("es-EC"));
    }

    protected String safeText(String value) {

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

    protected record PdfScheduleColumn(String key, Integer weekNumber, String monthLabel) {
    }

    protected record PdfScheduleActivity(String text, String weekKey) {
    }

    protected record PdfScheduleMonthGroup(String label, int span) {
    }

    protected String academicTitle(String title) {

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

    protected boolean isInstitutionalFinalReport(String title) {

        if (title == null) {
            return false;
        }

        String normalized = title.replaceAll("\\s+#\\d+\\s*$", "").trim();
        return normalized.equalsIgnoreCase("Informe final de practicas preprofesionales")
                || normalized.equalsIgnoreCase("Informe final de prácticas preprofesionales");
    }

    protected boolean isLegalizationSection(String title) {

        return normalizedKey(title).equals("legalizacion");
    }

    protected boolean isElaborationApprovalSection(String title) {

        return normalizedKey(title).equals("elaboracion y aprobacion");
    }

    protected boolean isInstitutionalSignatureSection(String title) {

        return normalizedKey(title).equals("firma tutor institucional");
    }

    protected String normalizedKey(String value) {

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

    protected List<String> coverTitleLines(String title) {

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

    protected String firstPresentCoverValue(
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

    protected String coverValue(
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

    protected List<PdfWeekTable> visibleWeekTables(PdfSection section) {

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

    protected List<PdfScheduleMatrix> visibleScheduleMatrices(PdfSection section) {

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

    protected boolean hasVisibleScheduleRow(PdfScheduleRow row) {

        return row != null
                && (hasText(row.activityText()) || hasScheduleReference(row));
    }

    protected boolean hasScheduleReference(PdfScheduleRow row) {

        return row != null
                && (row.weekNumber() != null
                        || row.startDate() != null
                        || row.endDate() != null);
    }

    protected boolean hasText(String value) {

        return value != null && !value.isBlank();
    }
}
