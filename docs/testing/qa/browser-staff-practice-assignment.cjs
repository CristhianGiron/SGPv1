/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-staff-practice-assignment.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-staff-practice-assignment mediante pruebas de regresión.
 */

// Isolated UI checks: local production assets and synthetic API, no real backend.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const project=path.resolve(__dirname,'../../..');
const puppeteer=require('./runtime.cjs').puppeteer;
const root=require('./runtime.cjs').buildPath;
const output=process.env.SGP_QA_OUTPUT||'/tmp/sgp-staff-assignment-browser.json';
const origin='http://sgp-memberships.test';
const courses=[{id:10,name:'Materia en paralelo A',active:true,locked:false,capacity:30,practiceTutor:'qa.tutor'},{id:20,name:'Materia en paralelo B',active:true,locked:false,capacity:30,practiceTutor:'qa.tutor'}];
const person={id:7,username:'qa.student',names:'Ana',lastNames:'Prueba',active:true};
(async()=>{
 const browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[],checks=[],writes=[];
 try{
  for(const width of [390,1440]){
   const roster=new Map([[10,[person]],[20,[]]]);const enrollments=[];const offerings=[];const reads=[];
   async function pageFor(role){
    const page=await browser.newPage();await page.setViewport({width,height:1000});page.on('pageerror',e=>errors.push(e.message));
    await page.evaluateOnNewDocument(()=>{localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'qa-only'}));});
    await page.setRequestInterception(true);
    page.on('request',req=>{
     const url=new URL(req.url());const respond=data=>req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
     if(url.origin!==origin)return req.abort();
     if(url.pathname.startsWith('/api/')){
      if(req.method()==='GET')reads.push({role,path:url.pathname});
      if(req.method()!=='GET')writes.push({width,role,method:req.method(),path:url.pathname});
      if(url.pathname==='/api/account/me')return respond({id:role==='ROLE_ESTUDIANTE'?7:1,username:role==='ROLE_ESTUDIANTE'?'qa.student':'qa.director',names:'QA',roles:[role]});
      if(url.pathname==='/api/public/institutional-defaults')return respond({});
      if(url.pathname.includes('unread-count'))return respond(0);
      if(url.pathname==='/api/courses'||url.pathname==='/api/courses/search')return respond(role==='ROLE_ESTUDIANTE'?courses.filter(c=>roster.get(c.id).some(m=>m.active)&&!c.locked):courses);
      let match=url.pathname.match(/^\/api\/courses\/(\d+)\/students(?:\/(\d+))?$/);
      if(match){const id=Number(match[1]);if(req.method()==='PUT')roster.set(id,[person]);return respond(roster.get(id));}
      if(url.pathname.endsWith('/student-candidates'))return respond([person]);
      if(url.pathname.endsWith('/practice-roster'))return respond(roster.get(Number(url.pathname.split('/')[3]))||[]);
      if(url.pathname.endsWith('/practice-offerings')){
       if(req.method()==='POST')offerings.push({...JSON.parse(req.postData()),id:30,courseId:10,enrollmentOpen:true,assignedStudents:0});
       return respond(req.method()==='POST'?offerings.at(-1):offerings);
      }
      if(url.pathname==='/api/practice-offerings/30/students'){
       const body=JSON.parse(req.postData());assert.equal(body.studentId,7);assert.equal(body.groupId,5);
       enrollments.push({id:110,practiceId:30,practiceName:offerings[0].name,courseId:10,courseName:courses[0].name,status:'APPROVED',courseActive:true,student:'qa.student'});offerings[0].assignedStudents=1;return respond(enrollments.at(-1));
      }
      if(url.pathname==='/api/practice-offerings/30/enrollment'){offerings[0].enrollmentOpen=url.searchParams.get('open')==='true';return respond(offerings[0]);}
      if(url.pathname.endsWith('/enrollments'))return respond(enrollments);
      if(url.pathname.endsWith('/groups'))return respond([{id:5,name:'Grupo escuela',active:true,institutionalTutor:'qa.mentor'}]);
      if(url.pathname==='/api/enrollments/me'||url.pathname==='/api/enrollments/practices')return respond(enrollments);
      if(url.pathname.match(/^\/api\/courses\/\d+$/))return respond(courses.find(c=>c.id===Number(url.pathname.split('/').at(-1))));
      return respond([]);
     }
     const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
     if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return req.respond({status:404,body:''});
     req.respond({status:200,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':file.endsWith('.jpg')?'image/jpeg':'text/html',body:fs.readFileSync(file)});
    });
    return page;
   }
   const director=await pageFor('ROLE_DIRECTOR_PRACTICAS');
   await director.goto(origin+'/?qa='+Date.now()+'#/courses?courseId=10&view=manage',{waitUntil:'networkidle0'});
   await director.waitForFunction(()=>[...document.querySelectorAll('label')].some(l=>l.textContent==='Nombre de la práctica'));
   async function fillLabel(label,value){await director.evaluate((label,value)=>{const l=[...document.querySelectorAll('label')].find(l=>l.textContent===label);const input=document.getElementById(l.htmlFor);const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));},label,value);}
   await fillLabel('Nombre de la práctica','Observación docente');await fillLabel('Cupos de la práctica','10');
   await director.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Crear práctica').click());
   await director.waitForSelector('select option[value="30"]');
   checks.push({width,practiceCreated:true});
   await director.select('select:has(option[value="5"])','5');
   await director.click('[aria-label="Inscribir qa.student"]');
   await director.waitForSelector('[data-confirm-dialog="true"]');
   await director.evaluate(()=>[...document.querySelectorAll('[data-confirm-dialog="true"] button')].find(b=>b.textContent.trim()==='Asignar práctica').click());
   await director.waitForSelector('[aria-label="Inscrito qa.student"]');
   assert.equal(enrollments[0].status,'APPROVED');checks.push({width,staffAssignmentApproved:true});
   await director.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Cerrar inscripciones de la práctica').click());
   await director.waitForFunction(()=>document.body.textContent.includes('Inscripciones cerradas en esta práctica.'));
   assert.equal(offerings[0].enrollmentOpen,false);checks.push({width,enrollmentClosed:true});
   assert(await director.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push({width,staffNoHorizontalOverflow:true});
   await director.close();
   const student=await pageFor('ROLE_ESTUDIANTE');
   await student.goto(origin+'/?qa='+Date.now()+'#/practices',{waitUntil:'networkidle0'});
   await student.waitForSelector('.sgp-practice-card');
   assert(await student.evaluate(()=>document.querySelector('main').textContent.includes('Observación docente')));
   assert(!await student.evaluate(()=>/Solicitar nueva práctica|Inscribirme|Cancelar inscripción/.test(document.querySelector('main').textContent)));
   checks.push({width,studentReceivesReadyPractice:true});
   await student.click('.sgp-practice-card');
   await student.waitForFunction(()=>document.querySelector('main')?.textContent.includes('Resumen de la práctica'));
   assert(await student.evaluate(()=>document.querySelector('main').textContent.includes('Documentos y evaluación')));
   checks.push({width,workContinuesAfterEnrollmentClosure:true});
   assert(await student.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push({width,studentNoHorizontalOverflow:true});
   await student.goto(origin+'/?qa='+Date.now()+'#/courses',{waitUntil:'networkidle0'});
   assert(!await student.evaluate(()=>/Inscribirme|Crear práctica|Práctica para asignar/.test(document.querySelector('main').textContent)));
   assert(!reads.some(r=>r.role==='ROLE_ESTUDIANTE'&&r.path.startsWith('/api/courses')));
   checks.push({width,studentCannotOpenCourseManagement:true});
   await student.close();
  }
  assert.deepEqual(errors,[]);assert(!writes.some(w=>w.role==='ROLE_ESTUDIANTE'));
  fs.writeFileSync(output,JSON.stringify({checks,writes,errors},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,errors,output}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
