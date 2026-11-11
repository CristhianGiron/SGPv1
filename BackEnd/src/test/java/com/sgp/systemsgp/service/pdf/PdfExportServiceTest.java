/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PdfExportServiceTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de los documentos PDF mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service.pdf;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgp.systemsgp.dto.activityplan.ActivityPlanScheduleWeekRequest;
import org.junit.jupiter.api.Test;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PdfExportServiceTest {

    private final PdfExportService pdfExportService = new PdfExportService();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void createPdfReturnsPdfBytes() {

        byte[] pdf = pdfExportService.createPdf(
                "Documento aprobado",
                List.of(pdfExportService.section(
                        "Datos",
                        List.of(pdfExportService.field("Estudiante", "Ana Perez")))));

        assertThat(pdf).isNotEmpty();
        assertThat(new String(
                pdf,
                0,
                4,
                StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    void createPdfRendersWeeklyTables() {

        byte[] pdf = pdfExportService.createPdf(
                "Plan de actividades #1",
                List.of(pdfExportService.sectionWithTables(
                        "Actividades por semana",
                        List.of(),
                        List.of(pdfExportService.weekTable(List.of(
                                pdfExportService.weekRow(
                                        1,
                                        LocalDate.of(2025, 10, 13),
                                        LocalDate.of(2025, 10, 17),
                                        "Actividad",
                                        "Presentacion con la directora.\nEntrevista al directivo.")))))));

        assertThat(pdf).isNotEmpty();
        assertThat(new String(
                pdf,
                0,
                4,
                StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    void createPdfRendersScheduleMatrix() {

        byte[] pdf = pdfExportService.createPdf(
                "Plan de actividades #1",
                List.of(pdfExportService.sectionWithScheduleMatrices(
                        "Cronograma de actividades",
                        List.of(),
                        List.of(pdfExportService.scheduleMatrix(
                                "CRONOGRAMA DE ACTIVIDADES PRACTICAS PARA EL DESARROLLO DEL PIS",
                                List.of(
                                        pdfExportService.scheduleRow(
                                                1,
                                                LocalDate.of(2025, 10, 13),
                                                LocalDate.of(2025, 10, 17),
                                                "Presentacion con la directora."),
                                        pdfExportService.scheduleRow(
                                                2,
                                                LocalDate.of(2025, 10, 20),
                                                LocalDate.of(2025, 10, 24),
                                                "Entrevista al directivo.")))))));

        assertThat(pdf).isNotEmpty();
        assertThat(new String(
                pdf,
                0,
                4,
                StandardCharsets.US_ASCII)).isEqualTo("%PDF");
        assertThat(pdfText(pdf))
                .contains("CRONOGRAMA DE ACTIVIDADES")
                .contains("CRONOGRAMA DE ACTIVIDADES PRACTICAS")
                .contains("Presentacion con la directora.")
                .contains("Entrevista al directivo.");
    }

    @Test
    void createPdfRendersScheduleMatrixWhenRowsHaveNoActivityText() {

        byte[] pdf = pdfExportService.createPdf(
                "Plan de actividades #1",
                List.of(pdfExportService.sectionWithScheduleMatrices(
                        "Cronograma de actividades",
                        List.of(),
                        List.of(pdfExportService.scheduleMatrix(
                                "CRONOGRAMA DE ACTIVIDADES PRACTICAS PARA EL DESARROLLO DEL PIS",
                                List.of(pdfExportService.scheduleRow(
                                        1,
                                        null,
                                        null,
                                        null)))))));

        assertThat(pdfText(pdf))
                .contains("CRONOGRAMA DE ACTIVIDADES")
                .contains("Actividades no especificadas");
    }

    @Test
    void scheduleWeekRequestAcceptsActivitiesAlias() throws Exception {

        ActivityPlanScheduleWeekRequest request = objectMapper.readValue(
                """
                {
                  "weekNumber": 1,
                  "activities": "Observacion de clase"
                }
                """,
                ActivityPlanScheduleWeekRequest.class);

        assertThat(request.getScheduledActivities())
                .isEqualTo("Observacion de clase");
    }

    @Test
    void spanishAccentsAndPunctuationSurvivePdfExportIncludingPastedCombiningMarks() {
        String original = "¡Sí! ¿Qué ocurrió? María Muñoz, Íñigo, pedagogía y lingüística: áéíóú ÁÉÍÓÚ ñ Ñ ü Ü. “Educación” — año 2026…";
        String pasted = java.text.Normalizer.normalize(original, java.text.Normalizer.Form.NFD);
        byte[] pdf = pdfExportService.createPdf("Plan de actividades", List.of(
                pdfExportService.section("Información general", List.of(pdfExportService.field("Estudiante", pasted))),
                pdfExportService.sectionWithTables("Actividades", List.of(), List.of(pdfExportService.weekTable(List.of(
                        pdfExportService.weekRow(1, LocalDate.of(2026, 11, 4), LocalDate.of(2026, 11, 7), "Actividad", pasted)))))));
        String text = pdfText(pdf).replaceAll("\\s+", " ");
        assertThat(text).contains("María Muñoz", "Íñigo", "pedagogía", "lingüística", "áéíóú", "ÁÉÍÓÚ", "ñ Ñ ü Ü", "¿Qué ocurrió?", "¡Sí!", "“Educación”", "— año 2026…", "MIÉRCOLES", "SÁBADO");
        assertThat(text).doesNotContain("Mu?oz", "ocurri?", "MIERCOLES", "SABADO");
    }

    @Test
    void spanishCharactersAlsoSurviveLandscapeTables() {
        String text = "Observación, evaluación, educación y acompañamiento: año, niño, pingüino. ¿Sí? ¡Qué bien!";
        byte[] pdf = pdfExportService.createCompletedActivityRecordPdf(new PdfExportService.PdfCompletedActivityRecord(
                "Institución de Educación Básica", "OBSERVACION", "María Muñoz", "1100000000", "Quinto", "noviembre 2026", "PRESENCIAL", 60,
                LocalDate.of(2026, 11, 4), "María Muñoz", "Íñigo Peñafiel", List.of(new PdfExportService.PdfCompletedActivityEntry(
                        LocalDate.of(2026, 11, 4), java.time.LocalTime.of(8, 0), java.time.LocalTime.of(9, 0), 60,
                        java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD), "https://ejemplo.test/evidencia"))));
        assertThat(pdfText(pdf).replaceAll("\\s+", " ")).contains("María Muñoz", "Íñigo Peñafiel", "Observación", "evaluación", "año, niño, pingüino.");
    }

    private String pdfText(byte[] pdf) {

        try (var document = Loader.loadPDF(pdf)) {
            return new PDFTextStripper().getText(document);
        } catch (IOException exception) {
            throw new AssertionError("No se pudo leer el texto del PDF", exception);
        }
    }
}
