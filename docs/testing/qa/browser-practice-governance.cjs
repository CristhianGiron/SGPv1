/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-practice-governance.cjs
 * @fecha         2026-11-10 22:13:37
 * @nota          Comprueba el comportamiento de el módulo browser-practice-governance mediante pruebas de regresión.
 */

// Local compiled assets and synthetic data: no connection to the operational API.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const project=path.resolve(__dirname,'../../..'),puppeteer=require('./runtime.cjs').puppeteer;
const root=require('./runtime.cjs').buildPath,output=process.env.SGP_QA_OUTPUT||'/tmp/sgp-governance-browser.json';
const origin='http://sgp-governance.test';
(async()=>{
 const browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const checks=[],errors=[];
 try{
  for(const width of [390,1440]){
   const state={practice:{id:20,courseId:10,practiceName:'Práctica docente QA',courseName:'Paralelo QA',status:'APPROVED',courseActive:true,student:'ana',studentFullName:'Ana QA'},incidents:[],deadlines:[],writes:[]};
   const version={id:40,kind:'L2',documentId:50,revisionNumber:3,event:'REVIEWED',documentStatus:'APPROVED',actor:'director.qa',createdAt:'2026-11-10T12:00:00',hasPdf:true};
   const snapshot={presentation:'Contenido original aprobado por dirección',directorApproved:true,practiceTutorApproved:true,status:'APPROVED'};
   async function pageFor(role){
    const page=await browser.newPage();await page.setViewport({width,height:1000});page.on('pageerror',e=>errors.push(e.message));
    await page.evaluateOnNewDocument(()=>localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'qa-token',username:'qa'})));
    await page.setRequestInterception(true);page.on('request',req=>{
     const u=new URL(req.url());if(u.origin!==origin)return req.abort();
     const reply=data=>req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
     if(u.pathname.startsWith('/api/')){
      if(req.method()!=='GET')state.writes.push({role,path:u.pathname,method:req.method()});
      if(u.pathname==='/api/account/me')return reply({id:role==='ROLE_ESTUDIANTE'?7:9,username:role==='ROLE_ESTUDIANTE'?'ana':'director.qa',names:'Usuario QA',roles:[role]});
      if(u.pathname==='/api/public/institutional-defaults')return reply({});if(u.pathname.includes('unread-count'))return reply(0);
      if(u.pathname==='/api/enrollments/practices')return reply([state.practice]);
      if(u.pathname==='/api/enrollments/20/incidents/responsibles')return reply([{id:8,username:'tutor.qa',name:'Tutor QA'},{id:9,username:'director.qa',name:'Director QA'}]);
      if(u.pathname==='/api/courses/10/groups')return reply([{id:5,name:'Grupo receptor',active:true,institutionalTutor:'Tutora QA'}]);
      if(u.pathname==='/api/enrollments/20/incidents'){
       if(req.method()==='POST'){const b=JSON.parse(req.postData());state.incidents.push({...b,id:30,enrollmentId:20,status:'OPEN',createdBy:'ana',createdAt:'2026-11-10T12:00:00',events:[{id:1,actor:'ana',newStatus:'OPEN',reason:'Incidencia registrada',createdAt:'2026-11-10T12:00:00'}]});return reply(state.incidents.at(-1));}return reply(state.incidents);
      }
      if(u.pathname.startsWith('/api/incidents/30/')){
       const b=JSON.parse(req.postData()),i=state.incidents[0],action=u.pathname.split('/').at(-1);
       assert(b.reason.trim());if(action==='assign'){i.status='ASSIGNED';i.responsibleId=b.responsibleId;i.responsible='tutor.qa';}
       if(action==='evaluate')i.status='UNDER_REVIEW';if(action==='decide'){i.status=b.approved?'RESOLVED':'REJECTED';if(b.approved)state.practice.status='SUSPENDED';}
       i.events.push({id:i.events.length+1,actor:'director.qa',newStatus:i.status,reason:b.reason,createdAt:'2026-11-10T13:00:00'});return reply(i);
      }
      if(u.pathname==='/api/enrollments/20/document-versions')return reply([version]);
      if(u.pathname==='/api/enrollments/20/document-versions/40')return reply(snapshot);
      if(u.pathname==='/api/enrollments/20/deadlines'){
       if(req.method()==='PUT'){const b=JSON.parse(req.postData());state.deadlines=[{...b,id:60,state:'UPCOMING',responsibleUsers:['tutor.qa'],updatedBy:'director.qa'}];return reply(state.deadlines[0]);}return reply(state.deadlines);
      }
      return reply([]);
     }
     const file=path.resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return req.respond({status:404,body:''});
     req.respond({status:200,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/html',body:fs.readFileSync(file)});
    });return page;
   }
   async function open(page,route){await page.goto(origin+'/?qa='+Date.now()+'#'+route,{waitUntil:'networkidle0'});}
   async function clickText(page,text,selector='main button'){await page.waitForFunction((text,selector)=>[...document.querySelectorAll(selector)].some(el=>el.textContent.trim()===text),{},text,selector);await page.evaluate((text,selector)=>[...document.querySelectorAll(selector)].find(el=>el.textContent.trim()===text).click(),text,selector);}
   async function fill(page,label,value){await page.evaluate((label,value)=>{const l=[...document.querySelectorAll('label')].find(l=>l.textContent===label);if(!l)throw Error('Missing label '+label);const input=document.getElementById(l.htmlFor);const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:input.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,value);input.dispatchEvent(new Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));},label,value);}
   const student=await pageFor('ROLE_ESTUDIANTE');await open(student,'practices/20/incidents');
   await clickText(student,'Registrar una incidencia','main summary');await fill(student,'Tipo de incidencia','SUSPENSION');await fill(student,'Título de la incidencia','Interrupción de actividades QA');await fill(student,'Descripción de la situación','La institución necesita una suspensión temporal.');await clickText(student,'Registrar incidencia');
   await student.waitForFunction(()=>document.body.textContent.includes('Incidencia registrada. El personal académico recibirá el aviso.'));
   assert.equal(state.incidents.length,1);assert.equal(state.incidents[0].type,'SUSPENSION');checks.push({width,studentRegistersIncident:true});
   assert(!await student.evaluate(()=>[...document.querySelectorAll('main button')].some(b=>b.textContent.includes('Resolver y aplicar'))));checks.push({width,studentCannotResolve:true});await student.close();
   const director=await pageFor('ROLE_DIRECTOR_PRACTICAS');await open(director,'practices/20/incidents');
   await director.evaluate(()=>[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('Interrupción de actividades QA')).click());
   await fill(director,'Motivo o evaluación','Asignación del análisis al tutor');await fill(director,'Responsable de la incidencia','8');await clickText(director,'Asignar responsable');await director.waitForFunction(()=>document.body.textContent.includes('Iniciar evaluación'));
   await fill(director,'Motivo o evaluación','Evaluación realizada y justificada');await clickText(director,'Iniciar evaluación');await director.waitForFunction(()=>document.body.textContent.includes('Resolver y aplicar cambio'));
   await fill(director,'Motivo o evaluación','Autorizar suspensión temporal');await clickText(director,'Resolver y aplicar cambio');await director.waitForSelector('[data-confirm-dialog="true"]');await clickText(director,'Resolver incidencia','[data-confirm-dialog="true"] button');
   await director.waitForFunction(()=>document.querySelector('main [data-status="SUSPENDED"]'));
   assert.equal(state.practice.status,'SUSPENDED');assert.equal(state.incidents[0].events.length,4);checks.push({width,directorCompletesAuditedFlow:true});
   assert(await director.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push({width,incidentsNoHorizontalOverflow:true});
   // Deadline scenario uses an active practice independently from the suspension scenario.
   state.practice.status='APPROVED';await open(director,'practices/20/deadlines');await clickText(director,'Establecer o actualizar un plazo','main summary');
   await fill(director,'Documento del plazo','L2');await fill(director,'Etapa del plazo','PRACTICE_REVIEW');await fill(director,'Fecha y hora límite (Ecuador)','2026-12-01T12:00');await fill(director,'Motivo del plazo o su modificación','Calendario de revisión acordado');await clickText(director,'Guardar plazo');
   await director.waitForSelector('[data-confirm-dialog="true"]');await clickText(director,'Guardar plazo','[data-confirm-dialog="true"] button');await director.waitForFunction(()=>document.body.textContent.includes('Plazo guardado.'));
   assert.equal(state.deadlines[0].stage,'PRACTICE_REVIEW');checks.push({width,staffConfiguresDeadline:true});
   assert(await director.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push({width,deadlinesNoHorizontalOverflow:true});await director.close();
   const viewer=await pageFor('ROLE_ESTUDIANTE');await open(viewer,'practices/20/deadlines');
   await viewer.waitForFunction(()=>document.body.textContent.includes('Responsables: tutor.qa'));assert(!await viewer.evaluate(()=>[...document.querySelectorAll('main button')].some(b=>b.textContent==='Guardar plazo')));checks.push({width,studentConsultsResponsibleOnly:true});
   await open(viewer,'practices/20/document-versions');await clickText(viewer,'Consultar versión 3');await viewer.waitForFunction(()=>document.body.textContent.includes('Contenido original aprobado por dirección'));
   assert(!await viewer.$('main textarea'));checks.push({width,historicalDocumentReadOnly:true});assert(await viewer.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push({width,versionsNoHorizontalOverflow:true});await viewer.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(output,JSON.stringify({checks,errors},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,errors,output}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
