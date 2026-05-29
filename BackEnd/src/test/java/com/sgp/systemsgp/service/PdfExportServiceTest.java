package com.sgp.systemsgp.service;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PdfExportServiceTest {

    private final PdfExportService pdfExportService = new PdfExportService();

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
    }
}
