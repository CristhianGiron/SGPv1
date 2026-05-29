package com.sgp.systemsgp.service;

import com.sgp.systemsgp.dto.location.*;
import com.sgp.systemsgp.exception.BadRequestException;
import com.sgp.systemsgp.exception.NotFoundException;
import com.sgp.systemsgp.model.Canton;
import com.sgp.systemsgp.model.Parish;
import com.sgp.systemsgp.model.Province;
import com.sgp.systemsgp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final ProvinceRepository provinceRepository;

    private final CantonRepository cantonRepository;

    private final ParishRepository parishRepository;

    /*
     * PROVINCIAS
     */
    public List<ProvinceResponse> getProvinces() {

        return provinceRepository

                .findAll()

                .stream()

                .map(province -> ProvinceResponse.builder()

                        .id(province.getId())

                        .code(province.getCode())

                        .name(province.getName())

                        .build())

                .toList();
    }

    /*
     * CANTONES
     */
    public List<CantonResponse> getCantons(
            Long provinceId
    ) {

        return cantonRepository

                .findByProvince_Id(provinceId)

                .stream()

                .map(canton -> CantonResponse.builder()

                        .id(canton.getId())

                        .code(canton.getCode())

                        .name(canton.getName())

                        .build())

                .toList();
    }

    /*
     * PARROQUIAS
     */
    public List<ParishResponse> getParishes(
            Long cantonId
    ) {

        return parishRepository

                .findByCanton_Id(cantonId)

                .stream()

                .map(parish -> ParishResponse.builder()

                        .id(parish.getId())

                        .code(parish.getCode())

                        .name(parish.getName())

                        .build())

                .toList();
    }

    /*
 * CREAR PROVINCIA
 */
public ProvinceResponse createProvince(
        CreateProvinceRequest request
) {

    if (provinceRepository.existsByCode(request.getCode())) {
        throw new BadRequestException("El código de la provincia ya existe");
    }

    Province province = Province.builder()

            .code(request.getCode())

            .name(request.getName())

            .build();

    provinceRepository.save(province);

    return ProvinceResponse.builder()

            .id(province.getId())

            .code(province.getCode())

            .name(province.getName())

            .build();
}
public CantonResponse createCanton(
        CreateCantonRequest request
) {

    if (cantonRepository.existsByCode(request.getCode())) {
        throw new BadRequestException("El código del cantón ya existe");
    }

    Province province =
            provinceRepository

                    .findById(request.getProvinceId())

                    .orElseThrow(() ->
                            new NotFoundException(
                                    "Provincia no encontrada"
                            )
                    );

    Canton canton = Canton.builder()

            .code(request.getCode())

            .name(request.getName())

            .province(province)

            .build();

    cantonRepository.save(canton);

    return CantonResponse.builder()

            .id(canton.getId())

            .code(canton.getCode())

            .name(canton.getName())

            .build();
}
public ParishResponse createParish(
        CreateParishRequest request
) {

    if (parishRepository.existsByCode(request.getCode())) {
        throw new BadRequestException("El código de la parroquia ya existe");
    }

    Canton canton =
            cantonRepository

                    .findById(request.getCantonId())

                    .orElseThrow(() ->
                            new NotFoundException(
                                    "Cantón no encontrado"
                            )
                    );

    Parish parish = Parish.builder()

            .code(request.getCode())

            .name(request.getName())

            .canton(canton)

            .build();

    parishRepository.save(parish);

    return ParishResponse.builder()

            .id(parish.getId())

            .code(parish.getCode())

            .name(parish.getName())

            .build();
}
}
