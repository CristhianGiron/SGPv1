package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.practicephoto.PracticePhotoFileResponse;
import com.sgp.systemsgp.dto.practicephoto.PracticePhotoResponse;
import com.sgp.systemsgp.enums.EnrollmentStatus;
import com.sgp.systemsgp.enums.RoleName;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Account;
import com.sgp.systemsgp.model.Course;
import com.sgp.systemsgp.model.Enrollment;
import com.sgp.systemsgp.model.Person;
import com.sgp.systemsgp.model.PracticePhoto;
import com.sgp.systemsgp.repository.AccountRepository;
import com.sgp.systemsgp.repository.EnrollmentRepository;
import com.sgp.systemsgp.repository.PracticePhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PracticePhotoService {

    private static final long MAX_PHOTO_SIZE = 15 * 1024 * 1024;

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/heic",
            "image/heif");

    private final PracticePhotoRepository practicePhotoRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public PracticePhotoResponse upload(
            String username,
            Long enrollmentId,
            MultipartFile file,
            String description,
            LocalDate practiceDate) {

        Account student = getAccount(username);
        Enrollment enrollment = getEnrollment(enrollmentId);

        validateStudentOwnsEnrollment(student, enrollment);
        validateEnrollmentApproved(enrollment);
        validatePhoto(file);

        PracticePhoto photo = PracticePhoto.builder()
                .enrollment(enrollment)
                .student(student)
                .course(enrollment.getCourse())
                .uploadedBy(student)
                .practiceDate(practiceDate)
                .description(normalizeText(description))
                .originalFilename(resolveFilename(file))
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .data(readBytes(file))
                .uploadedAt(LocalDateTime.now())
                .build();

        practicePhotoRepository.save(photo);

        return mapToResponse(photo);
    }

    public List<PracticePhotoResponse> myPhotos(String username) {

        return practicePhotoRepository
                .findByStudent_UsernameAndDeletedFalseOrderByUploadedAtDesc(username)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void delete(
            Long id,
            String username) {

        PracticePhoto photo = getPhoto(id);
        Account student = getAccount(username);

        validateStudentOwnsPhoto(student, photo);

        photo.setDeleted(true);
        photo.setDeletedAt(LocalDateTime.now());
        photo.setUpdatedAt(LocalDateTime.now());

        practicePhotoRepository.save(photo);
    }

    public List<PracticePhotoResponse> reviewQueue(String username) {

        Account reviewer = getAccount(username);

        if (hasRole(reviewer, RoleName.ROLE_ADMIN)
                || hasRole(reviewer, RoleName.ROLE_DIRECTOR_PRACTICAS)
                || hasRole(reviewer, RoleName.ROLE_TUTOR_PRACTICAS)) {
            return practicePhotoRepository
                    .findByDeletedFalseOrderByUploadedAtDesc()
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        if (hasRole(reviewer, RoleName.ROLE_TUTOR_INSTITUCIONAL)) {
            List<PracticePhoto> photos = new ArrayList<>();
            addPhotos(
                    photos,
                    practicePhotoRepository
                            .findByEnrollment_Group_InstitutionalTutor_UsernameAndDeletedFalseOrderByUploadedAtDesc(
                                    username));
            addPhotos(
                    photos,
                    practicePhotoRepository
                            .findByEnrollment_Course_InstitutionalTutor_UsernameAndDeletedFalseOrderByUploadedAtDesc(
                                    username));
            addPhotos(
                    photos,
                    practicePhotoRepository
                            .findByCourse_InstitutionalTutor_UsernameAndDeletedFalseOrderByUploadedAtDesc(
                                    username));

            return uniquePhotos(photos)
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        throw new AccessDeniedException(
                "No puedes revisar fotografias de practicas");
    }

    public List<PracticePhotoResponse> enrollmentPhotos(
            Long enrollmentId,
            String username) {

        Enrollment enrollment = getEnrollment(enrollmentId);
        Account account = getAccount(username);

        validateCanViewEnrollment(enrollment, account);

        return practicePhotoRepository
                .findByEnrollment_IdAndDeletedFalseOrderByUploadedAtDesc(enrollmentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public PracticePhotoResponse getById(
            Long id,
            String username) {

        PracticePhoto photo = getPhoto(id);
        Account account = getAccount(username);

        validateCanView(photo, account);

        return mapToResponse(photo);
    }

    public PracticePhotoFileResponse getContent(
            Long id,
            String username) {

        PracticePhoto photo = getPhoto(id);
        Account account = getAccount(username);

        validateCanView(photo, account);

        if (photo.getData() == null) {
            throw new NotFoundException(
                    "La fotografia no tiene contenido");
        }

        return new PracticePhotoFileResponse(
                photo.getData(),
                photo.getContentType(),
                photo.getOriginalFilename(),
                photo.getFileSize());
    }

    private Account getAccount(String username) {

        return accountRepository
                .findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new NotFoundException(
                        "Cuenta no encontrada"));
    }

    private Enrollment getEnrollment(Long id) {

        if (id == null) {
            throw new BadRequestException(
                    "La inscripcion es obligatoria");
        }

        return enrollmentRepository
                .findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Inscripcion no encontrada"));
    }

    private PracticePhoto getPhoto(Long id) {

        return practicePhotoRepository
                .findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new NotFoundException(
                        "Fotografia de practicas no encontrada"));
    }

    private void validateStudentOwnsEnrollment(
            Account student,
            Enrollment enrollment) {

        if (enrollment.getAccount() == null
                || !enrollment.getAccount().getId().equals(student.getId())) {
            throw new AccessDeniedException(
                    "No puedes subir fotografias para otra inscripcion");
        }
    }

    private void validateStudentOwnsPhoto(
            Account student,
            PracticePhoto photo) {

        if (photo.getStudent() == null
                || !photo.getStudent().getId().equals(student.getId())) {
            throw new AccessDeniedException(
                    "No puedes quitar fotografias de otro estudiante");
        }
    }

    private void validateEnrollmentApproved(Enrollment enrollment) {

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BadRequestException(
                    "Solo se pueden subir fotografias de una inscripcion aprobada");
        }

        if (!isActiveCourseEnrollment(enrollment)) {
            throw new BadRequestException(
                    "El curso de la inscripcion no esta activo");
        }
    }

    private boolean isActiveCourseEnrollment(Enrollment enrollment) {

        Course course = enrollment.getCourse();

        return course != null
                && course.isActive()
                && !course.isDeleted();
    }

    private void addPhotos(
            List<PracticePhoto> target,
            List<PracticePhoto> source) {

        if (source != null) {
            target.addAll(source);
        }
    }

    private List<PracticePhoto> uniquePhotos(List<PracticePhoto> photos) {

        Map<Long, PracticePhoto> uniquePhotos = new LinkedHashMap<>();

        photos.forEach(photo -> {
            Long key = photo.getId();

            if (key != null) {
                uniquePhotos.putIfAbsent(key, photo);
            }
        });

        return new ArrayList<>(uniquePhotos.values());
    }

    private void validatePhoto(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException(
                    "La fotografia es obligatoria");
        }

        if (file.getSize() > MAX_PHOTO_SIZE) {
            throw new BadRequestException(
                    "La fotografia supera el limite de 15MB");
        }

        String contentType = file.getContentType();

        if (!StringUtils.hasText(contentType)
                || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException(
                    "Formato de fotografia no permitido");
        }
    }

    private byte[] readBytes(MultipartFile file) {

        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new BadRequestException(
                    "Error al procesar la fotografia");
        }
    }

    private String resolveFilename(MultipartFile file) {

        String originalFilename = file.getOriginalFilename();

        if (!StringUtils.hasText(originalFilename)) {
            return "fotografia-practica";
        }

        String cleanFilename = StringUtils.cleanPath(originalFilename);

        return StringUtils.hasText(cleanFilename)
                ? cleanFilename
                : "fotografia-practica";
    }

    private String normalizeText(String value) {

        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.trim();
    }

    private void validateCanView(
            PracticePhoto photo,
            Account account) {

        if (photo.getStudent().getId().equals(account.getId())
                || isAssignedPracticeTutor(resolveCourse(photo), account)
                || isAssignedInstitutionalTutor(photo.getEnrollment(), account)
                || hasRole(account, RoleName.ROLE_ADMIN)
                || hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)
                || hasRole(account, RoleName.ROLE_TUTOR_PRACTICAS)) {
            return;
        }

        throw new AccessDeniedException(
                "No puedes ver esta fotografia de practicas");
    }

    private void validateCanViewEnrollment(
            Enrollment enrollment,
            Account account) {

        Course course = enrollment.getCourse();

        if (enrollment.getAccount() != null
                && enrollment.getAccount().getId().equals(account.getId())) {
            return;
        }

        if (isAssignedPracticeTutor(course, account)
                || isAssignedInstitutionalTutor(enrollment, account)
                || hasRole(account, RoleName.ROLE_ADMIN)
                || hasRole(account, RoleName.ROLE_DIRECTOR_PRACTICAS)
                || hasRole(account, RoleName.ROLE_TUTOR_PRACTICAS)) {
            return;
        }

        throw new AccessDeniedException(
                "No puedes ver fotografias de esta inscripcion");
    }

    private boolean isAssignedPracticeTutor(
            Course course,
            Account account) {

        return course != null
                && course.getPracticeTutor() != null
                && course.getPracticeTutor().getId().equals(account.getId());
    }

    private boolean isAssignedInstitutionalTutor(
            Enrollment enrollment,
            Account account) {

        return InstitutionalAssignmentResolver.isAssignedInstitutionalTutor(
                enrollment,
                account);
    }

    private boolean hasRole(
            Account account,
            RoleName roleName) {

        return account.getRoles() != null
                && account.getRoles()
                        .stream()
                        .anyMatch(role -> roleName.name().equals(role.getName()));
    }

    private PracticePhotoResponse mapToResponse(PracticePhoto photo) {

        Account student = photo.getStudent();
        Person person = student.getPerson();
        Course course = resolveCourse(photo);

        return PracticePhotoResponse.builder()
                .id(photo.getId())
                .enrollmentId(photo.getEnrollment().getId())
                .courseId(course != null ? course.getId() : null)
                .courseName(course != null ? course.getName() : null)
                .studentId(student.getId())
                .studentUsername(student.getUsername())
                .studentFullName(
                        person != null
                                ? joinNames(
                                        person.getNames(),
                                        person.getLastNames())
                                : null)
                .studentIdentification(
                        person != null
                                ? person.getCedula()
                                : null)
                .practiceDate(photo.getPracticeDate())
                .description(photo.getDescription())
                .originalFilename(photo.getOriginalFilename())
                .contentType(photo.getContentType())
                .fileSize(photo.getFileSize())
                .contentUrl(
                        photo.getId() != null
                                ? "/api/practice-photos/"
                                        + photo.getId()
                                        + "/content"
                                : null)
                .uploadedBy(
                        photo.getUploadedBy() != null
                                ? photo.getUploadedBy().getUsername()
                                : null)
                .uploadedAt(photo.getUploadedAt())
                .createdAt(photo.getCreatedAt())
                .updatedAt(photo.getUpdatedAt())
                .build();
    }

    private Course resolveCourse(PracticePhoto photo) {

        if (photo.getCourse() != null) {
            return photo.getCourse();
        }

        Enrollment enrollment = photo.getEnrollment();

        return enrollment != null
                ? enrollment.getCourse()
                : null;
    }

    private String joinNames(
            String names,
            String lastNames) {

        String joined = ((names != null ? names : "")
                + " "
                + (lastNames != null ? lastNames : ""))
                .trim();

        return joined.isBlank() ? null : joined;
    }
}
