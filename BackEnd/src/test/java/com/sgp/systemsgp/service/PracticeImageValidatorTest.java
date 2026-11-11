/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeImageValidatorTest.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo Practice Image Validator Test mediante pruebas de regresión.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.exception.BadRequestException;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

class PracticeImageValidatorTest {
    @ParameterizedTest
    @ValueSource(strings = {"image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"})
    void rejectsTextDisguisedAsAPhoto(String mime) {
        assertThrows(BadRequestException.class, () -> PracticeImageValidator.validate("Esto no es una fotografía".getBytes(), mime));
    }
    @ParameterizedTest
    @ValueSource(strings = {"png", "jpeg"})
    void acceptsRealImages(String format) throws Exception {
        assertDoesNotThrow(() -> PracticeImageValidator.validate(image(format), "image/" + format));
    }
    @Test void rejectsMismatchedMime() throws Exception {
        byte[] png = image("png");
        assertThrows(BadRequestException.class, () -> PracticeImageValidator.validate(png, "image/jpeg"));
    }
    static byte[] image(String format) throws Exception {
        var out = new ByteArrayOutputStream();
        javax.imageio.ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), format, out);
        return out.toByteArray();
    }
}
