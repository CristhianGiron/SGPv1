/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-modal-audit.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-modal-audit mediante pruebas de regresión.
 */

// Focus, nested Escape and scroll-lock audit for the photo viewer; isolated API.
const fs=require('fs'),path=require('path'),http=require('http');
const project=path.resolve(__dirname,'../../..'),root=path.join(project,'FrontEnd/build');
const puppeteer=require(path.join(project,'FrontEnd/node_modules/puppeteer-core'));
const output=path.join(project,'docs/testing/evidencias/correcciones-2026-11-07');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD3cAAAAASUVORK5CYII=','base64');
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!f.startsWith(root+'/')||!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'})[path.extname(f)]||'text/html');fs.createReadStream(f).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const results=[],errors=[];
 try{for(const width of [390,1440]){
  const page=await browser.newPage();await page.setViewport({width,height:1000});page.on('pageerror',e=>errors.push(e.message));await page.evaluateOnNewDocument(()=>{window.auditDialogs=()=>[...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].filter(e=>!e.closest('[aria-hidden="true"],[inert],[hidden]')&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().height>0);localStorage.clear();localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'fixture'}));});
  await page.setRequestInterception(true);page.on('request',req=>{const u=new URL(req.url());if(u.origin!==origin)return req.abort();if(!u.pathname.startsWith('/api/'))return req.continue();let data=[];
   if(u.pathname==='/api/account/me')data={id:1,username:'audit',names:'Ana',roles:['ROLE_ESTUDIANTE']};
   if(u.pathname==='/api/public/institutional-defaults')data=require(path.join(project,'FrontEnd/src/config/institutionalDefaults.json'));
   if(u.pathname.startsWith('/api/enrollments'))data=[{id:7,courseName:'Práctica',status:'APPROVED',courseActive:true}];
   if(u.pathname==='/api/practice-photos/me')data=[{id:51,enrollmentId:7,courseName:'Práctica',description:'Evidencia de auditoría',originalFilename:'evidencia.png',contentUrl:'/api/practice-photos/51/content'}];
   if(u.pathname==='/api/practice-photos/51/content')return req.respond({status:200,contentType:'image/png',body:png});
   req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto(origin+'/?modal='+width+'#photos',{waitUntil:'networkidle0'});await page.waitForSelector('button[aria-label="Ver fotografia en pantalla completa"]');await page.click('button[aria-label="Ver fotografia en pantalla completa"]');await page.waitForFunction(()=>window.auditDialogs().length>0);
  const initial=await page.evaluate(()=>{const dialog=window.auditDialogs()[0];return {named:Boolean(dialog.getAttribute('aria-label')||dialog.getAttribute('aria-labelledby')),focused:dialog.contains(document.activeElement),locked:document.body.style.overflow==='hidden'};});
  await page.keyboard.press('Tab');const afterTab=await page.evaluate(()=>window.auditDialogs()[0].contains(document.activeElement));
  await page.screenshot({path:path.join(output,`visor-foco-${width}.png`)});
  await page.click('.sgp-a11y-launcher');await page.waitForSelector('.sgp-a11y-panel');await page.keyboard.press('Escape');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const nested=await page.evaluate(()=>({photoRemains:window.auditDialogs().some(e=>!e.classList.contains('sgp-a11y-dialog')),toolsClosed:!document.querySelector('.sgp-a11y-panel'),bodyOverflow:document.body.style.overflow,documentOverflow:document.documentElement.style.overflow,dialogs:window.auditDialogs().length}));
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>window.auditDialogs().length===0);
  const final=await page.evaluate(()=>({unlocked:document.body.style.overflow!=='hidden'&&document.documentElement.style.overflow!=='hidden',focusRestored:document.activeElement?.getAttribute('aria-label')==='Ver fotografia en pantalla completa'}));
  if(!initial.named||!initial.focused||!afterTab||!nested.photoRemains||!nested.toolsClosed||!final.unlocked||!final.focusRestored)errors.push({width,initial,afterTab,nested,final});
  results.push({width,final,initial,focusInsideAfterTab:afterTab,nested,scrollLockedWithNoDialog:nested.dialogs===0&&nested.bodyOverflow==='hidden'});await page.screenshot({path:path.join(output,`visor-escape-${width}.png`)});await page.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
 fs.writeFileSync(path.join(output,'visor-modales.json'),JSON.stringify({date:'2026-11-07',mode:'Chrome; isolated API',results,errors},null,2)+'\n');console.log(JSON.stringify({results,errors},null,2));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
