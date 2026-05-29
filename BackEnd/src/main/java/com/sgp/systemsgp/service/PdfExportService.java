package com.sgp.systemsgp.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class PdfExportService {

    private static final float MARGIN = 72F;
    private static final float PAGE_BOTTOM = 72F;
    private static final float BODY_SIZE = 12F;
    private static final float SECTION_SIZE = 12F;
    private static final float TITLE_SIZE = 12F;
    private static final float COVER_TITLE_SIZE = 14F;
    private static final float TABLE_SIZE = 11F;
    private static final float MATRIX_SIZE = 7.2F;
    private static final float TABLE_LEADING = 15F;
    private static final float BODY_LEADING = 18F;
    private static final float SECTION_LEADING = 20F;
    private static final float TITLE_LEADING = 16F;
    private static final Color TABLE_HEADER_GRAY = new Color(128, 128, 128);
    private static final Color TABLE_BORDER = Color.BLACK;
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

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

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PdfWriter writer = new PdfWriter(
                    document,
                    new PDType1Font(Standard14Fonts.FontName.TIMES_ROMAN),
                    new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD));
            writer.writeCover(title, sections);

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

        return formatter.format(date)
                .replace("miércoles", "miercoles")
                .replace("sábado", "sabado")
                .toUpperCase(new Locale("es", "ES"));
    }

    private String safeText(String value) {

        if (value == null) {
            return "";
        }

        StringBuilder builder = new StringBuilder();

        for (char character : value.toCharArray()) {
            if (character == '\n' || character == '\r') {
                builder.append(character);
            } else if (character == '\u2022') {
                builder.append("- ");
            } else if (character == '\u2013' || character == '\u2014') {
                builder.append('-');
            } else if (character == '\u2018' || character == '\u2019') {
                builder.append('\'');
            } else if (character == '\u201C' || character == '\u201D') {
                builder.append('"');
            } else if (character == '\t' || character == '\u00A0') {
                builder.append(' ');
            } else if (character >= 32 && character <= 255) {
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

    private record PdfScheduleColumn(String key, Integer weekNumber, String monthLabel) {
    }

    private record PdfScheduleActivity(String text, String weekKey) {
    }

    private record PdfScheduleMonthGroup(String label, int span) {
    }

    private class PdfWriter {

        private final PDDocument document;
        private final PDFont regularFont;
        private final PDFont boldFont;
        private PDPageContentStream contentStream;
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

            y = PDRectangle.LETTER.getHeight() - 92F;
            writeCentered(
                    "FACULTAD DE LA EDUCACION, EL ARTE Y LA COMUNICACION",
                    boldFont,
                    TITLE_SIZE,
                    TITLE_LEADING);
            writeCentered(
                    "CARRERA DE PEDAGOGIA DE LAS CIENCIAS EXPERIMENTALES",
                    boldFont,
                    TITLE_SIZE,
                    TITLE_LEADING);
            writeCentered(
                    "TITULACION EN PEDAGOGIA DE LA INFORMATICA",
                    boldFont,
                    TITLE_SIZE,
                    TITLE_LEADING);

            y -= 52F;
            writeCentered(
                    safeText(academicTitle(title)),
                    boldFont,
                    COVER_TITLE_SIZE,
                    20F);
            writeCentered(
                    "PRACTICA PREPROFESIONAL COMPONENTE LABORAL",
                    boldFont,
                    TITLE_SIZE,
                    TITLE_LEADING);

            y -= 48F;
            coverField("Estudiante", coverValue(sections, "Estudiante"));
            coverField("Cedula", coverValue(sections, "Cedula"));
            coverField("Curso", coverValue(sections, "Curso"));
            coverField("Institucion", coverValue(sections, "Institucion"));

            String submittedAt = coverValue(sections, "Enviado");

            if (hasText(submittedAt)) {
                coverField("Fecha de envio", submittedAt);
            }

            addPage();
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

            ensureSpace(48F);
            y -= 4F;
            writeWrapped(
                    sectionNumber + ". " + safeText(section.title()).toUpperCase(),
                    boldFont,
                    SECTION_SIZE,
                    SECTION_LEADING);

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

            ensureSpace(36F);
            y -= 4F;
            writeWrapped(
                    safeText(section.title()),
                    boldFont,
                    SECTION_SIZE,
                    SECTION_LEADING);

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

            ensureSpace(42F);
            writeWrapped(
                    safeText(field.label()),
                    boldFont,
                    BODY_SIZE,
                    BODY_LEADING);
            writeWrapped(
                    safeText(field.value()),
                    regularFont,
                    BODY_SIZE,
                    BODY_LEADING);
            y -= 6F;
        }

        void writeWeekTable(PdfWeekTable table) throws IOException {

            if (table == null || table.rows() == null || table.rows().isEmpty()) {
                return;
            }

            y -= 6F;

            for (PdfWeekRow row : table.rows()) {
                writeWeekRow(row);
            }

            y -= 4F;
        }

        private void writeWeekRow(PdfWeekRow row) throws IOException {

            float tableWidth = PDRectangle.LETTER.getWidth() - (MARGIN * 2);
            float weekColumnWidth = 108F;
            float detailColumnWidth = tableWidth - weekColumnWidth;
            float headerPadding = 8F;
            float bodyPadding = 12F;
            float bodyTextWidth = detailColumnWidth - (bodyPadding * 2) - 16F;
            List<String> dateLines = wrapText(
                    safeText(row.dateRange()),
                    boldFont,
                    TABLE_SIZE,
                    detailColumnWidth - (headerPadding * 2));
            List<String> bodyLines = weekBodyLines(
                    row.bodyText(),
                    bodyTextWidth);
            float headerHeight = Math.max(40F, 18F + (dateLines.size() * TABLE_LEADING));
            float bodyHeight = Math.max(86F, 26F + (bodyLines.size() * TABLE_LEADING));

            ensureSpace(headerHeight + bodyHeight + 8F);

            float top = y;
            float headerBottom = top - headerHeight;
            float bodyBottom = headerBottom - bodyHeight;

            drawFilledCell(MARGIN, headerBottom, weekColumnWidth, headerHeight, TABLE_HEADER_GRAY);
            drawFilledCell(MARGIN + weekColumnWidth, headerBottom, detailColumnWidth, headerHeight, TABLE_HEADER_GRAY);
            drawCellBorder(MARGIN, headerBottom, weekColumnWidth, headerHeight);
            drawCellBorder(MARGIN + weekColumnWidth, headerBottom, detailColumnWidth, headerHeight);
            drawCellBorder(MARGIN, bodyBottom, weekColumnWidth, bodyHeight);
            drawCellBorder(MARGIN + weekColumnWidth, bodyBottom, detailColumnWidth, bodyHeight);

            writeTextAt(
                    safeText(row.weekLabel()),
                    boldFont,
                    TABLE_SIZE,
                    Color.WHITE,
                    MARGIN + 8F,
                    headerBottom + (headerHeight / 2F) - 4F);
            writeCenteredLinesInCell(
                    dateLines,
                    boldFont,
                    TABLE_SIZE,
                    Color.WHITE,
                    MARGIN + weekColumnWidth,
                    headerBottom,
                    detailColumnWidth,
                    headerHeight);
            writeCenteredLinesInCell(
                    wrapText(safeText(row.bodyLabel()), boldFont, TABLE_SIZE, weekColumnWidth - 16F),
                    boldFont,
                    TABLE_SIZE,
                    Color.BLACK,
                    MARGIN,
                    bodyBottom,
                    weekColumnWidth,
                    bodyHeight);
            writeBulletLines(
                    bodyLines,
                    MARGIN + weekColumnWidth + bodyPadding,
                    headerBottom - bodyPadding - 2F);

            y = bodyBottom;
        }

        private void writeScheduleMatrix(PdfScheduleMatrix matrix) throws IOException {

            List<PdfScheduleColumn> columns = scheduleColumns(matrix.rows());
            List<PdfScheduleActivity> activities = scheduleActivities(matrix.rows(), columns);

            if (columns.isEmpty() || activities.isEmpty()) {
                return;
            }

            float tableWidth = PDRectangle.LETTER.getWidth() - (MARGIN * 2);
            float activityColumnWidth = Math.max(245F, tableWidth - (columns.size() * 22F));
            float weekColumnWidth = (tableWidth - activityColumnWidth) / columns.size();
            float titleHeight = 18F;
            float monthHeight = 18F;
            float weekHeight = 18F;
            float rowHeight = 24F;
            int rowIndex = 0;

            while (rowIndex < activities.size()) {
                ensureSpace(titleHeight + monthHeight + weekHeight + rowHeight + 8F);
                float top = y - 4F;
                float currentY = top;

                currentY = drawScheduleHeader(
                        matrix,
                        columns,
                        tableWidth,
                        activityColumnWidth,
                        weekColumnWidth,
                        titleHeight,
                        monthHeight,
                        weekHeight,
                        currentY);

                while (rowIndex < activities.size() && currentY - rowHeight >= PAGE_BOTTOM) {
                    drawScheduleRow(
                            activities.get(rowIndex),
                            columns,
                            activityColumnWidth,
                            weekColumnWidth,
                            rowHeight,
                            currentY,
                            rowIndex);
                    currentY -= rowHeight;
                    rowIndex++;
                }

                y = currentY - 4F;

                if (rowIndex < activities.size()) {
                    addPage();
                }
            }
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

                for (String item : splitBulletItems(row.activityText())) {
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

            if (contentStream != null) {
                contentStream.close();
            }

            PDPage page = new PDPage(PDRectangle.LETTER);
            document.addPage(page);
            contentStream = new PDPageContentStream(document, page);
            pageNumber++;
            writePageNumber(page);
            y = page.getMediaBox().getHeight() - MARGIN;
        }

        private void ensureSpace(float requiredHeight) throws IOException {

            if (y - requiredHeight < PAGE_BOTTOM) {
                addPage();
            }
        }

        private void writeWrapped(
                String text,
                PDFont font,
                float fontSize,
                float leading) throws IOException {

            float maxWidth = PDRectangle.LETTER.getWidth() - (MARGIN * 2);
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

            float maxWidth = PDRectangle.LETTER.getWidth() - (MARGIN * 2);
            List<String> lines = wrapText(
                    text,
                    font,
                    fontSize,
                    maxWidth);

            for (String line : lines) {
                ensureSpace(leading);
                float textWidth = textWidth(line, font, fontSize);
                float x = (PDRectangle.LETTER.getWidth() - textWidth) / 2F;

                contentStream.beginText();
                contentStream.setFont(font, fontSize);
                contentStream.newLineAtOffset(x, y);
                contentStream.showText(line);
                contentStream.endText();
                y -= leading;
            }
        }

        private void coverField(
                String label,
                String value) throws IOException {

            if (!hasText(value)) {
                return;
            }

            writeCentered(
                    label + ":",
                    boldFont,
                    BODY_SIZE,
                    TITLE_LEADING);
            writeCentered(
                    safeText(value),
                    regularFont,
                    BODY_SIZE,
                    TITLE_LEADING);
            y -= 8F;
        }

        private void writePageNumber(PDPage page) throws IOException {

            String text = String.valueOf(pageNumber);
            float textWidth = textWidth(text, regularFont, BODY_SIZE);
            float x = page.getMediaBox().getWidth() - MARGIN - textWidth;
            float top = page.getMediaBox().getHeight() - 42F;

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
            String normalizedText = text == null ? "" : text.replace("\r\n", "\n");

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

            return font.getStringWidth(text) / 1000F * fontSize;
        }
    }

    private String academicTitle(String title) {

        if (title == null) {
            return "DOCUMENTO DE PRACTICA";
        }

        String normalized = title.replaceAll("\\s+#\\d+\\s*$", "").trim();

        if (normalized.equalsIgnoreCase("Plan de actividades")) {
            return "PLAN DE ACTIVIDADES";
        }

        if (normalized.equalsIgnoreCase("Informe de practicas")) {
            return "INFORME DE PRACTICAS";
        }

        if (normalized.equalsIgnoreCase("Informe final")) {
            return "INFORME FINAL DE PRACTICAS";
        }

        return normalized.toUpperCase();
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
                .filter(field -> label.equalsIgnoreCase(field.label()))
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
                                .anyMatch(row -> hasText(row.activityText())))
                .toList();
    }

    private boolean hasText(String value) {

        return value != null && !value.isBlank();
    }
}
