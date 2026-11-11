/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-inbox-agenda.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-inbox-agenda mediante pruebas de regresión.
 */

// This harness mocks all API requests and the WebSocket; no real accounts or data are used.
const fs=require('fs'),path=require('path'),http=require('http');
const project=path.resolve(__dirname,'../../..');
const puppeteer=require(path.join(project,'FrontEnd/node_modules/puppeteer-core'));
(async()=>{
 const root=path.join(project,'FrontEnd/build');
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[],checks=[];let role='ROLE_ESTUDIANTE',sequence=0;
 const today=new Date();const iso=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 const days=['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
 let items=[{id:1,title:'Plan de actividades aprobado',message:'Revisión completada por tu tutor de prácticas.',read:false,createdAt:iso+'T10:00:00',link:'#/practices/7'}, {id:2,title:'Jornada programada',message:'Presentarse en el laboratorio de informática.',read:false,createdAt:iso+'T09:00:00'}, {id:3,title:'Bienvenida al período académico',message:'Consulta los acuerdos para el inicio de las prácticas.',read:true,createdAt:'2026-01-01T08:00:00'}];
 const practice={id:7,courseId:10,courseName:'Prácticas de informática',studentFullName:'Ana Torres',status:'APPROVED',courseActive:true};
 const schedules=[{id:1,enrollmentId:7,courseName:'Prácticas de informática',studentFullName:'Ana Torres',periods:days.map((day,index)=>({id:index+1,dayOfWeek:day,startTime:'08:00:00',endTime:'12:00:00',place:'Laboratorio de informática'})),attendances:[{id:1,schedulePeriodId:today.getDay()+1,attendanceDate:iso,status:'PRESENT',totalMinutes:240}]},{id:2,enrollmentId:7,courseName:'Prácticas de informática',studentFullName:'Luis Vega',periods:days.map((day,index)=>({id:20+index,dayOfWeek:day,startTime:'14:00:00',endTime:'16:00:00',place:'Aula 3'})),attendances:[]}];
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.evaluateOnNewDocument(()=>{localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'fixture'}));localStorage.setItem('sgp-theme-mode','light');window.WebSocket=class{close(){}};});
  await page.setRequestInterception(true);page.on('request',req=>{const url=new URL(req.url());if(url.pathname.startsWith('/api/')){let data=[];
   if(url.pathname==='/api/account/me')data={id:1,username:'qa',names:'Ana',roles:[role]};
   if(url.pathname==='/api/notifications/me')data=items;
   if(url.pathname==='/api/notifications/me/count')data={count:items.filter(item=>!item.read).length};
   if(req.method()==='PATCH'&&url.pathname==='/api/notifications/read-all'){items=items.map(item=>({...item,read:true}));data={status:'ok'};}
   if(req.method()==='PATCH'&&/^\/api\/notifications\/\d+\/read$/.test(url.pathname)){const id=Number(url.pathname.split('/')[3]);items=items.map(item=>item.id===id?{...item,read:true}:item);data=items.find(item=>item.id===id);}
   if(url.pathname.startsWith('/api/enrollments'))data=[practice];
   if(url.pathname.startsWith('/api/practice-schedules'))data=schedules;
   return req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
  }if(url.origin!==origin)return req.abort();req.continue();});
  const visit=route=>page.goto(origin+'/?qa='+(++sequence)+'#/'+route,{waitUntil:'networkidle0'});
  const click=async(selector,text)=>{const found=await page.evaluate(({selector,text})=>{const node=[...document.querySelectorAll(selector)].find(node=>node.innerText.trim()===text||node.getAttribute('aria-label')===text);node?.click();return !!node;},{selector,text});if(!found)throw new Error('Missing control: '+text);};
  const capture=async(name)=>{await page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(overflow)errors.push(name+': horizontal overflow');checks.push(name);await page.screenshot({path:'/tmp/sgp-'+name+'.png',fullPage:true});};
  await page.setViewport({width:1440,height:1000});await visit('notifications');await page.waitForSelector('input[type="search"]');await capture('bandeja-1440');
  await click('[role="tab"]','Leídas (1)');if(!await page.evaluate(()=>document.body.innerText.includes('Bienvenida al período académico')))throw new Error('Read notification missing');await click('[role="tab"]','Todas (3)');
  await page.type('input[type="search"]','informatica');if(!await page.evaluate(()=>document.body.innerText.includes('Jornada programada')&&!document.querySelector('[aria-label="Bandeja de notificaciones"]').innerText.includes('Plan de actividades aprobado')))throw new Error('Search did not narrow notifications');
  await page.$eval('input[type="search"]',node=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(node,'');node.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.setViewport({width:390,height:1000});await capture('bandeja-390');await page.evaluate(()=>document.documentElement.classList.add('dark'));await capture('bandeja-oscuro-390');await page.evaluate(()=>document.documentElement.classList.remove('dark'));
  await click('[role="tab"]','Sin leer (2)');await click('button','Marcar todas como leídas');await page.waitForSelector('[data-confirm-dialog]');await click('[data-confirm-dialog] button','Marcar como leídas');await page.waitForFunction(()=>document.body.innerText.includes('No tienes notificaciones sin leer'));checks.push('Batch read updates inbox and empty guidance');
  role='ROLE_ADMIN';await page.setViewport({width:1440,height:1000});await visit('notifications');await click('button','Enviar aviso');await page.waitForSelector('[role="dialog"] input');await page.type('[role="dialog"] input','Aviso de prueba sin enviar');
  const focus=await page.$eval('[role="dialog"] input',node=>document.activeElement===node&&node.value==='Aviso de prueba sin enviar');if(!focus)throw new Error('Typing lost dialog focus');
  await page.keyboard.press('Tab');const trapped=await page.evaluate(()=>!!document.activeElement.closest('[role="dialog"]'));if(!trapped)throw new Error('Focus escaped dialog');await page.keyboard.press('Escape');await page.waitForSelector('[role="dialog"]',{hidden:true,timeout:5000});checks.push('Announcement dialog preserves typing focus and keyboard navigation');
  role='ROLE_ESTUDIANTE';await visit('practices/7/schedules');await page.waitForSelector('[data-status="PRESENT"]');await capture('agenda-1440');await click('button','Lista');await page.type('input[type="search"]','Luis');
  if(!await page.evaluate(()=>document.querySelector('[aria-label="Presentación de la agenda"]').parentElement.parentElement.innerText.includes('Luis Vega')&&!document.querySelector('[aria-label="Presentación de la agenda"]').parentElement.parentElement.innerText.includes('Ana Torres')))throw new Error('Agenda search leaked another matching entry');
  await page.setViewport({width:390,height:1000});await capture('agenda-lista-390');await page.evaluate(()=>document.documentElement.classList.add('dark'));await capture('agenda-lista-oscuro-390');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 fs.writeFileSync(path.join(project,'docs/testing/evidencias/evidencia-bandeja-agenda.json'),JSON.stringify({mode:'Isolated API and WebSocket fixtures',checks,errors},null,2)+'\n');console.log(JSON.stringify({checks,errors},null,2));if(errors.length)process.exitCode=1;
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
