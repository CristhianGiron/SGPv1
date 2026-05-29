package com.sgp.systemsgp.config;

import com.sgp.systemsgp.model.Canton;
import com.sgp.systemsgp.model.Parish;
import com.sgp.systemsgp.model.Province;

import com.sgp.systemsgp.repository.CantonRepository;
import com.sgp.systemsgp.repository.ParishRepository;
import com.sgp.systemsgp.repository.ProvinceRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.boot.CommandLineRunner;

import org.springframework.core.io.ClassPathResource;

import org.springframework.context.annotation.Profile;

import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;

import java.nio.charset.StandardCharsets;

import java.util.ArrayList;
import java.util.List;

@Component
@Profile("!test")
@RequiredArgsConstructor
public class LocationSeeder
        implements CommandLineRunner {

    private final ProvinceRepository provinceRepository;

    private final CantonRepository cantonRepository;

    private final ParishRepository parishRepository;

    @Override
    public void run(String... args)
            throws Exception {

        seedProvinces();

        seedCantons();

        seedParishes();
    }

    /*
     * =========================================
     * PROVINCES
     * =========================================
     */
    private void seedProvinces()
            throws Exception {

        if (provinceRepository.count() > 0) {

            System.out.println(
                    "Provincias ya cargadas"
            );

            return;
        }

        BufferedReader reader =
                new BufferedReader(

                        new InputStreamReader(

                                new ClassPathResource(
                                        "data/provinces.csv"
                                ).getInputStream(),

                                StandardCharsets.UTF_8
                        )
                );

        String line;

        reader.readLine(); // header

        List<Province> provinces =
                new ArrayList<>();

        while ((line = reader.readLine()) != null) {

            try {

                if (line.isBlank()) {
                    continue;
                }

                String[] data =
                        line.split("[,;]");

                if (data.length < 2) {

                    System.out.println(
                            "Provincia inválida -> "
                                    + line
                    );

                    continue;
                }

                String code = data[0]
                        .replace("\"", "")
                        .trim();

                String name = data[1]
                        .replace("\"", "")
                        .trim();

                boolean exists =
                        provinceRepository
                                .existsByCode(code);

                if (exists) {
                    continue;
                }

                Province province =
                        Province.builder()

                                .code(code)

                                .name(name)

                                .build();

                provinces.add(province);

            } catch (Exception e) {

                System.out.println(
                        "ERROR PROVINCIA -> "
                                + line
                );

                e.printStackTrace();
            }
        }

        if (!provinces.isEmpty()) {

            provinceRepository.saveAll(provinces);
        }

        reader.close();

        System.out.println(
                "OK Provincias cargadas: "
                        + provinceRepository.count()
        );
    }

    /*
     * =========================================
     * CANTONS
     * =========================================
     */
    private void seedCantons()
            throws Exception {

        if (cantonRepository.count() > 0) {

            System.out.println(
                    "Cantones ya cargados"
            );

            return;
        }

        BufferedReader reader =
                new BufferedReader(

                        new InputStreamReader(

                                new ClassPathResource(
                                        "data/cantons.csv"
                                ).getInputStream(),

                                StandardCharsets.UTF_8
                        )
                );

        String line;

        reader.readLine(); // header

        List<Canton> cantons =
                new ArrayList<>();

        while ((line = reader.readLine()) != null) {

            try {

                if (line.isBlank()) {
                    continue;
                }

                String[] data =
                        line.split("[,;]");

                if (data.length < 3) {

                    System.out.println(
                            "Cantón inválido -> "
                                    + line
                    );

                    continue;
                }

                String code = data[0]
                        .replace("\"", "")
                        .trim();

                String name = data[1]
                        .replace("\"", "")
                        .trim();

                String provinceCode = data[2]
                        .replace("\"", "")
                        .trim();

                boolean exists =
                        cantonRepository
                                .existsByCode(code);

                if (exists) {
                    continue;
                }

                Province province =
                        provinceRepository

                                .findByCode(provinceCode)

                                .orElseThrow(() ->
                                        new RuntimeException(
                                                "Provincia no encontrada: "
                                                        + provinceCode
                                        )
                                );

                Canton canton =
                        Canton.builder()

                                .code(code)

                                .name(name)

                                .province(province)

                                .build();

                cantons.add(canton);

                /*
                 * GUARDAR POR LOTES
                 */
                if (cantons.size() >= 500) {

                    cantonRepository.saveAll(cantons);

                    cantons.clear();
                }

            } catch (Exception e) {

                System.out.println(
                        "ERROR CANTÓN -> "
                                + line
                );

                e.printStackTrace();
            }
        }

        if (!cantons.isEmpty()) {

            cantonRepository.saveAll(cantons);
        }

        reader.close();

        System.out.println(
                "OK Cantones cargados: "
                        + cantonRepository.count()
        );
    }

    /*
     * =========================================
     * PARISHES
     * =========================================
     */
    private void seedParishes()
            throws Exception {

        if (parishRepository.count() > 0) {

            System.out.println(
                    "Parroquias ya cargadas"
            );

            return;
        }

        BufferedReader reader =
                new BufferedReader(

                        new InputStreamReader(

                                new ClassPathResource(
                                        "data/parishes.csv"
                                ).getInputStream(),

                                StandardCharsets.UTF_8
                        )
                );

        String line;

        reader.readLine(); // header

        List<Parish> parishes =
                new ArrayList<>();

        while ((line = reader.readLine()) != null) {

            try {

                if (line.isBlank()) {
                    continue;
                }

                String[] data =
                        line.split("[,;]");

                if (data.length < 3) {

                    System.out.println(
                            "Parroquia inválida -> "
                                    + line
                    );

                    continue;
                }

                String code = data[0]
                        .replace("\"", "")
                        .trim();

                String name = data[1]
                        .replace("\"", "")
                        .trim();

                String cantonCode = data[2]
                        .replace("\"", "")
                        .trim();

                boolean exists =
                        parishRepository
                                .existsByCode(code);

                if (exists) {
                    continue;
                }

                Canton canton =
                        cantonRepository

                                .findByCode(cantonCode)

                                .orElseThrow(() ->
                                        new RuntimeException(
                                                "Cantón no encontrado: "
                                                        + cantonCode
                                        )
                                );

                Parish parish =
                        Parish.builder()

                                .code(code)

                                .name(name)

                                .canton(canton)

                                .build();

                parishes.add(parish);

                /*
                 * GUARDAR POR LOTES
                 */
                if (parishes.size() >= 500) {

                    parishRepository.saveAll(parishes);

                    parishes.clear();
                }

            } catch (Exception e) {

                System.out.println(
                        "ERROR PARROQUIA -> "
                                + line
                );

                e.printStackTrace();
            }
        }

        if (!parishes.isEmpty()) {

            parishRepository.saveAll(parishes);
        }

        reader.close();

        System.out.println(
                "OK Parroquias cargadas: "
                        + parishRepository.count()
        );
    }
}
