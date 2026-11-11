/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-action-colors.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-action-colors mediante pruebas de regresión.
 */

// Measure production CSS in Chrome, including all palettes and dark mode.
const fs = require('fs'), path = require('path');
const project = path.resolve(__dirname, '../../..');
const puppeteer = require('./runtime.cjs').puppeteer;
(async () => {
 const browser = await puppeteer.launch({ executablePath: require('./runtime.cjs').chromePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
 const results = [];
 try {
  const page = await browser.newPage();await page.setViewport({ width: 1100, height: 850 });
  const folder = path.join(require('./runtime.cjs').buildPath, 'static/css');
  const css = fs.readFileSync(path.join(folder, fs.readdirSync(folder).find(file => file.endsWith('.css'))), 'utf8');
  await page.setContent(`<style>${css}\n*{transition:none!important}</style><main style="padding:32px;display:grid;gap:16px;grid-template-columns:repeat(4,1fr)"></main>`);
  for (const palette of ['unl', 'claro', 'bosque']) for (const mode of ['light', 'dark']) {
   await page.evaluate(({ palette, mode }) => {
    const root = document.documentElement;root.dataset.colorTheme = palette;root.dataset.theme = mode;root.classList.toggle('dark', mode === 'dark');
    const styles = ['solid', 'soft', 'menu'];const intents = ['info', 'success', 'warning', 'danger'];
    const labels = { info: 'Guardar cambios', success: 'Aprobar práctica', warning: 'Reabrir práctica', danger: 'Eliminar registro' };
    document.querySelector('main').innerHTML = styles.flatMap(style => intents.map(intent => `<button id="${style}-${intent}" data-intent="${intent}" class="${style === 'menu' ? 'sgp-action-menu-item' : 'sgp-action sgp-action-' + style} ${style === 'solid' ? 'sgp-button-primary' : ''} rounded-md border p-4 text-sm font-medium">${labels[intent]}</button>`)).join('');
   }, { palette, mode });
   for (const style of ['solid', 'soft', 'menu']) for (const intent of ['info', 'success', 'warning', 'danger']) for (const hover of [false, true]) {
    if (hover) await page.hover('#' + style + '-' + intent);else await page.mouse.move(0, 0);
    const result = await page.$eval('#' + style + '-' + intent, element => {
     const computed = getComputedStyle(element);
     const canvas = document.createElement('canvas');canvas.width = canvas.height = 1;const context = canvas.getContext('2d');
     function rgb(color) { context.clearRect(0, 0, 1, 1);context.fillStyle = color;context.fillRect(0, 0, 1, 1);return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3); }
     function luminance(color) { const [r, g, b] = rgb(color).map(v => { v /= 255;return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });return .2126*r + .7152*g + .0722*b; }
     const background = computed.backgroundColor === 'rgba(0, 0, 0, 0)' ? getComputedStyle(document.body).backgroundColor : computed.backgroundColor;
     const a = luminance(computed.color), b = luminance(background);
     return { foreground: computed.color, background, contrast: +((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2) };
    });
    results.push({ palette, mode, style, intent, hover, ...result });
   }
   await page.screenshot({ path: '/tmp/sgp-colores-' + palette + '-' + mode + '.png' });
  }
 } finally { await browser.close(); }
 const errors = results.filter(result => result.contrast < 4.5);
 for (const result of results) {
  const reference = results.find(r => r.palette === 'unl' && r.mode === result.mode && r.style === result.style && r.intent === result.intent && r.hover === result.hover);
  // Neutral surfaces follow each theme; semantic foreground colors retain their meaning.
  if (result.foreground !== reference.foreground) errors.push({ ...result, reason: 'Semantic action colors changed with palette' });
 }
 fs.writeFileSync(path.join(project, 'docs/testing/evidencias/evidencia-colores-acciones.json'), JSON.stringify({ checks: results.length, minimumContrast: Math.min(...results.map(r => r.contrast)), errors, results }, null, 2));
 console.log(JSON.stringify({ checks: results.length, minimumContrast: Math.min(...results.map(r => r.contrast)), errors }, null, 2));
 if (errors.length) process.exitCode = 1;
})().catch(error => { console.error(error.message);process.exitCode = 1; });
