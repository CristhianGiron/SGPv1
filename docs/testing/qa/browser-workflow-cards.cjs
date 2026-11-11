/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-workflow-cards.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-workflow-cards mediante pruebas de regresión.
 */

const fs = require('fs'), path = require('path'), http = require('http');
const project = path.resolve(__dirname, '../../..');
const puppeteer = require('./runtime.cjs').puppeteer;
(async () => {
 const root = require('./runtime.cjs').buildPath;
 const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + (req.url === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + '/') || !fs.existsSync(file)) { res.writeHead(404);return res.end(); }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const origin = 'http://127.0.0.1:' + server.address().port;
 const browser = await puppeteer.launch({ executablePath: require('./runtime.cjs').chromePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
 const results = [], errors = [];
 try {
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => { localStorage.setItem('sgp-auth', JSON.stringify({ accessToken: 'fixture' }));localStorage.setItem('sgp-theme-mode', 'light'); });
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', req => {
   const url = new URL(req.url());
   if (url.pathname.startsWith('/api/')) return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(url.pathname === '/api/account/me' ? { id: 1, names: 'Ana', roles: ['ROLE_ADMIN'] } : []) });
   if (url.origin !== origin) return req.abort();req.continue();
  });
  for (const mode of ['light', 'dark']) for (const width of [1440, 390]) {
   await page.setViewport({ width, height: 1000 });
   await page.goto(origin + '/#/dashboard', { waitUntil: 'networkidle0' });await page.waitForSelector('.sgp-workflow-card');
   await page.evaluate(mode => { document.documentElement.classList.toggle('dark', mode === 'dark'); }, mode);
   const state = await page.evaluate(() => ({ cards: document.querySelectorAll('.sgp-workflow-card').length, overflow: document.documentElement.scrollWidth > innerWidth + 1, topBorders: [...document.querySelectorAll('.sgp-workflow-card')].map(card => getComputedStyle(card).borderTopWidth) }));
   if (state.overflow || state.cards !== 7 || state.topBorders.some(width => width !== '1px')) errors.push({ mode, width, ...state });
   results.push({ mode, width, ...state });
   await page.screenshot({ path: `/tmp/sgp-tarjetas-${mode}-${width}.png`, fullPage: true });
  }
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);await page.hover('.sgp-workflow-card');
  const transform = await page.$eval('.sgp-workflow-card', card => getComputedStyle(card).transform);
  if (transform !== 'none') errors.push({ message: 'Reduced-motion preference ignored', transform });
 } finally { await browser.close();await new Promise(resolve => server.close(resolve)); }
 fs.writeFileSync(path.join(project, 'docs/testing/evidencias/evidencia-tarjetas.json'), JSON.stringify({ results, errors }, null, 2));
 console.log(JSON.stringify({ views: results.length, errors }, null, 2));if (errors.length) process.exitCode = 1;
})().catch(error => { console.error(error.message);process.exitCode = 1; });
