<!--
  @institucion   Universidad Nacional de Loja
  @carrera       Pedagogía de las Ciencias Experimentales - Informática
  @asignatura    Programación Web
  @docente       Johnny H. Sánchez L.
  @proyecto      Sistema de Gestión de Prácticas (SGP)
  @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
  @file          README.md
  @fecha         2026-11-11 10:32:47
  @nota          Comprueba el comportamiento de el módulo README mediante pruebas de regresión.
-->

# Entorno de comprobaciones del SGP

Los scripts de esta carpeta son herramientas de desarrollo. Sus dependencias pertenecen al paquete `sgp-qa`, separado del paquete `sgp-frontend`.

## Preparación

Se requiere Node.js 22.12 o superior y una instalación de Chrome. Desde la raíz `SGPv1`:

```bash
npm ci --prefix docs/testing/qa
npm ci --prefix FrontEnd
npm run build --prefix FrontEnd
npm run contracts --prefix docs/testing/qa
```

El lockfile de QA fija la versión de Puppeteer y sus dependencias. No se descarga ni instala un navegador mediante este paquete; `puppeteer-core` usa el Chrome instalado.

## Navegador y paquete compilado

Todos los scripts de navegador y el capturador de la bitácora comparten `runtime.cjs`:

| Variable | Valor predeterminado | Propósito |
| --- | --- | --- |
| `SGP_QA_BUILD_PATH` | `FrontEnd/build`, relativo a la raíz del proyecto | Carpeta de la aplicación compilada |
| `SGP_QA_CHROME_PATH` | `/usr/bin/google-chrome` | Ejecutable de Chrome |

Ejemplo con compilación temporal:

```bash
BUILD_PATH=/tmp/sgp-qa-build npm run build --prefix FrontEnd
SGP_QA_BUILD_PATH=/tmp/sgp-qa-build npm run browser:governance --prefix docs/testing/qa
SGP_QA_BUILD_PATH=/tmp/sgp-qa-build npm run browser:documents --prefix docs/testing/qa
SGP_QA_BUILD_PATH=/tmp/sgp-qa-build npm run browser:forms --prefix docs/testing/qa
```

`browser:forms` ejecuta la comprobación de continuidad de entrevistas, junto con los escenarios de sesión y planificación incluidos en ese script. Los scripts también se pueden ejecutar directamente con Node.

Las salidas siguen el contrato de cada script: incidencias y continuidad aceptan `SGP_QA_OUTPUT` para el archivo JSON; borradores/PDF/expediente acepta `SGP_QA_OUTPUT_DIR` para una carpeta de capturas y resultados. Establezca una salida nueva al conservar evidencia de otra ejecución.

Los recorridos de interfaz emplean datos ficticios y una API simulada. Las pruebas del backend y la comprobación de MariaDB temporal tienen un alcance distinto. El verificador de contratos recorre subpaquetes de controladores; el verificador documental excluye las dependencias instaladas.

Las sondas en `probes/` preservan diagnósticos históricos. No se incorporan automáticamente a la suite de aceptación. Consulte el informe que las creó antes de reproducirlas.

[Pruebas, informes y evidencias](../README.md).
