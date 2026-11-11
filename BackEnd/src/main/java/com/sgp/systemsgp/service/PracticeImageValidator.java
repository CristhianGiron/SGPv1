/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeImageValidator.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente PracticeImageValidator del backend del SGP.
 */

package com.sgp.systemsgp.service;

import com.sgp.systemsgp.exception.BadRequestException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import javax.imageio.ImageIO;

/** Validate the encoded format independently of the client-supplied MIME type. */
final class PracticeImageValidator {
    private PracticeImageValidator() {}

    static void validate(byte[] bytes, String mime) {
        String type = mime.toLowerCase(Locale.ROOT).replace("image/jpg", "image/jpeg");
        boolean valid = switch (type) {
            case "image/png", "image/jpeg" -> decodable(bytes, type);
            case "image/webp" -> webp(bytes);
            case "image/heic", "image/heif" -> heif(bytes, type);
            default -> false;
        };
        if (!valid) throw new BadRequestException("El archivo no contiene una fotografía válida del formato indicado");
    }

    private static boolean decodable(byte[] bytes, String mime) {
        try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) return false;
            var reader = readers.next();
            try {
                reader.setInput(input, true, true);
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!(mime.equals("image/png") ? format.equals("png") : Set.of("jpeg", "jpg").contains(format))) return false;
                int width = reader.getWidth(0), height = reader.getHeight(0);
                // Bound decoded memory before allocating the raster (48 MP, including phone photos).
                return width > 0 && height > 0 && (long) width * height <= 48_000_000 && reader.read(0) != null;
            } finally { reader.dispose(); }
        } catch (IOException | IllegalArgumentException exception) { return false; }
    }

    // The JDK has no WebP/HEIF decoder. Check their complete container boundaries
    // and required image payloads; these formats are delivered unchanged to browsers.
    private static boolean webp(byte[] bytes) {
        if (bytes.length < 30 || !tag(bytes, 0).equals("RIFF") || !tag(bytes, 8).equals("WEBP")) return false;
        long declared = Integer.toUnsignedLong(Integer.reverseBytes(ByteBuffer.wrap(bytes, 4, 4).getInt()));
        if (declared + 8 != bytes.length) return false;
        boolean image = false;
        for (long offset = 12; offset < bytes.length;) {
            if (offset + 8 > bytes.length) return false;
            int at = (int) offset;
            long size = Integer.toUnsignedLong(Integer.reverseBytes(ByteBuffer.wrap(bytes, at + 4, 4).getInt()));
            if (size < 1 || offset + 8 + size > bytes.length) return false;
            String kind = tag(bytes, at);
            if (kind.equals("VP8 ") || kind.equals("VP8L") || kind.equals("ANMF")) image |= size >= 10;
            offset += 8 + size + (size & 1);
            if (offset > bytes.length) return false;
        }
        return image;
    }

    private static boolean heif(byte[] bytes, String mime) {
        boolean brand = false, metadata = false, image = false;
        for (long offset = 0; offset < bytes.length;) {
            if (offset + 8 > bytes.length) return false;
            int at = (int) offset;
            long size = Integer.toUnsignedLong(ByteBuffer.wrap(bytes, at, 4).getInt());
            int header = 8;
            if (size == 1) {
                if (offset + 16 > bytes.length) return false;
                size = ByteBuffer.wrap(bytes, at + 8, 8).getLong(); header = 16;
            } else if (size == 0) size = bytes.length - offset;
            if (size < header || size > bytes.length - offset) return false;
            String kind = tag(bytes, at + 4);
            if (offset == 0 && !kind.equals("ftyp")) return false;
            if (kind.equals("ftyp") && size >= header + 8) {
                Set<String> brands = mime.equals("image/heic") ? Set.of("heic", "heix", "hevc", "hevx")
                        : Set.of("heic", "heix", "hevc", "hevx", "mif1", "msf1");
                for (int pos = at + header; pos + 4 <= offset + size; pos += 4)
                    if (pos != at + header + 4) brand |= brands.contains(tag(bytes, pos));
            }
            metadata |= kind.equals("meta") && size > header + 4;
            image |= kind.equals("mdat") && size > header;
            offset += size;
        }
        return brand && metadata && image;
    }

    private static String tag(byte[] bytes, int offset) {
        return new String(bytes, offset, 4, StandardCharsets.US_ASCII);
    }
}
