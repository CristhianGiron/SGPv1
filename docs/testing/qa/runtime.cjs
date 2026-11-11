/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          runtime.cjs
 * @fecha         2026-11-11 10:29:41
 * @nota          Comprueba el comportamiento de el módulo runtime mediante pruebas de regresión.
 */

const path = require('node:path');

// QA owns its browser dependency; the application does not need Puppeteer.
module.exports = {
  puppeteer: require('puppeteer-core'),
  buildPath: path.resolve(process.env.SGP_QA_BUILD_PATH || path.join(__dirname, '../../../FrontEnd/build')),
  chromePath: process.env.SGP_QA_CHROME_PATH || '/usr/bin/google-chrome',
};
