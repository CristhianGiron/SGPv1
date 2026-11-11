/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-routes.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-routes mediante pruebas de regresión.
 */

// Local browser QA. API fixtures never reach the real backend.
const fs=require('fs'),path=require('path'),http=require('http');
const project=path.resolve(__dirname,'../../..');
const puppeteer=require(path.join(project,'FrontEnd/node_modules/puppeteer-core'));
const root=path.join(project,'FrontEnd/build');
const {routes}=require('./check-contracts.cjs').buildConfig();
(async()=>{
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const results=[],errors=[];let interactions=0;
 try{
 for(const role of [...new Set(routes.map(r=>r.role))]){
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000});
  await page.evaluateOnNewDocument(role=>{localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'local-qa-fixture'}));localStorage.setItem('sgp-theme-mode','light');localStorage.setItem('sgp-color-theme','unl');},role);
  page.on('pageerror',e=>errors.push({role,message:e.message}));
  await page.setRequestInterception(true);
  page.on('request',req=>{const u=new URL(req.url());if(u.pathname.startsWith('/api/')){
   let value=[];
   if(u.pathname==='/api/account/me')value={id:1,username:'qa-fixture',names:'Usuario QA',lastNames:'Pruebas',roles:[role],institutionalEmail:'qa@example.test'};
   else if(u.pathname.endsWith('/count'))value={count:0};
   else if(u.pathname==='/api/reports/coordination')value={summary:[],documentsByType:[],approvalsByCourse:[],reviewTimes:[]};
   return req.respond({status:200,contentType:'application/json',body:JSON.stringify(value)});
  }if(u.origin!==origin)return req.abort();req.continue();});
  for(const entry of routes.filter(r=>r.role===role)){
   try{await page.goto(origin+'/#/'+entry.route,{waitUntil:'networkidle0',timeout:15000});await page.waitForSelector('#sgp-main-content h1',{timeout:10000});const state=await page.evaluate(()=>({heading:document.querySelector('h1')?.innerText,overflow:document.documentElement.scrollWidth>innerWidth+1}));if(state.overflow)errors.push({...entry,message:'Horizontal overflow'});results.push({...entry,...state});}
   catch(e){errors.push({...entry,message:e.message});}
  }
  if(role==='ROLE_ESTUDIANTE'){
   await page.goto(origin+'/#/accounts',{waitUntil:'networkidle0'});
   if(!(await page.$eval('h1',e=>e.textContent)).includes('Mis prácticas'))errors.push({role,message:'Restricted route was not redirected'});interactions++;
   await page.setViewport({width:390,height:844});
   await page.click('button[title="Abrir menu"]');await page.waitForFunction(()=>document.querySelector('[role="dialog"][aria-label="Menu principal"]').getBoundingClientRect().left>=0);
   await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('[role="dialog"][aria-label="Menu principal"]').parentElement.getAttribute('aria-hidden')==='true');interactions++;
   const search=await page.$('button[aria-label="Buscar en la plataforma"]');await search.click();await page.type('#global-search-input','prácticas');
   await page.evaluate(()=>{const panel=document.getElementById('global-search-input').closest('form').parentElement;[...panel.querySelectorAll('button')].find(b=>b.innerText.includes('Mis prácticas'))?.click();});
   await page.waitForFunction(()=>location.hash.includes('practices'));interactions++;
   const mobile=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(mobile)errors.push({role,message:'Mobile overflow'});
   await page.screenshot({path:'/tmp/sgp-qa-mobile.png',fullPage:true});
  }
  console.log(role+': '+results.filter(r=>r.role===role).length+' rutas');await page.close();
 }
 const report={date:'2026-11-01',mode:'Browser with isolated API fixtures; not live API authorization',routes:results.length,interactions,errors,results};
 fs.writeFileSync(path.join(project,'docs/testing/evidencias/evidencia-qa-navegacion.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({routes:results.length,interactions,errors},null,2));if(errors.length)process.exitCode=1;
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.message);process.exitCode=1});
