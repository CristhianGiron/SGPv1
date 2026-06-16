package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.institution.*;
import com.sgp.systemsgp.enums.InstitutionType;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Canton;
import com.sgp.systemsgp.model.Institution;
import com.sgp.systemsgp.model.Parish;
import com.sgp.systemsgp.model.Province;
import com.sgp.systemsgp.repository.CantonRepository;
import com.sgp.systemsgp.repository.InstitutionRepository;
import com.sgp.systemsgp.repository.ParishRepository;
import com.sgp.systemsgp.repository.ProvinceRepository;
import com.sgp.systemsgp.specification.InstitutionSpecification;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class InstitutionService {

        private final InstitutionRepository institutionRepository;

        private final ProvinceRepository provinceRepository;

        private final CantonRepository cantonRepository;

        private final ParishRepository parishRepository;

        private static final String AMIE_REGEX = "^[0-9]{2}[A-Z][0-9]{5}$";

        /*
         * CREAR
         */
        public InstitutionResponse create(
                        CreateInstitutionRequest request) {

                /*
                 * VALIDAR CÓDIGO
                 */
                boolean exists = institutionRepository
                                .existsByCode(request.getCode());

                if (exists) {

                        throw new BadRequestException(
                                        "El código institucional ya existe");
                }

                /*
                 * VALIDAR AMIE
                 */
                if ((request.getType() == InstitutionType.ESCUELA
                                ||

                                request.getType() == InstitutionType.COLEGIO)

                                &&

                                !request.getCode()
                                                .matches(AMIE_REGEX)) {

                        throw new BadRequestException(
                                        "Formato AMIE inválido");
                }

                /*
                 * VALIDAR NIVELES EDUCATIVOS
                 */
                if (

                request.getEducationLevels() != null

                                &&

                                request.getType() != InstitutionType.ESCUELA

                                &&

                                request.getType() != InstitutionType.COLEGIO

                ) {

                        throw new BadRequestException(
                                        "Solo escuelas y colegios pueden tener niveles educativos");
                }

                /*
                 * VALIDAR ESTRUCTURA ACADÉMICA
                 */
                if (request.getType() == InstitutionType.UNIVERSIDAD
                                &&

                                request.getEducationLevels() != null) {

                        throw new BadRequestException(
                                        "Las universidades no usan niveles educativos");
                }

                validateSchoolProfileAllowed(
                                request.getType(),
                                hasSchoolProfileData(request));

                /*
                 * UBICACIÓN
                 */
                Province province = provinceRepository
                                .findById(request.getProvinceId())
                                .orElseThrow(() -> new NotFoundException(
                                                "Provincia no encontrada"));

                Canton canton = cantonRepository
                                .findById(request.getCantonId())
                                .orElseThrow(() -> new NotFoundException(
                                                "Cantón no encontrado"));

                Parish parish = parishRepository
                                .findById(request.getParishId())
                                .orElseThrow(() -> new NotFoundException(
                                                "Parroquia no encontrada"));

                /*
                 * VALIDAR JERARQUÍA
                 */
                if (!canton.getProvince()
                                .getId()
                                .equals(province.getId())) {

                        throw new BadRequestException(
                                        "El cantón no pertenece a la provincia");
                }

                if (!parish.getCanton()
                                .getId()
                                .equals(canton.getId())) {

                        throw new BadRequestException(
                                        "La parroquia no pertenece al cantón");
                }

                Institution institution = Institution.builder()

                                .code(request.getCode())

                                .name(request.getName())

                                .type(request.getType())

                                .support(request.getSupport())

                                .address(request.getAddress())

                                .phone(request.getPhone())

                                .email(request.getEmail())

                                .website(request.getWebsite())

                                .province(province)

                                .canton(canton)

                                .parish(parish)

                                .regime(request.getRegime())

                                .modality(request.getModality())

                                .teacherCount(request.getTeacherCount())

                                .studentCount(request.getStudentCount())

                                .mission(request.getMission())

                                .vision(request.getVision())

                                .institutionalValues(request.getInstitutionalValues())

                                .agreementActive(
                                                Boolean.TRUE.equals(
                                                                request.getAgreementActive()))

                                .acceptsInterns(
                                                Boolean.TRUE.equals(
                                                                request.getAcceptsInterns()))

                                .createdAt(LocalDateTime.now())

                                .active(true)

                                .deleted(false)

                                .build();

                if (request.getEducationLevels() != null) {
                        institution.setEducationLevels(request.getEducationLevels());
                }

                institutionRepository.save(institution);

                return mapToResponse(institution);
        }

        /*
         * OBTENER
         */
        public InstitutionResponse getById(Long id) {

                return mapToResponse(getInstitution(id));
        }

        /*
         * LISTAR
         */
        public Page<InstitutionResponse> getAll(
                        boolean includeInactive,
                        Pageable pageable) {

                if (!includeInactive) {
                        return institutionRepository
                                        .findByDeletedFalseAndActiveTrue(pageable)
                                        .map(this::mapToResponse);
                }

                return institutionRepository
                                .findByDeletedFalse(pageable)
                                .map(this::mapToResponse);
        }

        public Page<InstitutionResponse> getActiveForRegistration(
                        String type,
                        Pageable pageable) {

                if (type == null || type.isBlank()) {
                        return institutionRepository
                                        .findByDeletedFalseAndActiveTrue(pageable)
                                        .map(this::mapToResponse);
                }

                InstitutionType institutionType;

                try {
                        institutionType = InstitutionType.valueOf(type);
                } catch (IllegalArgumentException exception) {
                        throw new BadRequestException(
                                        "Tipo de institución inválido");
                }

                if (institutionType == InstitutionType.ESCUELA
                                || institutionType == InstitutionType.COLEGIO) {
                        return institutionRepository
                                        .findByDeletedFalseAndActiveTrueAndTypeAndAgreementActiveTrueAndAcceptsInternsTrue(
                                                        institutionType,
                                                        pageable)
                                        .map(this::mapToResponse);
                }

                return institutionRepository
                                .findByDeletedFalseAndActiveTrueAndType(
                                                institutionType,
                                                pageable)
                                .map(this::mapToResponse);
        }

        /*
         * SEARCH
         */
        public Page<InstitutionResponse> search(

                        String name,

                        String code,

                        String type,

                        String support,

                        Boolean active,

                        boolean includeInactive,

                        Boolean agreementActive,

                        Boolean acceptsInterns,

                        Pageable pageable) {

                Boolean effectiveActive = active;

                if (!includeInactive) {
                        effectiveActive = true;
                }

                return institutionRepository

                                .findAll(

                                                InstitutionSpecification.search(

                                                                name,

                                                                code,

                                                                type,

                                                                support,

                                                                effectiveActive,

                                                                agreementActive,

                                                                acceptsInterns),

                                                pageable)

                                .map(this::mapToResponse);
        }

        /*
         * UPDATE
         */
        public InstitutionResponse update(

                        Long id,

                        UpdateInstitutionRequest request) {

                Institution institution = getInstitution(id);
                InstitutionType effectiveType = request.getType() != null
                                ? request.getType()
                                : institution.getType();

                validateSchoolProfileAllowed(
                                effectiveType,
                                hasSchoolProfileData(request));

                /*
                 * DATOS BÁSICOS
                 */
                if (request.getName() != null) {
                        institution.setName(request.getName());
                }

                if (request.getType() != null) {
                        institution.setType(request.getType());
                }

                if (request.getSupport() != null) {
                        institution.setSupport(request.getSupport());
                }

                if (request.getAddress() != null) {
                        institution.setAddress(request.getAddress());
                }

                if (request.getPhone() != null) {
                        institution.setPhone(request.getPhone());
                }

                if (request.getEmail() != null) {
                        institution.setEmail(request.getEmail());
                }

                if (request.getWebsite() != null) {
                        institution.setWebsite(request.getWebsite());
                }

                if (isSchoolOrCollege(effectiveType)) {
                        applySchoolProfileData(institution, request);
                } else {
                        clearSchoolProfileData(institution);
                }

                /*
                 * RÉGIMEN
                 */
                if (request.getRegime() != null) {

                        institution.setRegime(
                                        request.getRegime());
                }

                /*
                 * MODALIDAD
                 */
                if (request.getModality() != null) {

                        institution.setModality(
                                        request.getModality());
                }

                /*
                 * NIVELES EDUCATIVOS
                 */
                if (request.getEducationLevels() != null) {

                        institution.setEducationLevels(
                                        request.getEducationLevels());
                }

                /*
                 * PROVINCIA
                 */
                Province province = institution.getProvince();

                if (request.getProvinceId() != null) {

                        province = provinceRepository

                                        .findById(request.getProvinceId())

                                        .orElseThrow(() -> new NotFoundException(
                                                        "Provincia no encontrada"));

                        institution.setProvince(province);
                }

                /*
                 * CANTÓN
                 */
                Canton canton = institution.getCanton();

                if (request.getCantonId() != null) {

                        canton = cantonRepository

                                        .findById(request.getCantonId())

                                        .orElseThrow(() -> new NotFoundException(
                                                        "Cantón no encontrado"));

                        institution.setCanton(canton);
                }

                /*
                 * PARROQUIA
                 */
                Parish parish = institution.getParish();

                if (request.getParishId() != null) {

                        parish = parishRepository

                                        .findById(request.getParishId())

                                        .orElseThrow(() -> new NotFoundException(
                                                        "Parroquia no encontrada"));

                        institution.setParish(parish);
                }

                /*
                 * VALIDAR JERARQUÍA
                 */
                if (

                province != null

                                &&

                                canton != null

                                &&

                                !canton.getProvince()
                                                .getId()
                                                .equals(province.getId())

                ) {

                        throw new BadRequestException(
                                        "El cantón no pertenece a la provincia");
                }

                if (

                canton != null

                                &&

                                parish != null

                                &&

                                !parish.getCanton()
                                                .getId()
                                                .equals(canton.getId())

                ) {

                        throw new BadRequestException(
                                        "La parroquia no pertenece al cantón");
                }

                /*
                 * CONFIGURACIONES
                 */
                if (request.getAgreementActive() != null) {

                        institution.setAgreementActive(
                                        request.getAgreementActive());
                }

                if (request.getAcceptsInterns() != null) {

                        institution.setAcceptsInterns(
                                        request.getAcceptsInterns());
                }

                institution.setUpdatedAt(
                                LocalDateTime.now());

                institutionRepository.save(institution);

                return mapToResponse(institution);
        }

        /*
         * DESACTIVAR
         */
        public void disable(Long id) {

                Institution institution = getInstitution(id);

                institution.setActive(false);

                institutionRepository.save(institution);
        }

        /*
         * ACTIVAR
         */
        public void enable(Long id) {

                Institution institution = getInstitution(id);

                institution.setActive(true);

                institutionRepository.save(institution);
        }

        /*
         * SOFT DELETE
         */
        public void softDelete(Long id) {

                Institution institution = getInstitution(id);

                institution.setDeleted(true);

                institution.setDeletedAt(
                                LocalDateTime.now());

                institution.setActive(false);

                institutionRepository.save(institution);
        }

        /*
         * RESTORE
         */
        public void restore(Long id) {

                Institution institution = getExistingInstitution(id);

                institution.setDeleted(false);

                institution.setDeletedAt(null);

                institution.setActive(true);

                institutionRepository.save(institution);
        }

        /*
         * DELETE REAL
         */
        public void forceDelete(Long id) {

                Institution institution = getExistingInstitution(id);

                institutionRepository.delete(institution);
        }

        /*
         * GET ENTITY
         */
        private Institution getInstitution(Long id) {

                return institutionRepository
                                .findByIdAndDeletedFalse(id)
                                .orElseThrow(() -> new NotFoundException(
                                                "Institución no encontrada"));
        }

        private Institution getExistingInstitution(Long id) {

                return institutionRepository
                                .findById(id)
                                .orElseThrow(() -> new NotFoundException(
                                                "Institución no encontrada"));
        }

        private void validateSchoolProfileAllowed(
                        InstitutionType type,
                        boolean hasSchoolProfileData) {

                if (hasSchoolProfileData && !isSchoolOrCollege(type)) {
                        throw new BadRequestException(
                                        "Solo escuelas y colegios pueden tener datos institucionales educativos");
                }
        }

        private boolean isSchoolOrCollege(InstitutionType type) {

                return type == InstitutionType.ESCUELA
                                || type == InstitutionType.COLEGIO;
        }

        private boolean hasSchoolProfileData(CreateInstitutionRequest request) {

                return request.getTeacherCount() != null
                                || request.getStudentCount() != null
                                || hasText(request.getMission())
                                || hasText(request.getVision())
                                || hasText(request.getInstitutionalValues());
        }

        private boolean hasSchoolProfileData(UpdateInstitutionRequest request) {

                return request.getTeacherCount() != null
                                || request.getStudentCount() != null
                                || hasText(request.getMission())
                                || hasText(request.getVision())
                                || hasText(request.getInstitutionalValues());
        }

        private boolean hasText(String value) {

                return value != null
                                && !value.isBlank();
        }

        private void applySchoolProfileData(
                        Institution institution,
                        UpdateInstitutionRequest request) {

                if (request.getTeacherCount() != null) {
                        institution.setTeacherCount(request.getTeacherCount());
                }

                if (request.getStudentCount() != null) {
                        institution.setStudentCount(request.getStudentCount());
                }

                if (request.getMission() != null) {
                        institution.setMission(request.getMission());
                }

                if (request.getVision() != null) {
                        institution.setVision(request.getVision());
                }

                if (request.getInstitutionalValues() != null) {
                        institution.setInstitutionalValues(request.getInstitutionalValues());
                }
        }

        private void clearSchoolProfileData(Institution institution) {

                institution.setTeacherCount(null);
                institution.setStudentCount(null);
                institution.setMission(null);
                institution.setVision(null);
                institution.setInstitutionalValues(null);
        }

      /*
 * MAPPER
 */
private InstitutionResponse mapToResponse(
        Institution institution) {

    return InstitutionResponse.builder()

            .id(institution.getId())

            .code(institution.getCode())

            .name(institution.getName())

            .type(
                    institution.getType() != null
                            ? institution.getType().name()
                            : null)

            .support(
                    institution.getSupport() != null
                            ? institution.getSupport().name()
                            : null)

            .regime(
                    institution.getRegime() != null
                            ? institution.getRegime().name()
                            : null)

            .modality(
                    institution.getModality() != null
                            ? institution.getModality().name()
                            : null)

            .educationLevels(
                    institution.getEducationLevels() != null
                            ? Set.copyOf(institution.getEducationLevels())
                            : null)

            .teacherCount(institution.getTeacherCount())

            .studentCount(institution.getStudentCount())

            .mission(institution.getMission())

            .vision(institution.getVision())

            .institutionalValues(institution.getInstitutionalValues())

            .address(institution.getAddress())

            .phone(institution.getPhone())

            .email(institution.getEmail())

            .website(institution.getWebsite())

            .province(
                    institution.getProvince() != null
                            ? institution.getProvince().getName()
                            : null)

            .canton(
                    institution.getCanton() != null
                            ? institution.getCanton().getName()
                            : null)

            .parish(
                    institution.getParish() != null
                            ? institution.getParish().getName()
                            : null)

            .agreementActive(
                    institution.isAgreementActive())

            .acceptsInterns(
                    institution.isAcceptsInterns())

            .active(
                    institution.isActive())

            .createdAt(institution.getCreatedAt())

            .updatedAt(institution.getUpdatedAt())

            .build();
	}
}
