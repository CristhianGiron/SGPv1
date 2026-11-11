/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-drafts-preview-archive.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-drafts-preview-archive mediante pruebas de regresión.
 */

// Real Chrome UI, two isolated browser contexts, simulated authorized API. No production data.
const fs = require('fs'), path = require('path'), http = require('http');
const project = path.resolve(__dirname, '../../..');
const puppeteer = require('./runtime.cjs').puppeteer;
const source = fs.readFileSync(path.join(project,'FrontEnd/src/config/endpointModules.js'),'utf8').replace(/export (const|function) /g,'$1 ');
const modules = new Function(source+';return DOCUMENT_MODULES;')();
const sample = modules.find(m=>m.id==='activity-plans').sample;
const practice = {id:7,courseId:10,courseName:'Prácticas de informática',studentFullName:'María Muñoz',status:'APPROVED',courseActive:true};
let document = {...sample,id:21,enrollmentId:7,courseName:practice.courseName,studentFullName:practice.studentFullName,status:'DRAFT',presentation:'Presentación inicial'};
const drafts = new Map(), requests = [], errors = [], checks = [];
const output = process.env.SGP_QA_OUTPUT_DIR || path.join(project,'docs/testing/evidencias/borradores-pdf-expediente'); fs.mkdirSync(output,{recursive:true});
(async()=>{
 const root=require('./runtime.cjs').buildPath;
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'})[path.extname(file)]||'text/html');fs.createReadStream(file).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try {
  const printer=await browser.newPage();await printer.setContent('<h1>VISTA PREVIA</h1><p>María Muñoz · Gestión de prácticas</p>');const pdf=await printer.pdf();await printer.close();
  async function pageIn(context){
   const page=await context.newPage();await page.setViewport({width:1440,height:1000});
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   await page.evaluateOnNewDocument(()=>{localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'fixture'}));localStorage.setItem('sgp-theme-mode','light');});
   await page.setRequestInterception(true);
   page.on('request',req=>{
    const url=new URL(req.url());if(url.origin!==origin&&!url.protocol.startsWith('blob'))return req.abort();
    if(!url.pathname.startsWith('/api/'))return req.continue();
    requests.push({path:url.pathname,method:req.method()});let data=[];
    const reply=(data,status=200)=>req.respond({status,contentType:'application/json; charset=UTF-8',body:JSON.stringify(data)});
    if(url.pathname.startsWith('/api/drafts/')){
     const scope=decodeURIComponent(url.pathname.slice('/api/drafts/'.length));
     let row=drafts.get(scope)||{scope,content:null,revision:0,savedAt:null};
     if(req.method()==='PUT'){
      const body=JSON.parse(req.postData());if(body.revision!==row.revision)return reply({message:'Conflicto de versión'},409);
      row={scope,...body,revision:row.revision+1,savedAt:new Date().toISOString()};drafts.set(scope,row);
     }return reply(row);
    }
    if(url.pathname==='/api/account/me')data={id:1,username:'qa',names:'María',lastNames:'Muñoz',roles:['ROLE_ESTUDIANTE']};
    if(url.pathname==='/api/public/institutional-defaults')data=require(path.join(project,'FrontEnd/src/config/institutionalDefaults.json'));
    if(['/api/enrollments/practices','/api/enrollments/me'].includes(url.pathname))data=[practice];
    if(url.pathname.endsWith('/archive.zip'))return req.respond({status:200,contentType:'application/zip',body:Buffer.from('PK fixture')});
    if(url.pathname.startsWith('/api/activity-plans')){
     if(url.pathname.endsWith('/pdf/preview'))return req.respond({status:200,contentType:'application/pdf',body:pdf});
     if(req.method()==='PUT')document={...document,...JSON.parse(req.postData()),id:21};
     data=url.pathname.endsWith('/summary')?[document]:document;
    }
    return reply(data);
   });
   await page.goto(origin+'/?qa='+Math.random()+'#practices/7/documents/activity-plans',{waitUntil:'networkidle0'});
   await click(page,'[role="tab"]','Editar');await page.waitForFunction(()=>document.body.innerText.includes('Paso 1 de'));
   return page;
  }
  async function click(page,selector,text){await page.waitForFunction(({selector,text})=>[...document.querySelectorAll(selector)].some(e=>e.innerText.trim()===text),{}, {selector,text});await page.evaluate(({selector,text})=>[...document.querySelectorAll(selector)].find(e=>e.innerText.trim()===text).click(),{selector,text});}
  async function full(page){await click(page,'button','Ver formulario completo');await page.waitForSelector('textarea:not([readonly]):not([disabled])');}
  const firstContext=await browser.createBrowserContext(), secondContext=await browser.createBrowserContext();
  const first=await pageIn(firstContext);await full(first);await first.type('textarea:not([readonly]):not([disabled])',' Avance académico de Muñoz');
  await first.waitForFunction(()=>document.body.innerText.includes('Guardado en el servidor'));checks.push('Autoguardado confirmado en el servidor');
  if(![...drafts.values()].some(d=>d.content?.includes('Avance académico de Muñoz')))throw new Error('No se recibió el texto en español');
  const second=await pageIn(secondContext);await second.waitForFunction(()=>document.body.innerText.includes('Hay un borrador guardado en el servidor'));
  await click(second,'button','Recuperar borrador');await full(second);
  if(!await second.$$eval('textarea',nodes=>nodes.some(e=>e.value.includes('Avance académico de Muñoz'))))throw new Error('No se recuperó la copia del otro equipo');checks.push('Recuperación explícita desde otro equipo sin almacenamiento local compartido');
  await first.type('textarea:not([readonly]):not([disabled])',' Edición A');await first.waitForFunction(()=>document.body.innerText.includes('Guardado en el servidor'));
  await second.type('textarea:not([readonly]):not([disabled])',' Edición B');
  await second.waitForFunction(()=>document.body.innerText.includes('Hay un borrador guardado en el servidor'));
  if(!await second.$$eval('textarea',nodes=>nodes.some(e=>e.value.includes('Edición B'))))throw new Error('El conflicto reemplazó el texto local sin permiso');
  await click(second,'button','Recuperar borrador');
  if(!await second.$$eval('textarea',nodes=>nodes.some(e=>e.value.includes('Edición A')&&!e.value.includes('Edición B'))))throw new Error('No se recuperó la versión elegida');checks.push('Conflicto entre equipos conserva la edición local hasta elegir una versión');
  await click(second,'button','Guardar y ver PDF');await second.waitForSelector('iframe[title="Documento PDF de vista previa"]');
  if(!await second.$eval('iframe[title="Documento PDF de vista previa"]',e=>e.src.startsWith('blob:')))throw new Error('El PDF debe utilizar un blob privado');checks.push('Guardar y abrir PDF autorizado en diálogo');
  await second.screenshot({path:path.join(output,'vista-previa-escritorio.png')});
  await second.setViewport({width:390,height:900});
  if(await second.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Desbordamiento en móvil');
  await second.screenshot({path:path.join(output,'vista-previa-movil.png')});checks.push('Vista previa sin desbordamiento a 390 px');
  await click(second,'button','Cerrar vista previa');await second.click('.sgp-practice-context button[aria-haspopup="menu"]');await click(second,'button','Descargar expediente');
  await second.waitForFunction(()=>!document.body.innerText.includes('Preparando expediente…'));
  if(!requests.some(r=>r.path==='/api/enrollments/7/archive.zip'))throw new Error('Falta descarga del expediente');checks.push('Descarga del expediente de la práctica seleccionada');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 const result={mode:'Chrome con API simulada; persistencia y permisos reales comprobados en integración H2',checks,errors};
 fs.writeFileSync(path.join(output,'resultado.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
