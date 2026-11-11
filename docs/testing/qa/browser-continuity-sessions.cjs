/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-continuity-sessions.cjs
 * @fecha         2026-11-10 21:24:04
 * @nota          Comprueba el comportamiento de el módulo browser-continuity-sessions mediante pruebas de regresión.
 */

// Local production assets and synthetic API; no operational database or credentials.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const project=path.resolve(__dirname,'../../..');
const puppeteer=require('./runtime.cjs').puppeteer;
const root=require('./runtime.cjs').buildPath;
const output=process.env.SGP_QA_OUTPUT||'/tmp/sgp-continuity-browser.json';
const origin='http://sgp-continuity.test';
const token=signature=>'header.'+Buffer.from(JSON.stringify({sid:'qa-session'})).toString('base64url')+'.'+signature;
(async()=>{
 const browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const checks=[],errors=[];
 try{
  for(const width of [390,1440]){
   async function pageFor(role){
    const page=await browser.newPage();await page.setViewport({width,height:1000});page.on('pageerror',e=>errors.push(e.message));
    await page.evaluateOnNewDocument(access=>localStorage.setItem('sgp-auth',JSON.stringify({username:'qa',accessToken:access,refreshToken:'qa-refresh'})),token('old'));
    const state={refreshes:0,returned:false,closedAll:false};
    const plan=()=>({id:10,enrollmentId:20,title:'Planificación institucional QA',authorId:3,authorName:'Tutora QA',studentName:'Ana QA',authorType:'INSTITUTIONAL_TUTOR',status:state.returned?'NEEDS_CORRECTION':'SUBMITTED',weekPlans:[],courseName:'Paralelo QA'});
    await page.setRequestInterception(true);page.on('request',req=>{
     const url=new URL(req.url());const respond=data=>req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
     if(url.origin!==origin)return req.abort();
     if(url.pathname.startsWith('/api/')){
      if(url.pathname==='/api/auth/refresh'){state.refreshes++;return respond({accessToken:token('new'),refreshToken:'qa-rotated',username:'qa'});}
      if(url.pathname==='/api/auth/logout-all'){state.closedAll=true;return respond({});}
      if(req.headers().authorization==='Bearer '+token('old'))return req.respond({status:401,contentType:'application/json',body:'{}'});
      if(url.pathname==='/api/account/me')return respond({id:2,username:'qa',names:'Usuario QA',roles:[role],passwordChangeRequired:false});
      if(url.pathname==='/api/public/institutional-defaults')return respond({});
      if(url.pathname.includes('unread-count'))return respond(0);
      if(url.pathname==='/api/didactic-plans/managed')return respond([plan()]);
      if(url.pathname==='/api/didactic-plans/10/return'){assert.equal(JSON.parse(req.postData()).reason,'Precisar objetivos');state.returned=true;return respond(plan());}
      if(url.pathname==='/api/didactic-plans/10/revisions')return respond(state.returned?[{id:7,revisionNumber:1,returnedBy:'qa',returnedAt:'2026-11-10T10:00:00',reason:'Precisar objetivos'}]:[]);
      if(url.pathname==='/api/didactic-plans/10/revisions/7')return respond({...plan(),title:'Original conservado',status:'SUBMITTED'});
      if(url.pathname==='/api/enrollments/managed')return respond([{id:20,status:'APPROVED',courseName:'Paralelo QA'}]);
      if(url.pathname==='/api/practice-forms/assigned')return respond([{id:30,enrollmentId:20,title:'Entrevista resuelta QA',status:'ANSWERED',questions:[],studentFullName:'Ana QA',courseName:'Paralelo QA'}]);
      return respond([]);
     }
     const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
     if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return req.respond({status:404,body:''});
     req.respond({status:200,contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.png')?'image/png':'text/html',body:fs.readFileSync(file)});
    });
    return {page,state};
   }
   const {page,state}=await pageFor('ROLE_DIRECTOR_PRACTICAS');
   await page.goto(origin+'/?qa='+Date.now()+'#/didactic-plans',{waitUntil:'networkidle0'});
   await page.waitForFunction(()=>[...document.querySelectorAll('main button')].some(b=>b.textContent.trim()==='Ver'));
   assert.equal(state.refreshes,1);checks.push({width,automaticRefresh:true});
   await page.evaluate(()=>[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Ver').click());
   await page.waitForFunction(()=>[...document.querySelectorAll('label')].some(l=>l.textContent==='Motivo de devolución'));
   await page.evaluate(()=>{const label=[...document.querySelectorAll('label')].find(l=>l.textContent==='Motivo de devolución');const el=document.getElementById(label.htmlFor);Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'Precisar objetivos');el.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.evaluate(()=>[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Devolver para corrección').click());
   await page.waitForSelector('[data-confirm-dialog="true"]');await page.evaluate(()=>[...document.querySelectorAll('[data-confirm-dialog="true"] button')].find(b=>b.textContent.trim()==='Devolver para corrección').click());
   await page.waitForFunction(()=>document.body.textContent.includes('Versiones enviadas conservadas (1)'));assert(state.returned);checks.push({width,planReturnedWithReason:true});
   await page.evaluate(()=>[...document.querySelectorAll('summary')].find(el=>el.textContent.includes('Versiones enviadas conservadas')).click());
   await page.evaluate(()=>[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Consultar versión 1').click());
   await page.waitForFunction(()=>document.body.textContent.includes('Original conservado'));checks.push({width,immutableRevisionVisible:true});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push({width,planNoHorizontalOverflow:true});await page.close();
   const recipient=await pageFor('ROLE_TUTOR_INSTITUCIONAL');
   await recipient.page.goto(origin+'/?qa='+Date.now()+'#/forms',{waitUntil:'networkidle0'});
   await recipient.page.waitForSelector('select[aria-label="Estado de mis entrevistas"]');
   assert(!await recipient.page.evaluate(()=>document.querySelector('main').textContent.includes('Entrevista resuelta QA')));
   await recipient.page.select('select[aria-label="Estado de mis entrevistas"]','answered');
   await recipient.page.waitForFunction(()=>document.querySelector('main').textContent.includes('Entrevista resuelta QA'));checks.push({width,answeredInterviewInHistory:true});await recipient.page.close();
   const account=await pageFor('ROLE_ESTUDIANTE');
   await account.page.goto(origin+'/?qa='+Date.now()+'#/profile',{waitUntil:'networkidle0'});
   await account.page.waitForFunction(()=>[...document.querySelectorAll('main button')].some(b=>b.textContent.trim()==='Cerrar todas mis sesiones'));
   await account.page.evaluate(()=>[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Cerrar todas mis sesiones').click());
   await account.page.waitForSelector('[data-confirm-dialog="true"]');await account.page.evaluate(()=>[...document.querySelectorAll('[data-confirm-dialog="true"] button')].find(b=>b.textContent.trim()==='Cerrar todas las sesiones').click());
   await account.page.waitForSelector('#login-username');assert(account.state.closedAll);assert.equal(await account.page.evaluate(()=>localStorage.getItem('sgp-auth')),null);checks.push({width,logoutAllReturnsToLogin:true});await account.page.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(output,JSON.stringify({checks,errors},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,errors,output}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
