/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PdfReferenceLayoutTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de los documentos PDF mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service.pdf;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PdfReferenceLayoutTest {
    private final PdfExportService pdf = new PdfExportService();
    private final LocalDate date = LocalDate.of(2026, 11, 4);

    @Test
    void sixReferenceDocumentsKeepTextInsideThePageAndEmbedTheirImages() throws Exception {
        byte[] image = letterhead();
        List<byte[]> documents = List.of(
                pdf.createPdf("Informe de actividades cumplidas", sections(false)),
                pdf.createPdf("Plan de actividades", sections(true)),
                pdf.createPdf("Informe final de prácticas preprofesionales", institutionalSections(), image),
                pdf.createActivityEvaluationPdf(new PdfExportService.PdfActivityEvaluation(
                        "Unidad Educativa de Ejemplo", "ELABORACION", "Estudiante de Ejemplo", "1100000000", "V",
                        "septiembre 2026 – febrero 2027", "PRESENCIAL", 80, BigDecimal.valueOf(100), date,
                        "Docente de Ejemplo", "DOCENTE DE LA ASIGNATURA DE DISEÑO CURRICULAR EN INFORMÁTICA", aspects())),
                pdf.createPracticeFollowUpReportPdf(new PdfExportService.PdfPracticeFollowUpReport(
                        "Unidad Educativa de Ejemplo", "ELABORACION", "Estudiante de Ejemplo", "1100000000", "V",
                        "septiembre 2026 – febrero 2027", "PRESENCIAL", 120, date, "Docente de Ejemplo",
                        "DOCENTE DE LA ASIGNATURA DE DISEÑO CURRICULAR EN INFORMÁTICA", List.of(
                        new PdfExportService.PdfPracticeFollowUpSession(date, LocalTime.of(8, 0), LocalTime.of(10, 0),
                                120, "Revisión del plan de actividades y de los instrumentos de observación.", "Se acordó completar la planificación.")))),
                pdf.createCompletedActivityRecordPdf(new PdfExportService.PdfCompletedActivityRecord(
                        "Unidad Educativa de Ejemplo", "ELABORACION", "Estudiante de Ejemplo", "1100000000", "V",
                        "septiembre 2026 – febrero 2027", "PRESENCIAL", 120, date, "Estudiante de Ejemplo", "Tutor Institucional de Ejemplo",
                        List.of(new PdfExportService.PdfCompletedActivityEntry(date, LocalTime.of(8, 0), LocalTime.of(10, 0), 120,
                                "Observación del desarrollo de clases y acompañamiento docente.\nAplicación de la ficha de observación.",
                                "https://ejemplo.test/evidencia", image)))));
        for (int i = 0; i < documents.size(); i++) {
            try (var document = Loader.loadPDF(documents.get(i))) {
                assertThat(imageCount(document)).isPositive();
                checkBounds(document);
                if (i < 2) {
                    PDFTextStripper cover = new PDFTextStripper();
                    cover.setStartPage(1); cover.setEndPage(1);
                    assertThat(cover.getText(document)).contains("septiembre 2026", "febrero 2027");
                    PDFTextStripper body = new PDFTextStripper();
                    body.setStartPage(2); body.setEndPage(2);
                    assertThat(body.getText(document)).contains("INFORMACIÓN GENERAL");
                }
                if (i >= 3) assertThat(document.getPage(0).getMediaBox().getWidth()).isGreaterThan(800F);
            }
            String output = System.getProperty("pdf.preview.dir");
            if (output != null) {
                Path directory = Path.of(output);
                Files.createDirectories(directory);
                Files.write(directory.resolve("L." + (i + 1) + " - muestra del sistema.pdf"), documents.get(i));
            }
        }
        try (var document = Loader.loadPDF(documents.get(1))) {
            assertThat(document.getPages()).anySatisfy(page -> assertThat(page.getMediaBox().getWidth()).isGreaterThan(800F));
        }
        try (var document = Loader.loadPDF(documents.get(5))) {
            assertThat(imageCount(document)).isGreaterThanOrEqualTo(2);
            assertThat(document.getPage(0).getAnnotations()).hasSize(1);
        }
    }

    @Test
    void aLongWeekAndSchedulePreserveTheEndOfEveryActivity() throws Exception {
        String longText = "Actividad académica con observación y acompañamiento docente. ".repeat(250) + "MARCADOR_FINAL_SEMANA";
        String matrixText = "Planificación microcurricular e instrumentos de evaluación. ".repeat(100) + "MARCADOR_FINAL_CRONOGRAMA";
        byte[] bytes = pdf.createPdf("Plan de actividades", List.of(
                pdf.sectionWithTables("Actividades a cumplir", List.of(), List.of(pdf.weekTable(List.of(pdf.weekRow(1, date, date.plusDays(4), "Actividad", longText))))),
                pdf.sectionWithScheduleMatrices("Cronograma", List.of(), List.of(pdf.scheduleMatrix("Cronograma de actividades", List.of(pdf.scheduleRow(1, date, date.plusDays(4), matrixText)))))));
        try (var document = Loader.loadPDF(bytes)) {
            assertThat(document.getNumberOfPages()).isGreaterThan(4);
            assertThat(new PDFTextStripper().getText(document)).contains("MARCADOR_FINAL_SEMANA", "MARCADOR_FINAL_CRONOGRAMA");
            checkBounds(document);
        }
    }

    @Test
    void longFollowUpAndCompletedActivitiesContinueAcrossPages() throws Exception {
        String longText = "Acompañamiento docente y registro de las actividades realizadas. ".repeat(250) + "ACTIVIDAD_COMPLETA";
        var completed = new PdfExportService.PdfCompletedActivityRecord("Institución", "ELABORACION", "Estudiante", "1100000000", "V", "2026", "PRESENCIAL", 60, date, "Estudiante", "Tutor",
                List.of(new PdfExportService.PdfCompletedActivityEntry(date, LocalTime.of(8, 0), LocalTime.of(9, 0), 60, longText, "https://ejemplo.test")));
        var followUp = new PdfExportService.PdfPracticeFollowUpReport("Institución", "ELABORACION", "Estudiante", "1100000000", "V", "2026", "PRESENCIAL", 60, date, "Tutor", "DOCENTE TUTOR",
                List.of(new PdfExportService.PdfPracticeFollowUpSession(date, LocalTime.of(8, 0), LocalTime.of(9, 0), 60, longText, "Seguimiento docente. ".repeat(200) + "OBSERVACION_COMPLETA")));
        for (byte[] bytes : List.of(pdf.createCompletedActivityRecordPdf(completed), pdf.createPracticeFollowUpReportPdf(followUp))) {
            try (var document = Loader.loadPDF(bytes)) {
                assertThat(document.getNumberOfPages()).isGreaterThan(1);
                assertThat(new PDFTextStripper().getText(document)).contains("ACTIVIDAD_COMPLETA");
                checkBounds(document);
            }
        }
    }

    @Test
    void institutionalLetterheadRepeatsWithoutCoverOrUniversityBranding() throws Exception {
        byte[] bytes = pdf.createPdf("Informe final de prácticas preprofesionales", List.of(
                pdf.section("Antecedentes", List.of(pdf.field("@paragraph", "Antecedentes de la práctica. ".repeat(500))))), letterhead());
        try (var document = Loader.loadPDF(bytes)) {
            assertThat(document.getNumberOfPages()).isGreaterThan(1);
            assertThat(imageCount(document)).isEqualTo(document.getNumberOfPages());
            assertThat(new PDFTextStripper().getText(document)).doesNotContain("FACULTAD DE LA EDUCACIÓN", "@paragraph");
            checkBounds(document);
        }
    }

    private List<PdfExportService.PdfSection> sections(boolean plan) {
        var sections = new ArrayList<PdfExportService.PdfSection>();
        sections.add(pdf.section("Información general", List.of(
                pdf.field("@subheading", "Datos del Estudiante"), pdf.field("Estudiante", "Estudiante de Ejemplo"),
                pdf.field("Cédula de Identidad", "1100000000"), pdf.field("Correo Electrónico", "estudiante@ejemplo.test"),
                pdf.field("Nro. de teléfono", "0900000000"), pdf.field("Carrera", "Pedagogía de las Ciencias Experimentales"),
                pdf.field("Titulación", "Pedagogía de la Informática"), pdf.field("Ciclo", "V"),
                pdf.field("Periodo Academico", "septiembre 2026 – febrero 2027"), pdf.field("Tutor Academico", "Docente de Ejemplo"),
                pdf.field("@subheading", "Datos de la Institución Educativa"), pdf.field("Nombre de la Institución", "Unidad Educativa de Ejemplo"),
                pdf.field("Código AMIE", "11H00000"), pdf.field("Dirección", "Dirección de ejemplo, Loja"), pdf.field("Parroquia", "San Sebastián"),
                pdf.field("Cantón", "Loja"), pdf.field("Provincia", "Loja"), pdf.field("Niveles educativos que ofrece", "Educación General Básica"),
                pdf.field("Sostenimiento", "Municipal"), pdf.field("Régimen escolar", "Sierra"), pdf.field("Modalidad", "Presencial"))));
        sections.add(pdf.section("Presentación", List.of(pdf.field("@paragraph", "Las prácticas permiten aplicar los conocimientos adquiridos durante la formación académica en el contexto educativo, mediante observación, planificación y acompañamiento docente."))));
        sections.add(pdf.section("Objetivos", List.of(pdf.field("Objetivo General", "Analizar la planificación microcurricular y su ejecución en el aula."), pdf.field("@heading", "Objetivos Específicos"), pdf.field("@bullet", "Identificar los componentes de la planificación."), pdf.field("@bullet", "Observar las metodologías empleadas en el aula."))));
        if (!plan) sections.add(pdf.section("Metodología", List.of(pdf.field("@paragraph", "Se aplican entrevistas y fichas de observación para registrar las actividades desarrolladas."))));
        sections.add(pdf.sectionWithTables(plan ? "Actividades a cumplir" : "Actividades desarrolladas", List.of(), List.of(pdf.weekTable(List.of(pdf.weekRow(1, date, date.plusDays(4), "Actividad", "Presentación con el directivo y el docente de la institución.\nObservación del desarrollo de clases en el aula."))))));
        if (plan) {
            sections.add(pdf.sectionWithScheduleMatrices("Cronograma", List.of(), List.of(pdf.scheduleMatrix("CRONOGRAMA DE ACTIVIDADES PRÁCTICAS PARA EL DESARROLLO DEL PIS", List.of(pdf.scheduleRow(1, date, date.plusDays(4), "Observación del desarrollo de clases."), pdf.scheduleRow(2, date.plusDays(7), date.plusDays(11), "Elaboración de planificaciones microcurriculares."))))));
            sections.add(pdf.section("Recursos", List.of(pdf.field("Legal", "Convenio de prácticas."), pdf.field("Humano", "Estudiante y docentes tutores."), pdf.field("Tecnológicos", "Recursos educativos digitales."), pdf.field("Físicos", "Aula y material didáctico."))));
        } else {
            sections.add(pdf.section("Conclusiones", List.of(pdf.field("@bullet", "Se identificaron los componentes de la planificación."))));
            sections.add(pdf.section("Recomendaciones", List.of(pdf.field("@bullet", "Fortalecer el uso de recursos educativos digitales."))));
        }
        sections.add(pdf.section(plan ? "Legalizacion" : "Elaboracion y aprobacion", List.of(pdf.field("Estudiante", "Estudiante de Ejemplo"), pdf.field("Tutor Academico", "Docente de Ejemplo"), pdf.field("Rol", "DOCENTE DE LA ASIGNATURA DE DISEÑO\nCURRICULAR EN INFORMÁTICA\nTUTOR ACADÉMICO"))));
        return sections;
    }

    private List<PdfExportService.PdfSection> institutionalSections() {
        return List.of(pdf.section("Información general", List.of(pdf.field("@subheading", "Datos de la Institución Educativa"), pdf.field("Nombre de la Institución", "Unidad Educativa de Ejemplo"), pdf.field("Tutor Institucional", "Tutor de Ejemplo"), pdf.field("@subheading", "Datos del Estudiante"), pdf.field("Estudiante", "Estudiante de Ejemplo"), pdf.field("Ciclo", "V"), pdf.field("Número de horas realizadas", "46h:55"))),
                pdf.section("Antecedentes", List.of(pdf.field("@paragraph", "En el marco del convenio de cooperación institucional, se brindaron facilidades para el desarrollo de las prácticas preprofesionales."))),
                pdf.section("Objetivo", List.of(pdf.field("@paragraph", "Dar a conocer el cumplimiento de las actividades realizadas por el estudiante."))),
                pdf.sectionWithTables("Actividades", List.of(), List.of(pdf.weekTable(List.of(pdf.weekRow(1, date, date.plusDays(4), "Actividad", "Presentación y observación de clases.\nAcompañamiento docente."))))),
                pdf.section("Conclusiones", List.of(pdf.field("@bullet", "El estudiante demostró responsabilidad y compromiso."))),
                pdf.section("Recomendaciones", List.of(pdf.field("@bullet", "Continuar fortaleciendo la práctica docente."))),
                pdf.section("Firma tutor institucional", List.of(pdf.field("Fecha", "04/11/2026"), pdf.field("Tutor Institucional", "Tutor de Ejemplo"), pdf.field("Rol", "TUTOR INSTITUCIONAL"))));
    }

    private List<PdfExportService.PdfActivityEvaluationAspect> aspects() {
        return List.of(new PdfExportService.PdfActivityEvaluationAspect("GENERAL", "Conoce en qué consiste la práctica preprofesional que realiza.", "ALTO", 3),
                new PdfExportService.PdfActivityEvaluationAspect("GENERAL", "Realiza con calidad los trabajos encomendados.", "ALTO", 3),
                new PdfExportService.PdfActivityEvaluationAspect("GENERAL", "Ejecuta con responsabilidad las instrucciones y tareas encargadas.", "ALTO", 3),
                new PdfExportService.PdfActivityEvaluationAspect("GENERAL", "Respeta los procedimientos y normas de la institución educativa.", "ALTO", 3),
                new PdfExportService.PdfActivityEvaluationAspect("ESPECIFICO", "Aplicación de instrumentos y recopilación de planificaciones microcurriculares.", "ALTO", 3),
                new PdfExportService.PdfActivityEvaluationAspect("ESPECIFICO", "Análisis y sistematización de la información obtenida.", "ALTO", 3),
                new PdfExportService.PdfActivityEvaluationAspect("ESPECIFICO", "Registro de la información recolectada mediante observación áulica.", "ALTO", 3),
                new PdfExportService.PdfActivityEvaluationAspect("ESPECIFICO", "Diseño y presentación de la propuesta y los informes de prácticas.", "ALTO", 3));
    }

    private byte[] letterhead() throws Exception {
        BufferedImage image = new BufferedImage(1000, 180, BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        graphics.setColor(Color.WHITE); graphics.fillRect(0, 0, 1000, 180);
        graphics.setColor(new Color(30, 60, 110)); graphics.drawRect(2, 2, 995, 175);
        graphics.setFont(new Font("SansSerif", Font.BOLD, 32));
        graphics.drawString("UNIDAD EDUCATIVA DE EJEMPLO", 190, 75);
        graphics.setFont(new Font("SansSerif", Font.PLAIN, 24));
        graphics.drawString("Membrete adjuntado en el formulario L.3", 245, 120);
        graphics.dispose();
        var bytes = new ByteArrayOutputStream(); ImageIO.write(image, "png", bytes); return bytes.toByteArray();
    }

    private int imageCount(PDDocument document) throws Exception {
        int count = 0;
        for (var page : document.getPages()) for (var name : page.getResources().getXObjectNames())
            if (page.getResources().isImageXObject(name)) count++;
        return count;
    }

    private void checkBounds(PDDocument document) throws Exception {
        new PDFTextStripper() {
            @Override protected void processTextPosition(TextPosition text) {
                var box = document.getPage(getCurrentPageNo() - 1).getMediaBox();
                assertThat(text.getXDirAdj()).as(text.getUnicode()).isGreaterThanOrEqualTo(25F);
                assertThat(text.getXDirAdj() + text.getWidthDirAdj()).as(text.getUnicode()).isLessThan(box.getWidth() - 25F);
                assertThat(text.getYDirAdj()).as(text.getUnicode()).isBetween(10F, box.getHeight() - 20F);
                super.processTextPosition(text);
            }
        }.getText(document);
    }
}
