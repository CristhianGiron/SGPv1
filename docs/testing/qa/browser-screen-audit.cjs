/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-screen-audit.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-screen-audit mediante pruebas de regresión.
 */

// Audit discovery: actual navigation and every currently visible tab, isolated API data.
const fs=require('fs'),path=require('path'),http=require('http');
const project=path.resolve(__dirname,'../../..'),root=require('./runtime.cjs').buildPath;
const puppeteer=require('./runtime.cjs').puppeteer;
const {routes}=require('./check-contracts.cjs').buildConfig();
const source=fs.readFileSync(path.join(project,'FrontEnd/src/config/endpointModules.js'),'utf8').replace(/export (const|function) /g,'$1 ');
const modules=new Function(source+';return [...DOCUMENT_MODULES,...SCHEDULE_MODULES];')();
const contextual=process.argv.includes('--contexts');
const output=process.env.SGP_QA_OUTPUT || path.join(project,'docs/testing/evidencias/auditoria-integral-2026-11-07');
fs.mkdirSync(path.join(output,'pantallas'),{recursive:true});
const practices=[{id:7,accountId:1,courseId:10,courseName:'Prácticas de informática',studentFullName:'Ana Muñoz',studentUsername:'audit.student',status:'APPROVED',courseActive:true,groupName:'Grupo A',educationalInstitutionName:'Colegio de prácticas',institutionalTutor:'Tutora institucional',institutionDirector:'Directora de institución'}, {id:8,courseId:20,courseName:'Práctica histórica',studentFullName:'Ana Muñoz',studentUsername:'audit.student',status:'COMPLETED',archived:true,courseActive:false}];
const college={id:2,name:'Colegio de prácticas',type:'COLEGIO',code:'COL',active:true};
const university={id:1,name:'Universidad de prueba',type:'UNIVERSIDAD',code:'UNI',active:true};
const catalog={faculties:[{id:11,name:'Facultad de Educación',code:'FE',institutionId:1,active:true}],careers:[{id:12,name:'Informática',code:'INF',facultyId:11,active:true}],'academic-cycles':[{id:13,name:'Quinto ciclo',careerId:12,active:true}],grades:[{id:14,name:'Octavo',institutionId:2,active:true}],'grade-parallels':[{id:15,name:'A',gradeId:14,institutionId:2,active:true}],subjects:[{id:16,name:'Prácticas académicas',code:'PRA',academicCycleId:13,active:true}]};
const courses=[{id:10,name:practices[0].courseName,code:'PRA-A',capacity:20,active:true,academicCycle:'Quinto ciclo',academicCycleId:13,practiceTutor:'Tutora de prácticas',practiceTutorUsername:'audit',subject:'Prácticas académicas',institutionalTutor:'Tutora institucional'}];
const plan={id:31,enrollmentId:7,authorId:1,authorName:'Ana Muñoz',authorType:'STUDENT',studentName:'Ana Muñoz',courseName:practices[0].courseName,title:'Planificación académica',status:'DRAFT',weekPlans:[]};
const form={id:41,enrollmentId:7,title:'Entrevista académica',studentFullName:'Ana Muñoz',courseName:practices[0].courseName,targetRole:'INSTITUTIONAL_TUTOR',target:'Tutora institucional',status:'SENT',questions:[],createdAt:'2026-11-07T08:00:00'};
const rowsAccount=[{id:2,username:'student.fixture',names:'Ana',lastNames:'Muñoz',roles:['ROLE_ESTUDIANTE'],enabled:true,locked:false,academicCycle:'Quinto ciclo'}];
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'})[path.extname(file)]||'text/html');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const records=[],errors=[];
 const save=()=>fs.writeFileSync(path.join(output,contextual?'contextos-modales.json':'pantallas.json'),JSON.stringify({date:'2026-11-07',mode:'Chrome with isolated fixtures; route and visible-tab discovery',records,errors},null,2)+'\n');
 try{for(const role of (contextual?['ROLE_ADMIN','ROLE_TUTOR_PRACTICAS']:[...new Set(routes.map(r=>r.role))]))for(const width of [390,1440]){
  const page=await browser.newPage();page.setDefaultTimeout(6000);await page.setViewport({width,height:1000});let currentRoute='',visit=0;
  page.on('pageerror',e=>errors.push({role,width,route:currentRoute,kind:'runtime',message:e.message}));
  await page.evaluateOnNewDocument(width=>{localStorage.clear();localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'fixture'}));localStorage.setItem('sgp-theme-mode',width<768?'dark':'light');window.WebSocket=class{close(){}};},width);
  await page.setRequestInterception(true);page.on('request',req=>{const u=new URL(req.url());if(u.origin!==origin)return req.abort();if(!u.pathname.startsWith('/api/'))return req.continue();let data=[];
   if(u.pathname==='/api/account/me')data={id:1,username:'audit',names:'Usuario',lastNames:'de auditoría',institutionalEmail:'audit@example.test',roles:[role],career:'Informática',academicCycle:'Quinto ciclo'};
   else if(u.pathname==='/api/public/institutional-defaults')data=require(path.join(project,'FrontEnd/src/config/institutionalDefaults.json'));
   else if(u.pathname==='/api/account'||u.pathname==='/api/account/search')data={content:rowsAccount,totalElements:1,totalPages:1};
   else if(u.pathname.startsWith('/api/enrollments'))data=u.pathname.endsWith('/history')?[]:practices;
   else if(u.pathname.startsWith('/api/drafts/'))data={revision:0,content:null};
   else if(u.pathname==='/api/institutions'||u.pathname==='/api/institutions/search'||u.pathname==='/api/public/institutions')data={content:[university,college],totalElements:2,totalPages:1};
   else if(u.pathname==='/api/institutions/1')data=university;
   else if(u.pathname==='/api/institutions/2')data=college;
   else if(u.pathname==='/api/courses'||u.pathname==='/api/courses/search')data={content:courses,totalElements:1,totalPages:1};
   else if(u.pathname==='/api/courses/10')data=courses[0];
   else if(u.pathname.includes('/groups'))data=[{id:17,name:'Grupo A',capacity:5,institutionalTutor:'Tutora institucional',educationalInstitutionName:college.name,active:true}];
   else if(catalog[u.pathname.split('/')[2]]){const rows=catalog[u.pathname.split('/')[2]];data=u.pathname.split('/').length>3?rows[0]:rows;}
   else if(u.pathname.startsWith('/api/didactic-plans'))data=/\/\d+$/.test(u.pathname)?plan:[plan];
   else if(u.pathname.startsWith('/api/practice-forms'))data=/\/\d+$/.test(u.pathname)?form:[form];
   else if(u.pathname==='/api/reports/coordination')data={summary:[],documentsByType:[],approvalsByCourse:[],reviewTimes:[]};
   else for(const [index,module] of modules.entries()){
    const prefix='/api/'+module.listPath.split('/')[2];if(!u.pathname.startsWith(prefix))continue;
    const doc={...module.sample,id:21+index,enrollmentId:7,courseId:10,courseName:practices[0].courseName,student:'Ana Muñoz',studentFullName:'Ana Muñoz',status:role==='ROLE_ESTUDIANTE'?'DRAFT':'SUBMITTED',createdAt:'2026-11-07T08:00:00'};
    data=u.pathname.includes('/defaults')?{...doc,id:null}:/\/\d+$/.test(u.pathname)?doc:[doc];break;
   }
   req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  const settle=async()=>{await page.waitForNetworkIdle({idleTime:80,timeout:2000}).catch(()=>{});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
  async function inspect(kind,label){await settle();const state=await page.evaluate(()=>{
   const main=document.getElementById('sgp-main-content'),visible=e=>!!e&&e.getBoundingClientRect().height>0&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[inert],[hidden],[aria-hidden="true"]');
   const dialogs=[...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].filter(visible);
   return {heading:main?.querySelector('h1')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1,
    tabs:[...main.querySelectorAll('[role="tab"]')].filter(visible).map(e=>e.innerText.trim()),
    dialogs:dialogs.map(e=>{const p=e.firstElementChild,r=p?.getBoundingClientRect();return {name:e.getAttribute('aria-label')||document.getElementById(e.getAttribute('aria-labelledby'))?.textContent,bounded:!!r&&r.left>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1,focused:e.contains(document.activeElement)};}),
    menus:[...document.querySelectorAll('[role="menu"]')].filter(visible).map(e=>e.innerText),
    unnamedInputs:[...document.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter(visible).filter(e=>!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&![...e.labels||[]].some(l=>l.textContent.trim())).map(e=>({tag:e.tagName,type:e.type,name:e.name,placeholder:e.placeholder})),
    badText:(main.innerText||'').match(/\[object Object\]|\bundefined\b|Ã[¡©­³º±]/g)||[],
    actions:[...main.querySelectorAll('button')].filter(visible).map(e=>e.getAttribute('aria-label')||e.innerText.trim()).filter(Boolean)};
  });records.push({role,width,route:currentRoute,kind,label,...state});if(state.overflow||state.badText.length||state.dialogs.some(d=>!d.bounded))errors.push({role,width,route:currentRoute,kind,label,overflow:state.overflow,badText:state.badText,dialogs:state.dialogs});
   if(state.overflow||state.badText.length||state.dialogs.some(d=>!d.bounded)||kind==='dialog')await page.screenshot({path:path.join(output,'pantallas',`${role}-${width}-${currentRoute.replace(/[^a-z0-9]+/gi,'-')}-${records.length}.png`)});save();return state;
  }
  async function open(route){currentRoute=route;await page.goto(origin+'/?audit='+role+width+(++visit)+'#'+route,{waitUntil:'networkidle0',timeout:15000});await page.waitForSelector('#sgp-main-content h1');if(contextual&&route==='accounts'){await page.waitForSelector('.sgp-workflow-card');await page.evaluate(()=>[...document.querySelectorAll('.sgp-workflow-card')].find(e=>e.innerText.startsWith('Estudiante'))?.click());}return inspect('screen','initial');}
  const ownRoutes=contextual?(role==='ROLE_ADMIN'?['courses?courseId=10&view=manage','courses?courseId=10&view=enrollments','accounts','universities?institutionId=1','universities?institutionId=1&facultyId=11','universities?institutionId=1&facultyId=11&careerId=12','institutions?institutionId=2','institutions?institutionId=2&gradeId=14&view=parallels']:['courses?courseId=10&view=manage','courses?courseId=10&view=enrollments']):routes.filter(r=>r.role===role).map(r=>r.route);
  for(const route of [...new Set(ownRoutes)]){
   try{const screen=await open(route);for(const tab of screen.tabs){await open(route);const handle=await page.evaluateHandle(tab=>[...document.querySelectorAll('#sgp-main-content [role="tab"]')].find(e=>e.innerText.trim()===tab&&!e.disabled),tab);const e=handle.asElement();if(e)await e.click();await handle.dispose();await inspect('tab',tab);if(await page.$('.sgp-modal-dialog'))await page.keyboard.press('Escape');}
    // Probe read-only opening controls without confirming writes or deleting records.
    await open(route);for(const label of (contextual?['Filtros','Agregar','Crear usuario','Crear grupo','Datos comunes','Desactivar','Bloquear']:['Filtros','Agregar','Nueva planificación'])){const handle=await page.evaluateHandle(label=>[...document.querySelectorAll('#sgp-main-content button')].find(e=>e.innerText.trim()===label&&!e.disabled&&e.getBoundingClientRect().height>0),label);const e=handle.asElement();if(e){await e.click();await inspect('dialog',label);await page.keyboard.press('Escape');}await handle.dispose();}
   }catch(e){errors.push({role,width,route,kind:'automation',message:e.message});save();}
  }
  console.log(JSON.stringify({role,width,records:records.filter(r=>r.role===role&&r.width===width).length}));await page.close();
 }}finally{save();await browser.close();await new Promise(r=>server.close(r));}
 console.log(JSON.stringify({records:records.length,screens:records.filter(r=>r.kind==='screen').length,tabs:records.filter(r=>r.kind==='tab').length,dialogs:records.filter(r=>r.kind==='dialog').length,errors:errors.length}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
