/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PdfWriter.java
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente PdfWriter del backend del SGP.
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

final class PdfWriter extends PdfLayoutSupport {

    private final PDDocument document;
    private final PDFont regularFont;
    private final PDFont boldFont;
    private PDPageContentStream contentStream;
    boolean universityBranding;
    boolean pageNumbers;
    byte[] letterhead;
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

    void writeLetterhead() throws IOException {
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
                .filter(this::hasText)
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
