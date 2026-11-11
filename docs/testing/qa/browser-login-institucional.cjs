/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-login-institucional.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-login-institucional mediante pruebas de regresión.
 */

// Compiled React login, isolated API fixtures; never submits to UNL/CAS or the real backend.
const fs=require('fs'),path=require('path'),http=require('http');
const project=path.resolve(__dirname,'../../..');
const puppeteer=require('./runtime.cjs').puppeteer;
const defaults=require(path.join(project,'FrontEnd/src/config/institutionalDefaults.json'));
(async()=>{
 const root=require('./runtime.cjs').buildPath;
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.jpg')?'image/jpeg':'text/html');fs.createReadStream(file).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const checks=[],errors=[],external=[],submissions=[];let allowLogin=false,foreign=false;
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('sgp-theme-mode','light');window.WebSocket=class{close(){}};});
  await page.setRequestInterception(true);
  page.on('request',req=>{const url=new URL(req.url());if(url.pathname.startsWith('/api/')){
   let status=200,data=[];
   if(url.pathname==='/api/public/institutional-defaults')data=foreign?{...defaults,universityCode:'UD',universityName:'Universidad de Demostración',facultyName:'Facultad de Ciencias',careerName:'Informática'}:defaults;
   if(url.pathname==='/api/auth/login'){
    submissions.push({path:url.pathname,body:JSON.parse(req.postData())});
    status=allowLogin?200:401;data=allowLogin?{accessToken:'fixture',refreshToken:'fixture-refresh',username:'qa',passwordChangeRequired:false}:{message:'Usuario o contraseña incorrectos'};
   }
   if(url.pathname==='/api/account/me')data={id:1,username:'qa',names:'Ana',roles:['ROLE_ESTUDIANTE'],passwordChangeRequired:false};
   return req.respond({status,contentType:'application/json',body:JSON.stringify(data)});
  }if(url.origin!==origin){external.push(url.origin);return req.abort();}req.continue();});
  let visits=0;
  const visit=async()=>{await page.goto(origin+'/?qa='+(++visits)+'#/login',{waitUntil:'networkidle0'});await page.waitForSelector('#login-username');await page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});};
  for(const [width,height] of [[1440,1000],[1366,768],[1024,600],[390,844],[320,640]]){
   await page.setViewport({width,height});await visit();
   for(const mode of ['light','dark']){
    await page.evaluate(mode=>{document.documentElement.classList.toggle('dark',mode==='dark');document.documentElement.dataset.theme=mode;document.documentElement.style.colorScheme=mode;},mode);
    const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,logoLoaded:document.querySelector('.login-logo img')?.naturalWidth===300,inputs:[...document.querySelectorAll('form input')].map(node=>({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height})),submit:document.querySelector('form button[type="submit"]').getBoundingClientRect().width}));
    if(!state.logoLoaded||state.overflow||state.inputs.some(input=>input.width<180||input.height<44)||state.submit<180)errors.push({width,height,mode,...state});
    checks.push({width,height,mode,...state});await page.screenshot({path:`/tmp/sgp-login-institucional-${mode}-${width}.png`,fullPage:true});
   }
  }
  await page.setViewport({width:1366,height:768});await visit();
  await page.type('#login-username','cuenta.de.prueba');await page.type('#login-password','ClaveSoloFixture!');
  await page.click('button[aria-label="Ver contraseña"]');if(!await page.$eval('#login-password',node=>node.type==='text'))throw new Error('Password visibility failed');
  await page.click('button[aria-label="Ocultar contraseña"]');
  await page.click('button[aria-label="Información sobre Iniciar sesión"]');await page.waitForSelector('[role="dialog"]');await page.keyboard.press('Escape');await page.waitForSelector('[role="dialog"]',{hidden:true});
  await page.click('form button[type="submit"]');await page.waitForSelector('#login-error');
  const inline=await page.$eval('#login-error',node=>!!node.closest('form')&&getComputedStyle(node).position!=='fixed');if(!inline)throw new Error('Authentication error is not inline');
  await page.screenshot({path:'/tmp/sgp-login-institucional-error.png',fullPage:true});
  for(const field of ['#login-username','#login-password']){
   const previous=submissions.length;
   await page.waitForSelector('form button[type="submit"]:not(:disabled)');
   await page.focus(field);await page.keyboard.press('Enter');
   await page.waitForFunction(()=>document.querySelector('#login-error')&&!document.querySelector('form button[type="submit"]').disabled);
   if(submissions.length!==previous+1)throw new Error('Enter must submit once from '+field);
   checks.push({interaction:'Enter submits once from '+field});
  }
  allowLogin=true;await page.focus('#login-password');await page.keyboard.press('Enter');await page.waitForSelector('#sgp-main-content h1');
  if(submissions.length!==4||submissions.some(item=>item.path!=='/api/auth/login'||item.body.username!=='cuenta.de.prueba'||item.body.password!=='ClaveSoloFixture!'))throw new Error('Existing SGP authentication contract changed');
  checks.push({interaction:'Password visibility, help, inline authentication failure and successful retry'});
  await visit();await page.evaluate(()=>[...document.querySelectorAll('button')].find(node=>node.innerText.includes('Registrar estudiante')).click());await page.waitForFunction(()=>location.hash.includes('register'));await page.waitForSelector('form');checks.push({interaction:'Existing registration route'});
  foreign=true;await visit();if(!await page.evaluate(()=>document.body.innerText.includes('Universidad de Demostración')&&!document.body.innerText.includes('Universidad Nacional de Loja')))throw new Error('Institutional defaults were hard-coded');checks.push({interaction:'Configurable university identity'});
  if(external.length)errors.push({message:'Unexpected external requests',origins:external});
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 fs.writeFileSync(path.join(project,'docs/testing/evidencias/evidencia-login-institucional.json'),JSON.stringify({mode:'Isolated API fixtures',views:checks.filter(check=>check.width).length,checks,errors},null,2)+'\n');
 console.log(JSON.stringify({checks:checks.length,errors},null,2));if(errors.length)process.exitCode=1;
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
