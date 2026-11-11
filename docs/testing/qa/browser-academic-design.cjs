/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-academic-design.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-academic-design mediante pruebas de regresión.
 */

// Visual and keyboard QA against the compiled application, with isolated API fixtures.
const fs = require('fs'), path = require('path'), http = require('http');
const project = path.resolve(__dirname, '../../..');
const puppeteer = require('./runtime.cjs').puppeteer;
const defaults = require(path.join(project, 'FrontEnd/src/config/institutionalDefaults.json'));
const root = require('./runtime.cjs').buildPath;
const output = path.join(project, 'docs/testing/evidencias/diseno-academico');
fs.mkdirSync(output, { recursive: true });
const practices = [{id:7,courseId:10,courseName:'Prácticas de informática',status:'APPROVED',courseActive:true,studentFullName:'Ana Torres',educationalInstitutionName:'Unidad Educativa de Ejemplo',academicCycleName:'Quinto ciclo',groupName:'Grupo A'}];
const accounts = [{id:2,username:'ana.torres',names:'Ana',lastNames:'Torres',roles:['ROLE_ESTUDIANTE'],enabled:true,institutionalEmail:'ana@example.test'}, {id:3,username:'andres.molina',names:'Andrés',lastNames:'Molina',roles:['ROLE_TUTOR_PRACTICAS'],enabled:true}];
(async () => {
 const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + '/') || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  const types = {'.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'};
  res.setHeader('Content-Type', types[path.extname(file)] || 'text/html'); fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const origin = 'http://127.0.0.1:' + server.address().port;
 const browser = await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const checks = [], errors = [];
 try {
  for (const mode of ['light','dark']) {
   const page = await browser.newPage();
   await page.evaluateOnNewDocument(mode => {
    localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'isolated-design-fixture'}));
    localStorage.setItem('sgp-theme-mode',mode);
    localStorage.setItem('sgp-color-theme','unl');
   }, mode);
   page.on('pageerror', error => errors.push(error.message));
   await page.setRequestInterception(true);
   page.on('request', req => {
    const url = new URL(req.url());
    if (url.pathname.startsWith('/api/')) {
     let data = [];
     if (url.pathname === '/api/public/institutional-defaults') data = defaults;
     if (url.pathname === '/api/account/me') data = {id:1,username:'design.qa',names:'Cristhian',lastNames:'Girón',roles:['ROLE_ADMIN'],institutionalEmail:'qa@example.test'};
     if (['/api/enrollments/practices','/api/enrollments/managed','/api/enrollments/me'].includes(url.pathname)) data = practices;
     if (url.pathname === '/api/account/search' || url.pathname === '/api/account') data = {content:accounts,totalElements:2,totalPages:1};
     if (url.pathname === '/api/reports/coordination') data = {summary:[],documentsByType:[],approvalsByCourse:[],reviewTimes:[]};
     if (url.pathname.endsWith('/count')) data = {count:0};
     return req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
    }
    if (url.origin !== origin) return req.abort();
    req.continue();
   });
   for (const width of [320,390,768,1440]) {
    await page.setViewport({width,height:width < 800 ? 900 : 1000});
    for (const route of ['dashboard','accounts','universities','forms','practices/7/documents/activity-plans']) {
     await page.goto(origin + '/?design=' + mode + width + route.replaceAll('/','-') + '#/' + route,{waitUntil:'networkidle0'});
     await page.waitForSelector('#sgp-main-content h1');
     const state = await page.evaluate(() => ({heading:document.querySelector('#sgp-main-content h1').textContent,overflow:document.documentElement.scrollWidth > innerWidth + 1}));
     checks.push({mode,width,route,...state});
     if (state.overflow) errors.push({mode,width,route,message:'Horizontal overflow'});
     if (['dashboard','accounts'].includes(route)) await page.screenshot({path:path.join(output,`${mode}-${width}-${route}.png`),fullPage:true});
     if (route === 'accounts') {
      await page.evaluate(() => [...document.querySelectorAll('.sgp-workflow-card')].find(button => button.textContent.startsWith('Estudiante'))?.click());
      await page.waitForSelector('button[title="Crear usuario"]');
      const listOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (listOverflow) errors.push({mode,width,message:'Account list overflow'});
      await page.screenshot({path:path.join(output,`${mode}-${width}-table.png`),fullPage:true});
      checks.push({mode,width,accountList:true,overflow:listOverflow});
      await page.click('button[title="Crear usuario"]');
      await page.waitForSelector('.sgp-modal-dialog input');
      const focusedBefore = await page.evaluate(() => document.activeElement?.tagName);
      await page.keyboard.down('Control'); await page.keyboard.press('k'); await page.keyboard.up('Control');
      if (await page.evaluate(() => document.activeElement?.id === 'global-search-input')) errors.push({mode,width,message:'Search shortcut interrupted modal'});
      const modalOverflow = await page.evaluate(() => { const modal=document.querySelector('.sgp-modal-dialog'); return modal.scrollWidth > innerWidth + 1; });
      if (modalOverflow) errors.push({mode,width,message:'Account dialog overflow'});
      await page.screenshot({path:path.join(output,`${mode}-${width}-form.png`),fullPage:true});
      await page.keyboard.press('Escape');
      checks.push({mode,width,accountDialog:true,focusedBefore,overflow:modalOverflow});
     }

    }
    await page.keyboard.down('Control'); await page.keyboard.press('k'); await page.keyboard.up('Control');
    await page.waitForFunction(() => document.activeElement?.id === 'global-search-input');
    await page.keyboard.type('prácticas'); await page.keyboard.press('Escape');
    checks.push({mode,width,keyboardSearch:true});
    if (width < 1024) {
     await page.click('button[title="Abrir menu"]');
     await page.waitForFunction(() => document.querySelector('[aria-label="Menu principal"]').getBoundingClientRect().left >= -1);
     const contrast = await page.evaluate(() => {
      const panel = document.querySelector('[aria-label="Menu principal"]');
      const rgb = color => color.match(/[0-9.]+/g).slice(0,3).map(Number).map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; });
      const luminance = color => { const [r,g,b] = rgb(color); return .2126*r + .7152*g + .0722*b; };
      const background = luminance(getComputedStyle(panel).backgroundColor);
      return [...panel.querySelectorAll('.text-unl-graphite')].map(element => {
       const text = luminance(getComputedStyle(element).color);
       return {text:element.textContent,ratio:(Math.max(text,background)+.05)/(Math.min(text,background)+.05)};
      });
     });
     if (contrast.some(item => item.ratio < 4.5)) errors.push({mode,width,message:'Low contrast in mobile navigation',contrast});
     await page.screenshot({path:path.join(output,`${mode}-${width}-menu.png`),fullPage:true});
     await page.keyboard.press('Escape');
     checks.push({mode,width,mobileMenu:true});
    }
   }
   await page.close();
  }
 } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
 fs.writeFileSync(path.join(output,'resultados.json'),JSON.stringify({checks,errors},null,2));
 console.log(JSON.stringify({checks:checks.length,errors}));
 if (errors.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
