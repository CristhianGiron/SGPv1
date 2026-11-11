/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-motion-regressions.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-motion-regressions mediante pruebas de regresión.
 */

// Actual browser geometry and animation regression checks with isolated fixtures.
const fs = require('fs'), path = require('path'), http = require('http');
const project = path.resolve(__dirname, '../../..');
const puppeteer = require(path.join(project, 'FrontEnd/node_modules/puppeteer-core'));
const defaults = require(path.join(project, 'FrontEnd/src/config/institutionalDefaults.json'));
const root = path.join(project, 'FrontEnd/build');
const debug = process.argv.includes('--debug');
const output = debug ? '/tmp/sgp-motion-debug' : path.join(project, 'docs/testing/evidencias/movimiento-interfaz');
fs.mkdirSync(output, { recursive: true });
const imageFixture = fs.readFileSync(path.join(project, 'FrontEnd/src/assets/branding/unl-logo.png'));
(async () => {
 const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + (req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + '/') || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', ({'.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)] || 'text/html');
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 const origin = 'http://127.0.0.1:' + server.address().port;
 const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const checks = [], errors = [];
 try {
  for (const mode of (debug ? ['light'] : ['light','dark'])) for (const photo of (debug ? [false] : [false,true])) for (const width of (debug ? [1440] : [390,1024,1440])) {
   const page = await browser.newPage(); await page.setViewport({width,height:1000});
   await page.evaluateOnNewDocument(mode => { localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'geometry-fixture'})); localStorage.setItem('sgp-theme-mode',mode); },mode);
   page.on('pageerror', error => errors.push(error.message));
   await page.setRequestInterception(true);
   page.on('request', req => {
    const url = new URL(req.url());
    if (url.pathname === '/api/account/1/image') return req.respond({status:200,contentType:'image/png',body:imageFixture});
    if (url.pathname.startsWith('/api/')) {
     let data = [];
     if (url.pathname === '/api/account/me') data = {id:1,username:'geometry.qa',names:'María Fernanda',lastNames:'de los Ángeles Torres Zambrano',roles:['ROLE_ADMIN'],profileImageUrl:photo ? '/api/account/1/image' : null};
     if (url.pathname === '/api/public/institutional-defaults') data = defaults;
     return req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
    }
    if (url.origin !== origin) return req.abort(); req.continue();
   });
   await page.goto(origin + '/?geometry=' + mode + photo + width + '#/dashboard',{waitUntil:'networkidle0'});
   await page.waitForSelector('.sgp-workflow-card');
   if (width < 1024) await page.click('button[title="Abrir menu"]');
   if (photo) await page.waitForFunction(() => [...document.querySelectorAll('img.sgp-avatar')].some(image => image.complete && image.naturalWidth > 0));
   const avatars = await page.evaluate(() => {
    const visible = [...document.querySelectorAll('.sgp-avatar')].filter(element => !element.closest('[inert], [aria-hidden="true"]'));
    const result = visible.map(element => { const box = element.getBoundingClientRect(); return {tag:element.tagName,width:box.width,height:box.height}; });
    // Stress the real rendered avatar in a deliberately crowded flex row.
    const fixture = document.createElement('div'); fixture.style.cssText = 'display:flex;width:45px;position:fixed;left:20px;top:100px';
    const clone = visible[0].cloneNode(true); fixture.append(clone);
    const text = document.createElement('span'); text.textContent = 'Nombre institucional muy largo'; text.style.whiteSpace='nowrap'; fixture.append(text);
    document.body.append(fixture); const box = clone.getBoundingClientRect(); result.push({tag:'crowded-flex',width:box.width,height:box.height}); fixture.remove();
    return result;
   });
   if (!avatars.length || avatars.some(avatar => Math.abs(avatar.width - avatar.height) > .25)) errors.push({mode,photo,width,message:'Non-circular avatar',avatars});
   checks.push({mode,photo,width,avatars});
   if (width < 1024) await page.keyboard.press('Escape');
   const card = await page.$('.sgp-workflow-card'); const before = await card.boundingBox(); await card.hover();
   const after = await page.evaluate(async () => {
    await new Promise(resolve => { const started=performance.now(); function frame() { if(performance.now()-started>300) resolve(); else requestAnimationFrame(frame); } requestAnimationFrame(frame); });
    const card=document.querySelector('.sgp-workflow-card'), box=card.getBoundingClientRect(); return {x:box.x,y:box.y,width:box.width,height:box.height,transform:getComputedStyle(card).transform};
   });
   if (['x','y','width','height'].some(key => Math.abs(before[key]-after[key])>.25) || after.transform !== 'none') errors.push({mode,photo,width,message:'Card geometry changed on hover',before,after});
   checks.push({mode,photo,width,hoverStable:true});
   if (width >= 1024) {
    for (const collapse of [true,false]) {
     await page.click(`button[title="${collapse ? 'Contraer' : 'Expandir'} menu"]`);
     const frames = await page.evaluate(() => new Promise(resolve => {
      const frames=[], start=performance.now();
      function sample() {
       const sidebar=document.querySelector('.sgp-sidebar-desktop');
       frames.push({time:performance.now()-start,sidebar:sidebar.getBoundingClientRect().width,content:document.querySelector('.sgp-layout-body').getBoundingClientRect().left,topbar:parseFloat(getComputedStyle(document.querySelector('.sgp-app-topbar')).marginLeft),iconY:sidebar.querySelector('.sgp-sidebar-item svg').getBoundingClientRect().y});
       if(performance.now()-start<360) requestAnimationFrame(sample); else resolve(frames);
      } requestAnimationFrame(sample);
     }));
     if (frames.some(frame => Math.abs(frame.sidebar-frame.content)>1 || Math.abs(frame.sidebar-frame.topbar)>1)) errors.push({mode,photo,width,collapse,message:'Sidebar and content animations are out of sync',frames});
     if(Math.max(...frames.map(frame=>frame.iconY))-Math.min(...frames.map(frame=>frame.iconY))>1) errors.push({mode,photo,width,collapse,message:'Navigation icons jumped vertically',frames});
     const expected=collapse ? 76 : 260;
     if(Math.abs(frames.at(-1).sidebar-expected)>1) errors.push({mode,photo,width,collapse,message:'Wrong final sidebar width',frames});
     const iconBounds = await page.$eval('.sgp-sidebar-item', button => {
      const box=button.getBoundingClientRect(), icon=button.querySelector('svg').getBoundingClientRect();
      return {left:icon.left-box.left,right:box.right-icon.right,top:icon.top-box.top,bottom:box.bottom-icon.bottom};
     });
     if(Object.values(iconBounds).some(value=>value<1)) errors.push({mode,photo,width,collapse,message:'Clipped navigation icon',iconBounds});
     const endGeometry = await page.evaluate(() => {
      const body=document.querySelector('.sgp-layout-body'), canvas=document.querySelector('#sgp-main-content');
      return {scrollX, viewport:innerWidth, body:body.getBoundingClientRect().toJSON(), canvas:canvas.getBoundingClientRect().toJSON(), padding:getComputedStyle(body).padding, canvasMargins:[getComputedStyle(canvas).marginLeft,getComputedStyle(canvas).marginRight]};
     });
     if(debug) console.log(JSON.stringify({collapse,endGeometry}));
     checks.push({mode,photo,width,collapse,frames,iconBounds,endGeometry});
    }
    if (!photo && width === 1440) await page.screenshot({path:path.join(output,`${mode}-expanded.png`),fullPage:true});
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.click('button[title="Contraer menu"]');
    const duration=await page.$eval('.sgp-sidebar-desktop',element=>getComputedStyle(element).transitionDuration);
    if(duration !== '0s') errors.push({mode,photo,width,message:'Reduced motion was not respected',duration});
    checks.push({mode,photo,width,reducedMotion:true});
    // Full-page capture can change viewport/compositor state; do it after frame measurements.
    if (!photo && width === 1440) await page.screenshot({path:path.join(output,`${mode}-collapsed.png`),fullPage:true});
   }
   await page.close();
  }
 } finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
 fs.writeFileSync(path.join(output,'resultados.json'),JSON.stringify({checks,errors},null,2));
 console.log(JSON.stringify({checks:checks.length,errors})); if(errors.length) process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
