/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-mobile-records.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-mobile-records mediante pruebas de regresión.
 */

// Responsive record lists with isolated admin API fixtures.
const fs=require('fs'),path=require('path'),http=require('http');
const project=path.resolve(__dirname,'../../..'),root=path.join(project,'FrontEnd/build');
const puppeteer=require(path.join(project,'FrontEnd/node_modules/puppeteer-core'));
const output=path.join(project,'docs/testing/evidencias/mejoras-ux');fs.mkdirSync(output,{recursive:true});
const rows=[{id:2,username:'maria',names:'María',lastNames:'Muñoz',roles:['ROLE_ESTUDIANTE'],enabled:true},{id:3,username:'luis',names:'Luis',lastNames:'Peñafiel',roles:['ROLE_ESTUDIANTE'],enabled:false}];
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'})[path.extname(file)]||'text/html');fs.createReadStream(file).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const checks=[],errors=[];
 try{for(const theme of ['light','dark'])for(const width of [360,390,1440]){
  const page=await browser.newPage();await page.setViewport({width,height:1000});page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(theme=>{localStorage.clear();localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'fixture'}));localStorage.setItem('sgp-theme-mode',theme);},theme);
  await page.setRequestInterception(true);page.on('request',req=>{const u=new URL(req.url());if(u.origin!==origin)return req.abort();if(!u.pathname.startsWith('/api/'))return req.continue();let data=[];
   if(u.pathname==='/api/account/me')data={id:1,username:'qa',names:'Administración QA',roles:['ROLE_ADMIN']};
   else if(u.pathname.startsWith('/api/account'))data={content:rows,totalElements:2,totalPages:1};
   if(u.pathname==='/api/public/institutional-defaults')data=require(path.join(project,'FrontEnd/src/config/institutionalDefaults.json'));
   req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto(origin+'/?qa='+theme+width+'#accounts',{waitUntil:'networkidle0'});
  await page.waitForFunction(()=>[...document.querySelectorAll('.sgp-workflow-card')].some(e=>e.innerText.startsWith('Estudiante')));
  await page.evaluate(()=>[...document.querySelectorAll('.sgp-workflow-card')].find(e=>e.innerText.startsWith('Estudiante')).click());
  await page.waitForSelector(width<640?'ul[aria-label="Resultados del listado"]':'table');
  await page.type('.sgp-toolbar-search input','Muñoz');
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(e=>e.innerText.trim()==='Abrir maria'));
  const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,body:document.querySelector('ul[aria-label="Resultados del listado"]')?.textContent||document.querySelector('tbody')?.textContent}));
  if(result.overflow||result.body.includes('Peñafiel')||!result.body.includes('María'))errors.push({theme,width,...result});
  await page.screenshot({path:path.join(output,`listado-${theme}-${width}.png`),fullPage:false});
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(e=>e.innerText.trim()==='Abrir maria').click());
  await page.waitForFunction(()=>[...document.querySelectorAll('h1')].some(e=>e.textContent.includes('María Muñoz')));
  checks.push({theme,width,filteredNameVisible:true,openRecord:true,...result});await page.close();
 }}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
 fs.writeFileSync(path.join(output,'listados.json'),JSON.stringify({mode:'Chrome; API simulada',checks,errors},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,errors},null,2));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
