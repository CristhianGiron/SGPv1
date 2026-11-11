/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EntityImageService.java
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa la lógica de aplicación de las imágenes de las entidades.
 */

package com.sgp.systemsgp.service;
import com.sgp.systemsgp.dto.course.CourseResponse;
import com.sgp.systemsgp.dto.course.CreateCourseRequest;
import com.sgp.systemsgp.dto.institution.CreateInstitutionRequest;
import com.sgp.systemsgp.dto.institution.InstitutionResponse;
import com.sgp.systemsgp.dto.institution.UpdateInstitutionRequest;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.EntityImage;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.CourseRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.EntityImageRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;

import com.sgp.systemsgp.dto.course.*;
import com.sgp.systemsgp.dto.institution.*;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.*;
import com.sgp.systemsgp.model.*;
import com.sgp.systemsgp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import java.io.*;
import java.util.Locale;
import java.util.Objects;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class EntityImageService {
    private final EntityImageRepository images;
    private final CourseRepository courses;
    private final InstitutionRepository institutions;
    private final AccountRepository accounts;
    private final EnrollmentRepository enrollments;
    private final CourseService courseService;
    private final InstitutionService institutionService;
    private final PracticeAccessService access;

    @Transactional
    public CourseResponse createCourse(String username, CreateCourseRequest request, MultipartFile file) {
        if (file == null) return courseService.createCourse(username, request);
        EntityImage image = decode(file);
        CourseResponse response = courseService.createCourse(username, request);
        Course course = course(response.getId());
        course.setCoverImage(images.save(image));
        response.setCoverImageUrl(coverUrl(course));
        return response;
    }
    @Transactional
    public InstitutionResponse createInstitution(CreateInstitutionRequest request, MultipartFile file) {
        if (file == null) return institutionService.create(request);
        EntityImage image = decode(file);
        InstitutionResponse response = institutionService.create(request);
        Institution institution = institution(response.getId());
        institution.setLogoImage(images.save(image));
        response.setLogoImageUrl(logoUrl(institution));
        return response;
    }
    @Transactional
    public InstitutionResponse updateInstitution(Long id, UpdateInstitutionRequest request, MultipartFile file) {
        if (file == null) return institutionService.update(id, request);
        EntityImage image = decode(file);
        InstitutionResponse response = institutionService.update(id, request);
        Institution institution = institution(id);
        EntityImage previous = institution.getLogoImage();
        institution.setLogoImage(images.save(image));
        institutions.flush();
        if (previous != null) images.delete(previous);
        response.setLogoImageUrl(logoUrl(institution));
        return response;
    }
    @Transactional
    public CourseResponse replaceCover(String username, Long id, MultipartFile file) {
        Course course = managedCourse(username, id);
        CourseResponse response = courseService.getById(username, id);
        EntityImage image = decode(file);
        EntityImage previous = course.getCoverImage();
        course.setCoverImage(images.save(image));
        courses.flush();
        if (previous != null) images.delete(previous);
        response.setCoverImageUrl(coverUrl(course));
        return response;
    }
    @Transactional
    public void removeCover(String username, Long id) {
        Course course = managedCourse(username, id);
        EntityImage previous = course.getCoverImage();
        course.setCoverImage(null);
        courses.flush();
        if (previous != null) images.delete(previous);
    }
    @Transactional
    public void removeLogo(Long id) {
        Institution institution = institution(id);
        EntityImage previous = institution.getLogoImage();
        institution.setLogoImage(null);
        institutions.flush();
        if (previous != null) images.delete(previous);
    }
    public ImageFile cover(String username, Long id) {
        Course course = course(id);
        Account viewer = accounts.findByUsernameAndDeletedFalse(username).orElseThrow(() -> new NotFoundException("Cuenta no encontrada"));
        boolean allowed = access.isAdmin(viewer) || access.isDirectorForCourse(course, viewer) || access.isPracticeTutorForCourse(course, viewer);
        if (!allowed && access.hasRole(viewer, RoleName.ROLE_ESTUDIANTE)) {
            var cycle = access.getCourseAcademicCycle(course);
            allowed = course.isActive() && !course.isLocked() && cycle != null && viewer.getAcademicCycle() != null && Objects.equals(cycle.getId(), viewer.getAcademicCycle().getId());
        }
        if (!allowed) allowed = enrollments.findByCourse_Id(id).stream().anyMatch(enrollment -> access.canViewEnrollment(enrollment, viewer)
                || access.hasRole(viewer, RoleName.ROLE_DIRECTORA_INSTITUCION) && viewer.getInstitution() != null
                && InstitutionalAssignmentResolver.educationalInstitution(enrollment) != null && Objects.equals(viewer.getInstitution().getId(), InstitutionalAssignmentResolver.educationalInstitution(enrollment).getId()));
        if (!allowed) throw new AccessDeniedException("Esta portada no pertenece a tus prácticas");
        return file(course.getCoverImage());
    }
    public ImageFile logo(Long id) {
        Institution institution = institution(id);
        if (!institution.isActive()) throw new NotFoundException("Logotipo no disponible");
        return file(institution.getLogoImage());
    }
    private Course managedCourse(String username, Long id) {
        Course course = course(id);
        Account viewer = accounts.findByUsernameAndDeletedFalse(username).orElseThrow(() -> new NotFoundException("Cuenta no encontrada"));
        if (!access.isAdmin(viewer) && !access.isDirectorForCourse(course, viewer)) throw new AccessDeniedException("No puedes cambiar la portada de este paralelo");
        return course;
    }
    private Course course(Long id) { return courses.findByIdAndDeletedFalse(id).orElseThrow(() -> new NotFoundException("Paralelo no encontrado")); }
    private Institution institution(Long id) { return institutions.findById(id).filter(i -> !i.isDeleted()).orElseThrow(() -> new NotFoundException("Institución no encontrada")); }
    private ImageFile file(EntityImage image) {
        if (image == null) throw new NotFoundException("Imagen no disponible");
        return new ImageFile(image.getContentType(), image.getData());
    }
    static EntityImage decode(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BadRequestException("Selecciona una imagen JPG o PNG.");
        if (file.getSize() > 4 * 1024 * 1024) throw new BadRequestException("La imagen no puede superar 4 MB.");
        String declared = Objects.toString(file.getContentType(), "").toLowerCase(Locale.ROOT).replace("image/jpg", "image/jpeg");
        if (!declared.equals("image/jpeg") && !declared.equals("image/png")) throw new BadRequestException("Usa una imagen JPG o PNG.");
        try {
            byte[] encoded = file.getBytes();
            try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(encoded))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new BadRequestException("El archivo no contiene una imagen válida.");
            var reader = readers.next();
            try {
                reader.setInput(input, true, true);
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                String detected = format.equals("jpeg") || format.equals("jpg") ? "image/jpeg" : format.equals("png") ? "image/png" : "";
                if (!declared.equals(detected)) throw new BadRequestException("El contenido de la imagen no coincide con su formato.");
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 1 || height < 1 || width > 4096 || height > 4096 || (long) width * height > 16000000) throw new BadRequestException("La imagen debe tener como máximo 4096 px por lado y 16 megapíxeles.");
                if (reader.read(0) == null) throw new BadRequestException("No se pudo procesar la imagen.");
                // Keep the validated file so JPEG orientation and image quality
                // match the browser preview instead of losing EXIF on re-encoding.
                return EntityImage.builder().contentType(detected).data(encoded).build();
            } finally { reader.dispose(); }
            }
        } catch (IOException | IllegalArgumentException ex) { throw new BadRequestException("El archivo no contiene una imagen válida."); }
    }
    public static String coverUrl(Course course) { return course.getCoverImage() == null ? null : "/api/courses/" + course.getId() + "/cover?v=" + course.getCoverImage().getId(); }
    public static String logoUrl(Institution institution) { return institution == null || institution.getLogoImage() == null ? null : "/api/institutions/" + institution.getId() + "/logo?v=" + institution.getLogoImage().getId(); }
    public record ImageFile(String contentType, byte[] data) {}
}
