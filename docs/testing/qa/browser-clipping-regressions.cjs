/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-clipping-regressions.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-clipping-regressions mediante pruebas de regresión.
 */

// Shared notices inside the real SGP layout, cards and document forms.
// API responses are isolated fixtures; no real database is contacted.
const fs=require('fs'),path=require('path'),http=require('http');
const project=path.resolve(__dirname,'../../..'),root=require('./runtime.cjs').buildPath;
const puppeteer=require('./runtime.cjs').puppeteer;
const source=fs.readFileSync(path.join(project,'FrontEnd/src/config/endpointModules.js'),'utf8').replace(/export (const|function) /g,'$1 ');
const modules=new Function(source+';return DOCUMENT_MODULES;')();
const defaults=require(path.join(project,'FrontEnd/src/config/institutionalDefaults.json'));
const output=path.join(project,'docs/testing/evidencias/correcciones-2026-11-07/clipping');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'})[path.extname(file)]||'text/html');fs.createReadStream(file).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const checks=[],errors=[];
 try{
  for(const theme of ['light','dark'])for(const width of [360,390,768,1440])for(const scenario of ['pending','form','error']){
   const page=await browser.newPage();await page.setViewport({width,height:1000});
   page.on('pageerror',error=>errors.push({theme,width,scenario,message:error.message}));
   await page.evaluateOnNewDocument(theme=>{localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'fixture'}));localStorage.setItem('sgp-theme-mode',theme);},theme);
   const practice={id:7,courseId:10,courseName:'Prácticas de informática',studentFullName:'María Muñoz',status:scenario==='pending'?'PENDING':'APPROVED',courseActive:true};
   const doc={...modules[0].sample,id:21,enrollmentId:7,courseName:practice.courseName,studentFullName:practice.studentFullName,status:'DRAFT',presentation:'Presentación académica'};
   await page.setRequestInterception(true);page.on('request',req=>{
    const url=new URL(req.url());if(url.origin!==origin)return req.abort();if(!url.pathname.startsWith('/api/'))return req.continue();let data=[];
    if(url.pathname==='/api/account/me')data={id:1,username:'qa',names:'María',roles:['ROLE_ESTUDIANTE']};
    if(url.pathname==='/api/public/institutional-defaults')data=defaults;
    if(['/api/enrollments/practices','/api/enrollments/me'].includes(url.pathname))data=[practice];
    if(url.pathname.startsWith('/api/drafts/'))data={revision:0,content:null};
    if(url.pathname.startsWith('/api/activity-plans')){
     if(scenario==='error')return req.respond({status:503,contentType:'application/json',body:JSON.stringify({message:'No se pudo consultar el documento. Referencia: '+ 'referencia-academica-'.repeat(20)})});
     data=url.pathname.endsWith('/summary')?[doc]:doc;
    }
    req.respond({status:200,contentType:'application/json; charset=UTF-8',body:JSON.stringify(data)});
   });
   const route=scenario==='pending'?'practices/7':'practices/7/documents/activity-plans';
   await page.goto(origin+'/?qa='+theme+width+scenario+'#'+route,{waitUntil:'networkidle0'});
   if(scenario==='form'){
    await page.waitForFunction(()=>[...document.querySelectorAll('[role="tab"]')].some(e=>e.innerText==='Editar'));
    await page.evaluate(()=>[...document.querySelectorAll('[role="tab"]')].find(e=>e.innerText==='Editar').click());
   }
   if(scenario==='form')await page.waitForSelector('textarea');else {await page.waitForSelector('.sgp-alert');await page.$eval('.sgp-alert',e=>e.scrollIntoView({block:'center',behavior:'instant'}));}
   const result=await page.evaluate(()=>{
    const problems=[],alerts=[...document.querySelectorAll('.sgp-alert')].filter(e=>e.getBoundingClientRect().height>0);
    const rects=alerts.map(e=>e.getBoundingClientRect());
    if(document.documentElement.scrollWidth>innerWidth+1)problems.push('Horizontal overflow');
    for(let i=0;i<alerts.length;i++){
     const el=alerts[i],r=rects[i];
     for(let parent=el.parentElement;parent;parent=parent.parentElement){
      const style=getComputedStyle(parent),p=parent.getBoundingClientRect();
      if(/hidden|clip|auto|scroll/.test(style.overflowX)&&(r.left<p.left-1||r.right>p.right+1))problems.push('Horizontal ancestor clipping');
      if(/hidden|clip|auto|scroll/.test(style.overflowY)&&(r.top<p.top-1||r.bottom>p.bottom+1))problems.push('Vertical ancestor clipping');
     }
     for(let j=i+1;j<alerts.length;j++)if(Math.min(r.right,rects[j].right)-Math.max(r.left,rects[j].left)>1&&Math.min(r.bottom,rects[j].bottom)-Math.max(r.top,rects[j].top)>1)problems.push('Notices overlap');
     if(i===0)for(const [x,y]of [[r.left+14,r.top+3],[r.right-14,r.top+3],[r.left+14,r.bottom-3],[r.right-14,r.bottom-3]]){
      const hit=document.elementFromPoint(x,y);if(!el.contains(hit))problems.push('Notice border covered by '+(hit?.className||hit?.tagName||'viewport'));
     }
    }
    return {problems,alerts:rects.map(r=>({x:r.x,y:r.y,width:r.width,height:r.height})),topbar:document.querySelector('.sgp-app-topbar')?.getBoundingClientRect().bottom};
   });
   if(scenario==='pending'&&!await page.$('.sgp-alert button:not([aria-label])'))result.problems.push('Missing management action');
   checks.push({theme,width,scenario,...result});if(result.problems.length)errors.push({theme,width,scenario,problems:result.problems});
   if([390,1440].includes(width)&&scenario!=='error')await page.screenshot({path:path.join(output,`${theme}-${scenario}-${width}.png`),fullPage:true});
   await page.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 fs.writeFileSync(path.join(output,'resultado.json'),JSON.stringify({mode:'Chrome; API simulada',checks,errors},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,errors},null,2));if(errors.length)process.exitCode=1;
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
