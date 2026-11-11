/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-course-memberships.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de los paralelos académicos mediante pruebas de regresión.
 */

// Isolated UI checks: local production assets and synthetic API, no real backend.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const project=path.resolve(__dirname,'../../..');
const puppeteer=require(path.join(project,'FrontEnd/node_modules/puppeteer-core'));
const root=path.resolve(process.env.SGP_QA_BUILD_PATH||path.join(project,'FrontEnd/build'));
const output=process.env.SGP_QA_OUTPUT||'/tmp/sgp-course-memberships-browser.json';
const origin='http://sgp-memberships.test';
const courses=[{id:10,name:'Materia en paralelo A',active:true,locked:false,capacity:30,practiceTutor:'qa.tutor'},{id:20,name:'Materia en paralelo B',active:true,locked:false,capacity:30,practiceTutor:'qa.tutor'}];
const person={id:7,username:'qa.student',names:'Ana',lastNames:'Prueba',active:true};
(async()=>{
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[],checks=[],writes=[];
 try{
  for(const width of [390,1440]){
   const roster=new Map([[10,[]],[20,[]]]);const enrollments=[];
   async function pageFor(role){
    const page=await browser.newPage();await page.setViewport({width,height:1000});page.on('pageerror',e=>errors.push(e.message));
    await page.evaluateOnNewDocument(()=>{localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'qa-only'}));});
    await page.setRequestInterception(true);
    page.on('request',req=>{
     const url=new URL(req.url());const respond=data=>req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
     if(url.origin!==origin)return req.abort();
     if(url.pathname.startsWith('/api/')){
      if(req.method()!=='GET')writes.push({width,role,method:req.method(),path:url.pathname});
      if(url.pathname==='/api/account/me')return respond({id:role==='ROLE_ESTUDIANTE'?7:1,username:role==='ROLE_ESTUDIANTE'?'qa.student':'qa.director',names:'QA',roles:[role]});
      if(url.pathname==='/api/public/institutional-defaults')return respond({});
      if(url.pathname.includes('unread-count'))return respond(0);
      if(url.pathname==='/api/courses'||url.pathname==='/api/courses/search')return respond(role==='ROLE_ESTUDIANTE'?courses.filter(c=>roster.get(c.id).some(m=>m.active)&&!c.locked):courses);
      let match=url.pathname.match(/^\/api\/courses\/(\d+)\/students(?:\/(\d+))?$/);
      if(match){const id=Number(match[1]);if(req.method()==='PUT')roster.set(id,[person]);return respond(roster.get(id));}
      if(url.pathname.endsWith('/student-candidates'))return respond([person]);
      match=url.pathname.match(/^\/api\/courses\/(\d+)\/enroll$/);
      if(match){const id=Number(match[1]);enrollments.push({id:id+100,courseId:id,courseName:courses.find(c=>c.id===id).name,status:'PENDING',courseActive:true,student:'qa.student'});return respond(enrollments.at(-1));}
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
   for(const course of courses){
    await director.goto(origin+'/?qa='+Date.now()+'#/courses?courseId='+course.id+'&view=manage',{waitUntil:'networkidle0'});
    await director.waitForSelector('select option[value="7"]');
    await director.select('select:has(option[value="7"])','7');
    await director.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Asignar al paralelo').click());
    await director.waitForFunction(()=>document.body.textContent.includes('Estudiante asignado al paralelo'));
    assert.equal(roster.get(course.id).length,1);checks.push({width,assignedCourse:course.id});
   }
   await director.close();
   const student=await pageFor('ROLE_ESTUDIANTE');
   await student.goto(origin+'/?qa='+Date.now()+'#/courses',{waitUntil:'networkidle0'});
   for(const course of courses){
    await student.waitForFunction(name=>document.querySelector('main')?.textContent.includes(name),{},course.name);
    await student.evaluate(name=>{
     const row=[...document.querySelectorAll('tr, ul[aria-label="Resultados del listado"] > li')].find(row=>row.textContent.includes(name));
     const direct=[...row.querySelectorAll('button')].find(b=>b.textContent.trim()==='Inscribirme');
     if(direct){direct.scrollIntoView({block:'center'});direct.click();return;}
     const menu=row.querySelector('button[aria-haspopup="menu"]');if(!menu)throw new Error('No enrollment action');menu.scrollIntoView({block:'center'});menu.click();
    },course.name);
    const hasMenu=await student.$('[role="menu"]');
    if(hasMenu)await student.evaluate(()=>[...document.querySelectorAll('[role="menu"] button')].find(b=>b.textContent.trim()==='Inscribirme').click());
    await student.waitForSelector('[data-confirm-dialog="true"]');
    await student.evaluate(()=>[...document.querySelectorAll('[data-confirm-dialog="true"] button')].find(b=>b.textContent.trim()==='Inscribirme').click());
    await student.waitForFunction(()=>document.body.textContent.includes('Acción ejecutada'));
    checks.push({width,requestedCourse:course.id});
   }
   assert.equal(enrollments.length,2);
   await student.goto(origin+'/?qa='+Date.now()+'#/practices',{waitUntil:'networkidle0'});
   const text=await student.evaluate(()=>document.querySelector('main').textContent);
   for(const course of courses)assert(text.includes(course.name));
   checks.push({width,twoParallelPracticesVisible:true});
   enrollments.forEach(enrollment=>{enrollment.status='APPROVED';});
   await student.goto(origin+'/?qa='+Date.now()+'#/observation-forms',{waitUntil:'networkidle0'});
   await student.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='Crear ficha'));
   await student.evaluate(()=>[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Crear ficha').click());
   await student.waitForSelector('select:has(option[value="110"])');
   const selection=await student.$eval('select:has(option[value="110"])',select=>({value:select.value,options:[...select.options].map(option=>option.value)}));
   assert.equal(selection.value,'');assert(selection.options.includes('110'));assert(selection.options.includes('120'));
   await student.select('select:has(option[value="110"])','120');
   assert.equal(await student.$eval('select:has(option[value="110"])',select=>select.value),'120');
   checks.push({width,explicitPracticeSelection:true});
   assert.equal(await student.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   await student.close();
  }
  assert.deepEqual(errors,[]);
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({checks,errors,writes,api:'synthetic'},null,2)+'\n');
  console.log(JSON.stringify({checks:checks.length,errors,output}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
