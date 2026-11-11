/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-practice-experience.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-practice-experience mediante pruebas de regresión.
 */

// UI checks with isolated API fixtures; no requests reach the real database.
const fs = require('fs'), path = require('path'), http = require('http');
const project = path.resolve(__dirname, '../../..');
const puppeteer = require('./runtime.cjs').puppeteer;
const source = fs.readFileSync(path.join(project,'FrontEnd/src/config/endpointModules.js'),'utf8').replace(/export (const|function) /g,'$1 ');
const modules = new Function(source+';return DOCUMENT_MODULES;')();
const sample = modules[0].sample;
const practice = {id:7,courseId:10,courseName:'Prácticas de informática',studentFullName:'Ana Torres',status:'APPROVED',courseActive:true,enrolledAt:'2026-09-01T10:00:00'};
const today = new Date();const iso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
const schedule = {id:11,enrollmentId:7,courseName:practice.courseName,studentFullName:practice.studentFullName,startDate:'2026-01-01',endDate:'2027-12-31',periods:['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].map((day,index)=>({id:index+1,dayOfWeek:day,startTime:'08:00:00',endTime:'12:00:00',place:'Laboratorio'})),attendances:[{id:1,status:'PRESENT',totalMinutes:240,attendanceDate:iso}]};
(async()=>{
 const root=require('./runtime.cjs').buildPath;
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[],checks=[],requests=[];let role='ROLE_ESTUDIANTE',partial=false;
 const doc=()=>({...sample,id:21,enrollmentId:7,courseName:practice.courseName,studentFullName:practice.studentFullName,status:role==='ROLE_ESTUDIANTE'?'DRAFT':'SUBMITTED',presentation:'Presentación inicial',createdAt:'2026-10-01T10:00:00',submittedAt:role==='ROLE_ESTUDIANTE'?null:'2026-10-02T10:00:00'});
 try {
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000});
  page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await page.evaluateOnNewDocument(()=>{localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'fixture'}));localStorage.setItem('sgp-theme-mode','light');});
  await page.setRequestInterception(true);
  page.on('request',req=>{const url=new URL(req.url());if(url.pathname.startsWith('/api/')){
   requests.push({role,path:url.pathname});let data=[];
   if(url.pathname==='/api/account/me')data={id:role==='ROLE_ESTUDIANTE'?1:2,username:'qa',names:'Ana',roles:[role]};
   if(['/api/enrollments/practices','/api/enrollments/me','/api/enrollments/managed'].includes(url.pathname))data=[practice];
   if(url.pathname.startsWith('/api/activity-plans')){
    if(partial)return req.respond({status:503,contentType:'application/json',body:JSON.stringify({message:'Consulta temporalmente no disponible'})});
    data=url.pathname.endsWith('/summary')?[doc()]:doc();
   }
   if(url.pathname.startsWith('/api/final-reports')){const record={...modules.find(module=>module.id==='final-reports').sample,...doc(),id:22,status:'SUBMITTED'};data=url.pathname.endsWith('/summary')?[record]:record;}
   if(url.pathname.startsWith('/api/practice-schedules'))data=[schedule];
   if(url.pathname==='/api/enrollments/7/history')data=[{id:1,enrollmentId:7,action:'REOPEN_PRACTICE',createdAt:'2026-10-03T10:00:00',actorName:'Dirección de prácticas',details:'Reapertura autorizada'}];
   return req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
  }if(url.origin!==origin)return req.abort();req.continue();});
  let sequence=0;
  const visit=route=>page.goto(origin+'/?qa='+(++sequence)+'#/'+route,{waitUntil:'networkidle0'});
  const waitText=async text=>{try{await page.waitForFunction(text=>document.body.innerText.includes(text),{},text);}catch(error){throw new Error('Missing text: '+text,{cause:error});}};
  const click=async(selector,text)=>{const found=await page.evaluate(({selector,text})=>{const node=[...document.querySelectorAll(selector)].find(node=>node.innerText.trim()===text||node.getAttribute('aria-label')===text);node?.click();return !!node;},{selector,text});if(!found)throw new Error('Missing control: '+text);};
  const geometry=async(label)=>{const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)errors.push(label+': horizontal overflow');checks.push(label);};
  await visit('practices/7');await waitText('Continúa tu borrador');await waitText('4 h 0 min');await geometry('Student practice overview desktop');await page.screenshot({path:'/tmp/sgp-experiencia-resumen-1440.png',fullPage:true});
  await page.setViewport({width:390,height:1000});await geometry('Student practice overview mobile');await page.screenshot({path:'/tmp/sgp-experiencia-resumen-390.png',fullPage:true});await page.setViewport({width:1440,height:1000});
  partial=true;await visit('practices/7');await waitText('Resumen parcial');checks.push('Partial API failure is explicit');partial=false;
  await visit('practices/7/documents/activity-plans');
  await page.waitForFunction(()=>[...document.querySelectorAll('[role="tab"]')].some(tab=>tab.innerText==='Editar'));
  await click('[role="tab"]','Editar');await waitText('Paso 1 de');await click('button','Ver formulario completo');
  const editable=await page.$('textarea:not([disabled]):not([readonly])');if(!editable)throw new Error('No editable document content');await editable.type(' Texto recuperable de QA');
  await page.waitForFunction(()=>Object.keys(localStorage).some(key=>key.startsWith('sgp:draft:')&&localStorage.getItem(key).includes('Texto recuperable de QA')));
  await page.reload({waitUntil:'networkidle0'});await click('[role="tab"]','Editar');await waitText('Hay una copia local');await click('button','Recuperar borrador');await click('button','Ver formulario completo');
  const recovered=await page.$$eval('textarea',nodes=>nodes.some(node=>node.value.includes('Texto recuperable de QA')));if(!recovered)throw new Error('Draft recovery lost content');checks.push('Guided form local draft survives reload and recovery');
  await page.screenshot({path:'/tmp/sgp-experiencia-formulario.png',fullPage:true});
  await visit('practices/7/schedules');await waitText('Agenda semanal');await geometry('Student weekly agenda');await click('[role="tab"]','Jornadas y asistencias');await waitText('Asistencias y faltas');checks.push('Student agenda retains attendance table');
  role='ROLE_TUTOR_PRACTICAS';await visit('practices/7/documents/activity-plans');await page.waitForSelector('tbody button[aria-haspopup="menu"]');await page.click('tbody button[aria-haspopup="menu"]');await click('[role="menu"] button','Revisar');await waitText('Documento a revisar');await page.evaluate(()=>[...document.querySelectorAll('details > summary')].find(node=>node.textContent.startsWith('Presentación'))?.click());await page.click('details[open] button[aria-label="Abrir retroalimentación"]');await page.type('details[open] textarea','Observación de prueba QA');if(!await page.$eval('details[open] textarea',node=>node.value.includes('Observación de prueba QA')))throw new Error('Feedback accordion lost the edited text');checks.push('Tutor feedback remains editable inside accordion');await page.evaluate(()=>document.querySelector('details[open] > summary')?.click());await geometry('Tutor split review desktop');
  await page.screenshot({path:'/tmp/sgp-experiencia-revision.png',fullPage:true});await page.setViewport({width:390,height:1000});await geometry('Tutor split review mobile');await page.setViewport({width:1440,height:1000});
  role='ROLE_TUTOR_INSTITUCIONAL';await visit('practices/7/documents/final-reports');await page.waitForSelector('tbody button[aria-haspopup="menu"]');await page.click('tbody button[aria-haspopup="menu"]');await click('[role="menu"] button','Acciones');await waitText('Documento a revisar');await geometry('Institutional tutor split review');
  role='ROLE_DIRECTORA_INSTITUCION';await visit('schedules');await click('[role="tab"]','Agenda semanal');await page.waitForSelector('button[aria-label="Semana siguiente"]');
  if(!requests.some(request=>request.role===role&&request.path==='/api/practice-schedules/institution-review'))throw new Error('Institution director agenda did not use its authorized endpoint');
  if(requests.some(request=>request.role===role&&request.path==='/api/practice-schedules/review'))throw new Error('Institution director requested another role endpoint');checks.push('Institution director agenda uses authorized source');
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
 fs.writeFileSync(path.join(project,'docs/testing/evidencias/evidencia-experiencia-practicas.json'),JSON.stringify({mode:'Isolated API fixtures',checks,errors},null,2)+'\n');console.log(JSON.stringify({checks,errors},null,2));if(errors.length)process.exitCode=1;
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
