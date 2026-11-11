/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-practice-reopening.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-practice-reopening mediante pruebas de regresión.
 */

// Production-build UI check with synthetic API responses; never contacts the real backend.
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');
const project = path.resolve(__dirname, '../../..');
const puppeteer = require('./runtime.cjs').puppeteer;
const root = require('./runtime.cjs').buildPath;
const output = path.resolve(process.env.SGP_QA_OUTPUT || '/tmp/sgp-reopening-browser.json');
const practices = [
  {id:71,courseId:171,courseName:'Reapertura archivada',studentFullName:'Estudiante archivo',status:'COMPLETED',archived:true,courseActive:true},
  {id:72,courseId:172,courseName:'Reapertura inactiva',studentFullName:'Estudiante inactivo',status:'COMPLETED',archived:false,courseActive:false},
  {id:74,courseId:174,courseName:'Cierre manual',studentFullName:'Estudiante pendiente',status:'APPROVED',archived:false,courseActive:true},
  {id:73,courseId:173,courseName:'Reapertura disponible',studentFullName:'Estudiante disponible',status:'COMPLETED',archived:false,courseActive:true},
];
(async () => {
  const server = http.createServer((req,res) => {
    const pathname = new URL(req.url,'http://localhost').pathname;
    const file = path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html');
    fs.createReadStream(file).pipe(res);
  });
  let browser;
  const errors=[],checks=[],writes=[];
  try {
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    const origin='http://127.0.0.1:'+server.address().port;
    browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
    for(const width of [390,1440]){
      const page=await browser.newPage();await page.setViewport({width,height:1000});
      page.on('pageerror',e=>errors.push(e.message));
      await page.evaluateOnNewDocument(()=>localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'qa-reopening-fixture'})));
      await page.setRequestInterception(true);
      page.on('request',req=>{
        const url=new URL(req.url());
        if(url.pathname.startsWith('/api/')){
          if(req.method()!=='GET')writes.push({method:req.method(),path:url.pathname});
          let payload=[];
          if(url.pathname==='/api/account/me')payload={id:1,username:'qa.director',names:'Dirección QA',roles:['ROLE_DIRECTOR_PRACTICAS'],careerId:1};
          if(url.pathname==='/api/enrollments/practices')payload=practices;
          if(url.pathname.endsWith('/completion-summary'))payload={warnings:['L.3: documento sin registrar.','L.6 no acredita un total positivo de horas aprobado.'],approvedRecordMinutes:null,institutionalReportMinutes:null,attendanceMinutes:120};
          if(url.pathname.includes('unread-count'))payload=0;
          if(url.pathname==='/api/public/institutional-defaults')payload={};
          return req.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});
        }
        if(url.origin!==origin)return req.abort();
        req.continue();
      });
      await page.goto(origin+'/?qa='+Date.now()+'-'+width+'#/practice-archive',{waitUntil:'networkidle0'});
      await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('Reapertura disponible'));
      for(const practice of practices.filter(practice=>practice.status==='COMPLETED')){
        await page.evaluate(name=>{
          const row=[...document.querySelectorAll('tr, ul[aria-label="Resultados del listado"] > li')].find(row=>row.textContent.includes(name));
          const button=row?.querySelector('button[aria-haspopup="menu"]');
          if(!button)throw new Error('Missing practice action menu for '+name);
          button.scrollIntoView({block:'center'});button.click();
        },practice.courseName);
        await page.waitForSelector('[role="menu"]');
        const action=await page.evaluate(()=>{
          const button=[...document.querySelectorAll('[role="menu"] button')].find(button=>button.textContent.trim()==='Reabrir práctica');
          return button?{disabled:button.disabled,reason:button.title}:null;
        });
        assert(action,'Reopen action missing');
        assert.equal(action.disabled,practice.archived||!practice.courseActive);
        if(practice.archived)assert(action.reason.includes('desarchivar'));
        if(!practice.courseActive)assert(action.reason.includes('Activa el paralelo'));
        checks.push({width,practiceId:practice.id,...action});
        await page.keyboard.press('Escape');
      }
      await page.evaluate(()=>{
        const row=[...document.querySelectorAll('tr, ul[aria-label="Resultados del listado"] > li')].find(row=>row.textContent.includes('Cierre manual'));
        const button=row?.querySelector('button[aria-haspopup="menu"]');
        if(!button)throw new Error('Missing manual completion action menu');
        button.scrollIntoView({block:'center'});button.click();
      });
      await page.waitForSelector('[role="menu"]');
      await page.evaluate(()=>[...document.querySelectorAll('[role="menu"] button')].find(button=>button.textContent.trim()==='Concluir práctica').click());
      await page.waitForSelector('[data-confirm-dialog="true"]');
      const completion=await page.evaluate(()=>{
        const dialog=document.querySelector('[data-confirm-dialog="true"]');
        return {text:dialog.textContent,canConfirm:[...dialog.querySelectorAll('button')].some(button=>button.textContent.trim()==='Concluir con advertencias')};
      });
      assert(completion.text.includes('L.3: documento sin registrar.'));
      assert(completion.text.includes('L.6 no acredita'));
      assert(completion.canConfirm);
      checks.push({width,manualCompletionWarnings:true});
      await page.evaluate(()=>[...document.querySelectorAll('[data-confirm-dialog="true"] button')].find(button=>button.textContent.trim()==='Cancelar').click());
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
      assert.equal(overflow,false,'Horizontal page overflow');
      await page.close();
    }
    for(const width of [390,1440]) {
      const page=await browser.newPage();await page.setViewport({width,height:1000});
      page.on('pageerror',e=>errors.push(e.message));
      await page.evaluateOnNewDocument(()=>localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'qa-tutor-fixture'})));
      const courses=[{id:181,name:'Inscripciones abiertas QA',active:true,locked:false,practiceTutor:'qa.tutor'},{id:182,name:'Inscripciones cerradas QA',active:true,locked:true,practiceTutor:'qa.tutor'}];
      await page.setRequestInterception(true);
      page.on('request',req=>{
        const url=new URL(req.url());
        if(url.pathname.startsWith('/api/')){
          if(req.method()!=='GET')writes.push({method:req.method(),path:url.pathname});
          let payload=[];
          if(url.pathname==='/api/account/me')payload={id:2,username:'qa.tutor',names:'Tutor QA',roles:['ROLE_TUTOR_PRACTICAS']};
          if(url.pathname==='/api/courses/search')payload=courses;
          if(url.pathname.includes('unread-count'))payload=0;
          if(url.pathname==='/api/public/institutional-defaults')payload={};
          return req.respond({status:200,contentType:'application/json',body:JSON.stringify(payload)});
        }
        if(url.origin!==origin)return req.abort();req.continue();
      });
      await page.goto(origin+'/?qa='+Date.now()+'-tutor-'+width+'#/courses',{waitUntil:'networkidle0'});
      await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('Inscripciones abiertas QA'));
      for(const course of courses) {
        await page.evaluate(name=>{
          const row=[...document.querySelectorAll('tr, ul[aria-label="Resultados del listado"] > li')].find(row=>row.textContent.includes(name));
          const button=row?.querySelector('button[aria-haspopup="menu"]');if(!button)throw new Error('Missing course menu');
          button.scrollIntoView({block:'center'});button.click();
        },course.name);
        await page.waitForSelector('[role="menu"]');
        const labels=await page.evaluate(()=>[...document.querySelectorAll('[role="menu"] button')].map(button=>button.textContent.trim()));
        const wanted=course.locked?'Abrir inscripciones':'Cerrar inscripciones';
        assert(labels.includes(wanted));assert(!labels.includes('Desactivar'));assert(!labels.includes('Bloquear'));
        await page.evaluate(label=>[...document.querySelectorAll('[role="menu"] button')].find(button=>button.textContent.trim()===label).click(),wanted);
        await page.waitForSelector('[data-confirm-dialog="true"]');
        if(!course.locked)assert(await page.evaluate(()=>document.querySelector('[data-confirm-dialog="true"]').textContent.includes('continuarán su desarrollo')));
        await page.evaluate(()=>[...document.querySelectorAll('[data-confirm-dialog="true"] button')].find(button=>button.textContent.trim()==='Cancelar').click());
        checks.push({width,tutorEnrollmentAction:wanted});
      }
      await page.close();
    }
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify({checks,errors,writes},null,2)+'\n');
    console.log(JSON.stringify({checks:checks.length,errors,writes,output}));
  } finally {
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
