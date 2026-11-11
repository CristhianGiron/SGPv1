/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PdfPreview.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente PdfPreview del backend del SGP.
 */

package com.sgp.systemsgp.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.awt.Color;

public final class PdfPreview {
    private PdfPreview() {}
    public static byte[] mark(byte[] pdf) {
        try (var document = Loader.loadPDF(pdf); var output = new ByteArrayOutputStream()) {
            for (var page : document.getPages()) {
                try (var stream = new PDPageContentStream(document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                    float width = page.getMediaBox().getWidth();
                    stream.setNonStrokingColor(new Color(255, 245, 215));
                    stream.addRect(0, 0, width, 22); stream.fill();
                    stream.beginText(); stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                    stream.setNonStrokingColor(new Color(105, 71, 10)); stream.newLineAtOffset(20, 7);
                    stream.showText("VISTA PREVIA - NO ES UN DOCUMENTO FINAL - Compruebe datos, membrete y firmas"); stream.endText();
                }
            }
            document.save(output); return output.toByteArray();
        } catch (IOException exception) { throw new IllegalStateException("No se pudo generar la vista previa", exception); }
    }
}
