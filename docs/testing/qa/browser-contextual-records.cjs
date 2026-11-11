/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-contextual-records.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-contextual-records mediante pruebas de regresión.
 */

// Context-aware forms and record tables; all API requests use isolated fixtures.
const fs=require('fs'),path=require('path'),http=require('http');
const project=path.resolve(__dirname,'../../..'),root=require('./runtime.cjs').buildPath;
const puppeteer=require('./runtime.cjs').puppeteer;
const output=path.join(project,'docs/testing/evidencias/contexto-y-tablas');fs.mkdirSync(output,{recursive:true});
const practices=[
 {id:7,courseId:10,courseName:'Práctica de informática A',studentFullName:'Ana Muñoz',status:'APPROVED',courseActive:true,educationalInstitutionName:'Colegio de prácticas',institutionalTutor:'Tutora asignada',institutionDirector:'Directora asignada'},
 {id:8,courseId:20,courseName:'Práctica de informática B',studentFullName:'Luis Peñafiel',status:'APPROVED',courseActive:true,educationalInstitutionName:'Otra institución',institutionalTutor:'Otra tutora'},
];
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'})[path.extname(file)]||'text/html');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const checks=[],errors=[];
 try{for(const width of [390,1440])for(const role of ['ROLE_ESTUDIANTE','ROLE_TUTOR_PRACTICAS','ROLE_TUTOR_INSTITUCIONAL','ROLE_ADMIN']){
  const page=await browser.newPage();await page.setViewport({width,height:1000});page.on('pageerror',e=>errors.push({width,role,message:e.message}));let multiple=false,visits=0;const writes=[];
  await page.evaluateOnNewDocument(()=>{localStorage.clear();localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'fixture'}));localStorage.setItem('sgp-theme-mode','light');});
  await page.setRequestInterception(true);page.on('request',async req=>{const u=new URL(req.url());if(u.origin!==origin)return req.abort();if(!u.pathname.startsWith('/api/'))return req.continue();let data=[];
   if(req.method()!=='GET'){let body;try{body=JSON.parse(req.postData());}catch{}writes.push({path:u.pathname,body});if(u.pathname==='/api/didactic-plans')data={...body,id:31,authorId:1,authorType:'STUDENT',status:'DRAFT'};}
   else if(u.pathname==='/api/account/me')data={id:1,username:'qa',names:'Ana',lastNames:'Muñoz',roles:[role]};
   else if(u.pathname==='/api/public/institutional-defaults')data=require(path.join(project,'FrontEnd/src/config/institutionalDefaults.json'));
   else if(u.pathname.startsWith('/api/enrollments'))data=multiple?practices:[practices[0]];
   else if(u.pathname.startsWith('/api/drafts/'))data={revision:0,content:null};
   else if(u.pathname.startsWith('/api/activity-plans')&&!u.pathname.includes('/defaults'))data=role==='ROLE_ESTUDIANTE'?[]:practices.map((p,i)=>({id:21+i,enrollmentId:p.id,courseName:p.courseName,studentFullName:p.studentFullName,status:'SUBMITTED',createdAt:'2026-11-07T08:00:00',title:'Plan de actividades '+(i+1)}));
   else if(u.pathname==='/api/institutions/1')data={id:1,type:'UNIVERSIDAD',name:'Universidad seleccionada'};
   else if(u.pathname==='/api/faculties')data=[{id:10,name:'Facultad de Educación',code:'FE',institutionId:1,institutionName:'Universidad seleccionada',active:true}];
   req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  const visit=async route=>{await page.goto(origin+'/?context='+role+width+(++visits)+'#'+route,{waitUntil:'networkidle0'});await page.waitForSelector('#sgp-main-content h1');};
  const click=async(selector,label)=>{const handle=await page.evaluateHandle(({selector,label})=>[...document.querySelectorAll(selector)].find(e=>e.innerText.trim()===label||e.getAttribute('aria-label')===label),{selector,label});const element=handle.asElement();if(!element)throw new Error('Missing '+label+' '+role);await element.click();await handle.dispose();};
  const check=async(label,fn)=>{const pass=await page.evaluate(fn);checks.push({role,width,label,pass});if(!pass)errors.push({role,width,label});};
  if(role==='ROLE_ESTUDIANTE'){
   await visit('photos');await click('[role="tab"]','Subir evidencia');await check('One practice needs no selector or count',()=>!document.querySelector('#sgp-main-content select')&&!document.querySelector('#sgp-main-content').innerText.includes('paralelos activos'));
   multiple=true;await visit('photos');await click('[role="tab"]','Subir evidencia');await check('Global evidence keeps multiple practice choices',()=>document.querySelector('#sgp-main-content select')?.options.length===2);
   await visit('practices/7/photos');await click('[role="tab"]','Subir evidencia');await check('Selected practice removes evidence selector',()=>!document.querySelector('#sgp-main-content select:not([aria-label="Apartado de la práctica"])'));
   await visit('practices/7/didactic-plans');await click('button','Nueva planificación');await check('Selected practice removes didactic enrollment',()=>![...document.querySelectorAll('label')].some(e=>e.innerText==='Inscripción'));
   await click('button','Guardar borrador');await page.waitForFunction(()=>document.body.innerText.includes('Borrador guardado.'));const request=writes.find(w=>w.path==='/api/didactic-plans');checks.push({role,width,label:'Hidden didactic practice retained in payload',pass:request?.body?.enrollmentId===7});if(request?.body?.enrollmentId!==7)errors.push({role,width,request});
   await visit('practices/7/documents/activity-plans');await check('Document resolves workspace without enrollment chooser',()=>!document.querySelector('select[aria-label="Selecciona tu inscripción aprobada"]')&&Boolean(document.querySelector('.sgp-document-workspace')));
   await page.screenshot({path:path.join(output,'documento-'+width+'.png')});
   await visit('documents/activity-plans');await check('Multiple practices remain selectable for new global document',()=>[...document.querySelectorAll('select')].some(e=>e.options.length===3&&[...e.options].some(o=>o.value==='8')));
   await page.evaluate(()=>{const e=[...document.querySelectorAll('select')].find(e=>e.options.length===3&&[...e.options].some(o=>o.value==='8'));e.value='8';e.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForSelector('.sgp-form-stepper');await check('Choosing a global practice unlocks the document form',()=>Boolean(document.querySelector('.sgp-form-stepper'))&&[...document.querySelectorAll('select')].some(e=>e.value==='8'));
  }else if(role==='ROLE_TUTOR_PRACTICAS'){
   multiple=true;await visit('documents/activity-plans');await check('Reviewer sees students and practices',()=>{const e=document.querySelector('table thead')||document.querySelector('ul[aria-label="Resultados del listado"]');return e?.innerText.includes('Estudiante')&&e?.innerText.includes('Paralelo');});
   await visit('practices/7/documents/activity-plans');await check('Workspace table keeps identity state and actions without repetition',()=>{const e=document.querySelector('table thead')||document.querySelector('ul[aria-label="Resultados del listado"]');return !!e&&!e.innerText.includes('Estudiante')&&!e.innerText.includes('Paralelo')&&e.innerText.includes('Documento')&&(e.innerText.includes('Estado')||Boolean(e.querySelector('.sgp-status-badge')));});
   await click('button','Más datos');await page.waitForSelector('[role="dialog"][aria-modal="true"]');await check('Supplementary fields remain accessible without clipping',()=>{const p=document.querySelector('.sgp-modal-dialog'),r=p.firstElementChild.getBoundingClientRect();return p.innerText.includes('Creado')&&r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;});await page.screenshot({path:path.join(output,'datos-'+width+'.png')});await page.keyboard.press('Escape');await check('Details restores focus and scroll',()=>document.activeElement.innerText==='Más datos'&&document.body.style.overflow!=='hidden');
  }else if(role==='ROLE_TUTOR_INSTITUCIONAL'){
   multiple=true;await visit('practices/7/didactic-plans');await click('button','Nueva planificación');await check('Tutor creates within selected practice without enrollment chooser',()=>![...document.querySelectorAll('label')].some(e=>e.innerText==='Inscripción'));
  }else{
   await visit('universities?institutionId=1');await check('Catalog removes fixed parent column',()=>![...document.querySelectorAll('th')].some(e=>e.innerText==='Universidad'));
   await click('button','Agregar');await check('Catalog form describes context without asking again',()=>{const e=document.querySelector('.sgp-modal-dialog');return e.innerText.includes('Universidad seleccionada')&&![...e.querySelectorAll('label')].some(l=>l.innerText==='Universidad');});
   await page.screenshot({path:path.join(output,'catalogo-'+width+'.png')});
  }
  await check('No page overflow',()=>document.documentElement.scrollWidth<=innerWidth+1);await page.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
 fs.writeFileSync(path.join(output,'resultado.json'),JSON.stringify({date:'2026-11-07',mode:'Chrome with isolated API fixtures',checks,errors},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,errors},null,2));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
