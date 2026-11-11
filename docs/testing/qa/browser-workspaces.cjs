/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-workspaces.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-workspaces mediante pruebas de regresión.
 */

// Isolated browser fixtures: no calls reach the real backend.
const fs = require('fs'), path = require('path'), http = require('http');
const project = path.resolve(__dirname, '../../..');
const puppeteer = require(path.join(project, 'FrontEnd/node_modules/puppeteer-core'));
const { routes } = require('./check-contracts.cjs').buildConfig();
const root = path.join(project, 'FrontEnd/build');
let coverFixture = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD3cAAAAASUVORK5CYII=', 'base64');
const coverFixturePath = '/tmp/sgp-cover-fixture.png';fs.writeFileSync(coverFixturePath, coverFixture);
const practices = [
 { id: 7, coverImageUrl: '/api/courses/10/cover?v=1', institutionLogoUrl: '/api/institutions/2/logo?v=2', courseId: 10, courseName: 'Prácticas de informática', status: 'APPROVED', courseActive: true, studentFullName: 'Ana Prueba', educationalInstitutionName: 'Colegio de prácticas', academicCycleName: 'Ciclo 7', groupName: 'Grupo A' },
 { id: 8, courseId: 20, courseName: 'Práctica anterior', status: 'COMPLETED', archived: true, courseActive: false, studentFullName: 'Luis Prueba' },
];
(async () => {
 const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
 const fixturePage = await browser.newPage();
 const png = await fixturePage.evaluate(() => { const canvas = document.createElement('canvas');canvas.width = 256;canvas.height = 128;const ctx = canvas.getContext('2d');ctx.fillStyle = '#c7dbef';ctx.fillRect(0,0,256,128);ctx.fillStyle = '#284b74';ctx.fillRect(60,30,136,98);return canvas.toDataURL('image/png').split(',')[1]; });
 coverFixture = Buffer.from(png, 'base64');fs.writeFileSync(coverFixturePath, coverFixture);await fixturePage.close();
 const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + '/') || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');fs.createReadStream(file).pipe(res);
 });
 await new Promise(r => server.listen(0, '127.0.0.1', r));
 const origin = 'http://127.0.0.1:' + server.address().port;
 const errors = [], results = [], toolbarChecks = [];let interactions = 0;
 try {
  for (const role of [...new Set(routes.map(r => r.role))].filter(role => !process.argv.includes('--student') || role === 'ROLE_ESTUDIANTE')) {
   const page = await browser.newPage();await page.setViewport({ width: 1440, height: 1000 });
   await page.evaluateOnNewDocument(() => { localStorage.setItem('sgp-auth', JSON.stringify({ accessToken: 'qa-fixture' }));localStorage.setItem('sgp-theme-mode', 'light'); });
   page.on('pageerror', e => errors.push({ role, message: e.message }));
   await page.setRequestInterception(true);
   page.on('request', req => {
    const url = new URL(req.url());
    if (url.pathname.endsWith('/cover') || url.pathname.endsWith('/logo')) return req.respond({ status: 200, contentType: 'image/png', body: coverFixture });
    if (url.pathname.startsWith('/api/')) {
     let data = [];
     if (url.pathname === '/api/account/me') data = { id: 1, username: 'qa', names: 'Ana', roles: [role] };
     if (['/api/enrollments/practices', '/api/enrollments/me', '/api/enrollments/managed'].includes(url.pathname)) data = practices;
     const institutions = [{ id: 1, name: 'Universidad seleccionada', type: 'UNIVERSIDAD' }, { id: 2, name: 'Colegio seleccionado', type: 'COLEGIO' }];
     const faculty = { id: 10, name: 'Facultad seleccionada', institutionId: 1 };
     const career = { id: 100, name: 'Carrera seleccionada', facultyId: 10 };
     const cycle = { id: 1000, name: 'Ciclo seleccionado', careerId: 100 };
     const grade = { id: 20, name: 'Grado seleccionado', institutionId: 2 };
     const parallel = { id: 200, name: 'Paralelo seleccionado', gradeId: 20, institutionId: 2 };
     const catalogs = { faculties: [faculty], careers: [career], 'academic-cycles': [cycle], grades: [grade], 'grade-parallels': [parallel], subjects: [] };
     if (url.pathname === '/api/institutions' || url.pathname === '/api/institutions/search') data = { content: institutions };
     if (url.pathname === '/api/institutions/1') data = institutions[0];
     if (url.pathname === '/api/institutions/2') data = institutions[1];
     for (const [key, rows] of Object.entries(catalogs)) {
      if (url.pathname === '/api/' + key) data = rows;
      if (rows[0] && url.pathname === '/api/' + key + '/' + rows[0].id) data = rows[0];
     }
     if (url.pathname === '/api/completed-activity-records/submitted/summary') data = [{ id: 42, enrollmentId: 7, studentFullName: 'Ana Prueba', courseName: 'Prácticas de informática', status: 'SUBMITTED' }];
     if (url.pathname === '/api/account') data = { content: [{ id: 7, username: 'ana', names: 'Ana', lastNames: 'Torres', roles: ['ROLE_ESTUDIANTE'], enabled: true }] };
     if (url.pathname === '/api/practice-forms/assigned') data = [{ id: 10, enrollmentId: 7, studentFullName: 'Ana Prueba', title: 'Entrevista asignada', status: 'SENT' }];
     if (url.pathname === '/api/practice-schedules/institution-review') data = [{ id: 11, enrollmentId: 7, studentFullName: 'Ana Prueba', courseName: 'Prácticas de informática', periods: [], attendances: [] }];
     if (url.pathname === '/api/practice-photos/me' || url.pathname === '/api/practice-photos/review') data = [{ id: 1, enrollmentId: 7, description: 'Evidencia seleccionada' }, { id: 2, enrollmentId: 8, description: 'Evidencia ajena' }];
     return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    }
    if (url.origin !== origin) return req.abort();req.continue();
   });
   const visit = async route => {
    await page.goto(origin + '/#/' + route, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#sgp-main-content h1');
    const state = await page.evaluate(() => ({ title: document.querySelector('h1').textContent, overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
    if (state.overflow) errors.push({ role, route, message: 'Horizontal overflow', nodes: await page.evaluate(() => [...document.querySelectorAll('body *')].map(e => ({ tag: e.tagName, class: String(e.className), right: e.getBoundingClientRect().right, width: e.getBoundingClientRect().width })).filter(e => e.right > innerWidth + 1 && e.width > 0).slice(-12)) });
    results.push({ role, route, ...state });
    const toolbars = await page.evaluate(() => [...document.querySelectorAll('.sgp-list-toolbar')].flatMap(toolbar => {
     const input = toolbar.querySelector('input[type="search"]');if (!input) return [];
     const search = input.getBoundingClientRect();const buttons = [...toolbar.querySelectorAll('.sgp-toolbar-actions button')].map(button => ({ label: button.innerText, bottom: button.getBoundingClientRect().bottom }));
     return [{ viewport: innerWidth, searchWidth: search.width, searchBottom: search.bottom, buttonBottoms: buttons }];
    }));
    for (const toolbar of toolbars) {
     toolbarChecks.push({ role, route, ...toolbar });
     if (toolbar.viewport >= 1280 && (toolbar.searchWidth > 418 || toolbar.buttonBottoms.some(button => Math.abs(button.bottom - toolbar.searchBottom) > 2))) errors.push({ role, route, message: 'Search and actions are not compact and aligned', ...toolbar });
    }

   };
   await visit('dashboard');
   if (role !== 'ROLE_DIRECTORA_INSTITUCION') {
    if (role !== 'ROLE_ESTUDIANTE') await visit('practices');
    // Exercise real cards and dropdown navigation before direct URL coverage.
    await page.evaluate(student => {
     const main = document.getElementById('sgp-main-content');
     [...main.querySelectorAll('button')].find(b => b.innerText.includes(student ? 'Abrir práctica' : 'Prácticas de informática'))?.click();
    }, role === 'ROLE_ESTUDIANTE');
    if (role !== 'ROLE_ESTUDIANTE') await page.waitForFunction(() => [...document.querySelectorAll('#sgp-main-content button')].some(b => b.innerText.includes('Abrir práctica')));
    if (role !== 'ROLE_ESTUDIANTE') await page.evaluate(() => [...document.querySelectorAll('#sgp-main-content button')].find(b => b.innerText.includes('Abrir práctica'))?.click());
    await page.waitForSelector('[aria-label="Práctica seleccionada"]');
    await page.waitForSelector('img[alt="Portada de Prácticas de informática"]');interactions++;
    const sections = await page.$$eval('[aria-label="Apartado de la práctica"] option', options => options.map(o => o.value).filter(Boolean));
    for (const section of sections) await visit('practices/7/' + section);
    await visit('practices/7/photos');
    const text = await page.$eval('#sgp-main-content', e => e.innerText);
    if (!text.includes('Evidencia seleccionada') || text.includes('Evidencia ajena')) errors.push({ role, message: 'Photos from another practice appeared' });
    interactions++;
    await page.setViewport({ width: 390, height: 844 });await visit('practices/7');
    await page.screenshot({ path: '/tmp/sgp-workspace-mobile-' + role + '.png', fullPage: true });
    await page.setViewport({ width: 1440, height: 1000 });
    await visit('practices/8/photos');
    const history = await page.$eval('#sgp-main-content', e => e.innerText);
    if (history.includes('Subir evidencia')) errors.push({ role, message: 'Historical upload visible' });
    await visit('practices/999');
    if (!(await page.$eval('h1', e => e.innerText)).includes('no disponible')) errors.push({ role, message: 'Unknown workspace accepted' });
   } else { await visit('institution-work'); await visit('institution-work/7'); await visit('institution-work/7/forms'); await visit('institution-work/7/schedules'); }
   if (['ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS'].includes(role)) {
    for (const query of ['institutionId=1', 'institutionId=1&facultyId=10', 'institutionId=1&facultyId=10&careerId=100', 'institutionId=1&facultyId=10&careerId=100&view=cycles', 'institutionId=1&facultyId=10&careerId=100&academicCycleId=1000']) await visit('universities?' + query);
    await visit('institutions?institutionId=2');
    if (role === 'ROLE_ADMIN') {
     for (const query of ['institutionId=2&gradeId=20', 'institutionId=2&gradeId=20&view=parallels', 'institutionId=2&gradeId=20&gradeParallelId=200']) await visit('institutions?' + query);
     await visit('accounts');
     await page.evaluate(() => [...document.querySelectorAll('#sgp-main-content button')].find(b => b.innerText.startsWith('Estudiante'))?.click());
     await page.waitForFunction(() => [...document.querySelectorAll('#sgp-main-content button')].some(b => b.innerText.includes('Abrir ana')));
     await page.evaluate(() => [...document.querySelectorAll('#sgp-main-content button')].find(b => b.innerText.includes('Abrir ana'))?.click());
     await page.waitForFunction(() => document.querySelector('h1')?.textContent.includes('Ana Torres'));interactions++;
     await visit('documents/completed-records');
     await page.screenshot({ path: '/tmp/sgp-toolbar-documentos.png', fullPage: true });
     await visit('courses');
     await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].find(b => b.innerText === 'Crear paralelo')?.click());
     await page.waitForSelector('[role="dialog"] input[type="file"]');
     const picker = await page.$('[role="dialog"] input[type="file"]');await picker.uploadFile(coverFixturePath);
     await page.waitForSelector('img[alt="Vista previa de la imagen elegida"]');
     if (!await picker.evaluate(input => input.closest('form')?.querySelector('button[type="submit"]') && input.files.length === 1)) errors.push({ role, message: 'Cover is not chosen inside the creation form' });
     interactions++;
     await visit('universities');
     await page.evaluate(() => [...document.querySelectorAll('#sgp-main-content button')].find(b => b.innerText.startsWith('Crear'))?.click());
     await page.waitForSelector('[role="dialog"] input[type="file"]');
     const logoPicker = await page.$('[role="dialog"] input[type="file"]');await logoPicker.uploadFile(coverFixturePath);
     await page.waitForSelector('img[alt="Vista previa de la imagen elegida"]');interactions++;

    }
   }
   console.log(role + ': ' + results.filter(r => r.role === role).length + ' rutas');await page.close();
  }
 } finally { await browser.close();await new Promise(r => server.close(r)); }
 const evidence = { date: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date()), mode: 'Isolated API fixtures, not live backend authorization', routes: results.length, interactions, errors, toolbarChecks, results };
 fs.writeFileSync(path.join(project, 'docs/testing/evidencias/evidencia-qa-workspaces.json'), JSON.stringify(evidence, null, 2));
 console.log(JSON.stringify({ routes: results.length, interactions, toolbarChecks: toolbarChecks.length, errors }));if (errors.length) process.exitCode = 1;
})().catch(e => { console.error(e);process.exitCode = 1; });
