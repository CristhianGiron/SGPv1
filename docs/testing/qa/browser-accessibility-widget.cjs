/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-accessibility-widget.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-accessibility-widget mediante pruebas de regresión.
 */

// Accessibility preferences in the actual app; isolated API and speech fixtures.
const fs=require('fs'),path=require('path'),http=require('http');
const project=path.resolve(__dirname,'../../..'),root=require('./runtime.cjs').buildPath;
const puppeteer=require('./runtime.cjs').puppeteer;
const source=fs.readFileSync(path.join(project,'FrontEnd/src/config/endpointModules.js'),'utf8').replace(/export (const|function) /g,'$1 ');
const modules=new Function(source+';return DOCUMENT_MODULES;')();
const output=path.join(project,'docs/testing/evidencias/accesibilidad');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!f.startsWith(root+'/')||!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'})[path.extname(f)]||'text/html');fs.createReadStream(f).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const checks=[],errors=[];
 try{for(const theme of ['light','dark'])for(const width of [320,390,768,1440]){
  const page=await browser.newPage();await page.setViewport({width,height:width<768?844:1000});page.on('pageerror',e=>errors.push({theme,width,message:e.message}));
  await page.evaluateOnNewDocument(theme=>{
   localStorage.clear();localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'fixture'}));localStorage.setItem('sgp-theme-mode',theme);
   window.qaSpeech={read:[],stopped:0};Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak:voice=>window.qaSpeech.read.push(voice),cancel:()=>window.qaSpeech.stopped++,pause:()=>{},resume:()=>{},getVoices:()=>[]}});window.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
  },theme);
  const practice={id:7,courseId:10,courseName:'Prácticas de informática',studentFullName:'María Muñoz',status:'APPROVED',courseActive:true};
  const doc={...modules[0].sample,id:21,enrollmentId:7,courseName:practice.courseName,studentFullName:practice.studentFullName,status:'DRAFT',presentation:'Presentación académica de Muñoz'};
  await page.setRequestInterception(true);page.on('request',req=>{const u=new URL(req.url());if(u.origin!==origin)return req.abort();if(!u.pathname.startsWith('/api/'))return req.continue();let data=[];
   if(u.pathname==='/api/account/me')data={id:1,username:'qa',names:'María',roles:['ROLE_ESTUDIANTE']};
   if(u.pathname==='/api/public/institutional-defaults')data=require(path.join(project,'FrontEnd/src/config/institutionalDefaults.json'));
   if(['/api/enrollments/practices','/api/enrollments/me'].includes(u.pathname))data=[practice];
   if(u.pathname.startsWith('/api/activity-plans'))data=u.pathname.endsWith('/summary')?[doc]:doc;
   if(u.pathname.startsWith('/api/drafts/'))data={revision:0,content:null};
   req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  async function click(selector,text){const found=await page.evaluate(({selector,text})=>{const e=[...document.querySelectorAll(selector)].find(e=>e.innerText.trim()===text||e.getAttribute('aria-label')===text);e?.click();return Boolean(e);},{selector,text});if(!found)throw new Error('Missing control '+text);}
  async function settled(){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
  async function inspect(label){await settled();await page.waitForFunction(()=>!document.querySelector('.sgp-a11y-panel')?.getAnimations().some(a=>a.playState==='running'));const failures=await page.evaluate(()=>{
   const errors=[],panel=document.querySelector('.sgp-a11y-panel');if(!panel)return ['Missing panel'];const r=panel.getBoundingClientRect();
   if(r.left<0||r.right>innerWidth+1||r.top<0||r.bottom>innerHeight+1)errors.push('Panel clipped by viewport');
   if(panel.scrollWidth>panel.clientWidth+1)errors.push('Panel horizontal overflow');
   for(const label of panel.querySelectorAll('.sgp-a11y-contrast label'))if(label.scrollWidth>label.clientWidth+1)errors.push('Contrast label overflow');
   for(const selector of ['.sgp-a11y-header button','.sgp-a11y-reset']){const e=panel.querySelector(selector),b=e.getBoundingClientRect();if(!e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)))errors.push('Covered panel action');}
   return errors;
  });checks.push({theme,width,label,errors:failures});if(failures.length)errors.push({theme,width,label,failures});}
  await page.goto(origin+'/?a11y='+theme+width+'#practices/7/documents/activity-plans',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>[...document.querySelectorAll('[role="tab"]')].some(e=>e.textContent==='Editar'));await click('[role="tab"]','Editar');await page.waitForSelector('textarea');await settled();
  const launcher=await page.$eval('.sgp-a11y-launcher',e=>{const r=e.getBoundingClientRect(),f=document.querySelector('.sgp-editor-actions')?.getBoundingClientRect();return {width:r.width,height:r.height,radius:getComputedStyle(e).borderRadius,overlap:f&&Math.min(r.right,f.right)>Math.max(r.left,f.left)&&Math.min(r.bottom,f.bottom)>Math.max(r.top,f.top)};});
  if(launcher.width!==50||launcher.height!==50||launcher.overlap)errors.push({theme,width,label:'Launcher',launcher});checks.push({theme,width,label:'Circular launcher above document actions',launcher});
  await page.click('.sgp-a11y-launcher');await page.waitForSelector('.sgp-a11y-panel');await inspect('Default panel');
  if([390,1440].includes(width))await page.screenshot({path:path.join(output,`${theme}-${width}.png`),fullPage:false});
  await page.focus('.sgp-a11y-reset');await page.keyboard.press('Tab');
  if(!await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')==='Cerrar herramientas de accesibilidad'))errors.push({theme,width,message:'Focus escaped panel'});
  await click('.sgp-a11y-contrast label','Alto contraste');await click('.sgp-a11y-contrast label','Invertir colores');await click('button','Escala de grises');
  const effects=await page.evaluate(()=>({exclusive:!document.documentElement.classList.contains('aw-high-contrast')&&document.documentElement.classList.contains('aw-negative-contrast'),mainFilter:getComputedStyle(document.getElementById('root')).filter,overlay:getComputedStyle(document.querySelector('.sgp-a11y-color-filter')).pointerEvents}));
  if(!effects.exclusive||effects.mainFilter!=='none'||effects.overlay!=='none')errors.push({theme,width,message:'Visual effects alter positioning',effects});await inspect('Combined color filters');
  await click('button','Restablecer ajustes');
  for(let i=0;i<10;i++)await click('button','Aumentar tamaño del texto');
  await inspect('Text scale 200%');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)errors.push({theme,width,message:'Page overflows at 200% text'});
  await click('button','Restablecer ajustes');await click('button','Subrayar enlaces');
  await page.keyboard.press('Escape');
  if(!await page.evaluate(()=>document.activeElement?.classList.contains('sgp-a11y-launcher')))errors.push({theme,width,message:'Focus did not return to launcher'});
  await page.click('.sgp-a11y-launcher');await click('summary','Lectura en voz alta');await click('button','Leer contenido');
  const speech=await page.evaluate(()=>window.qaSpeech.read.at(-1)?.text||'');if(!speech.includes('Plan de Actividades')||speech.includes('Tamaño del contenido')||speech.includes('Menu principal'))errors.push({theme,width,message:'Speech reads the wrong region',speech:speech.slice(0,160)});
  await click('button','Pausar');await click('button','Continuar');await click('button','Detener');
  await click('button','Restablecer ajustes');await page.keyboard.press('Escape');
  await page.click('button[aria-label^="Información sobre"]');await page.waitForSelector('.sgp-modal-dialog');await page.click('.sgp-a11y-launcher');await page.keyboard.press('Escape');
  const nested=await page.evaluate(()=>{const parent=document.querySelector('.sgp-modal-dialog');return {exists:Boolean(parent),focused:parent?.contains(document.activeElement),locked:document.body.style.overflow==='hidden'};});
  if(!nested.exists||!nested.focused||!nested.locked)errors.push({theme,width,message:'Closing tools disturbed parent dialog',nested});
  await page.keyboard.press('Escape');checks.push({theme,width,label:'Keyboard, speech controls, parent dialog and reset',effects});
  if(width<1024){
   await page.click('button[title="Abrir menu"]');await page.click('.sgp-a11y-launcher');await page.keyboard.press('Escape');
   const menu=await page.evaluate(()=>{const e=document.querySelector('[aria-label="Menu principal"]');return {visible:!e.closest('[aria-hidden="true"],[inert]'),focused:e.contains(document.activeElement),locked:document.body.style.overflow==='hidden'};});
   if(!menu.visible||!menu.focused||!menu.locked)errors.push({theme,width,message:'Accessibility Escape closed the mobile menu',menu});
   await page.keyboard.press('Escape');if(await page.evaluate(()=>document.body.style.overflow==='hidden'))errors.push({theme,width,message:'Mobile menu left scrolling locked'});
   checks.push({theme,width,label:'Escape closes accessibility before mobile navigation'});
  }
  await page.close();
 }}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 fs.writeFileSync(path.join(output,'resultado.json'),JSON.stringify({mode:'Chrome; isolated API and simulated speech',checks,errors},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,errors},null,2));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
