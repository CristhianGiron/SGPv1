/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-account-appearance.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de las cuentas de usuario mediante pruebas de regresión.
 */

// Account and appearance in Chrome, with isolated API fixtures.
const fs=require('fs'),path=require('path'),http=require('http');
const project=path.resolve(__dirname,'../../..'),root=path.join(project,'FrontEnd/build');
const puppeteer=require(path.join(project,'FrontEnd/node_modules/puppeteer-core'));
const output=path.join(project,'docs/testing/evidencias/cuenta-apariencia');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!f.startsWith(root+'/')||!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'})[path.extname(f)]||'text/html');fs.createReadStream(f).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const checks=[],errors=[];
 try{for(const theme of ['light','dark'])for(const width of [320,390,768,1440]){
  const page=await browser.newPage();await page.setViewport({width,height:width<768?844:1000});page.on('pageerror',e=>errors.push({theme,width,message:e.message}));
  await page.evaluateOnNewDocument(()=>{if(!sessionStorage.getItem('qa-initialized')){localStorage.clear();localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'fixture'}));sessionStorage.setItem('qa-initialized','yes');}});
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:theme}]);
  await page.setRequestInterception(true);page.on('request',req=>{const u=new URL(req.url());if(u.origin!==origin)return req.abort();if(!u.pathname.startsWith('/api/'))return req.continue();let data=[];
   if(u.pathname==='/api/account/me')data={id:1,username:'maria.munoz@unl.edu.ec',institutionalEmail:'maria.munoz.apellido.largo@unl.edu.ec',names:'María Fernanda',lastNames:'Muñoz Rodríguez Zambrano',roles:['ROLE_ESTUDIANTE','ROLE_DOCENTE']};
   if(u.pathname==='/api/public/institutional-defaults')data=require(path.join(project,'FrontEnd/src/config/institutionalDefaults.json'));
   req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  const click=async(selector,text)=>{if(!await page.evaluate(({selector,text})=>{const e=[...document.querySelectorAll(selector)].find(e=>e.innerText.trim()===text||e.getAttribute('aria-label')===text);e?.click();return Boolean(e);},{selector,text}))throw new Error('Missing '+text);};
  const assert=async(label,fn)=>{const pass=await page.evaluate(fn);checks.push({theme,width,label,pass});if(!pass)errors.push({theme,width,label});};
  async function inspect(label){await page.waitForFunction(()=>!document.querySelector('.sgp-account-panel')?.getAnimations().some(a=>a.playState==='running'));await assert(label,()=>{const p=document.querySelector('.sgp-account-panel'),r=p.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1&&p.scrollWidth<=p.clientWidth+1&&[...p.querySelectorAll('.sgp-account-close,.sgp-account-footer button')].every(e=>{const b=e.getBoundingClientRect();return e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));})&&[...document.querySelectorAll('.sgp-account-trigger .sgp-avatar,.sgp-account-header .sgp-avatar')].every(e=>{const b=e.getBoundingClientRect();return Math.abs(b.width-b.height)<1;});});}
  await page.goto(origin+'/?account='+theme+width+'#dashboard',{waitUntil:'networkidle0'});await page.waitForSelector('.sgp-account-trigger');await page.click('.sgp-account-trigger');await page.waitForSelector('.sgp-account-panel');await inspect('Panel fits, actions exposed and avatars square');
  if([390,1440].includes(width))await page.screenshot({path:path.join(output,`${theme}-${width}.png`)});
  await click('.sgp-appearance-modes label','Oscuro');await assert('Explicit dark applied and persisted',()=>localStorage.getItem('sgp-theme-mode')==='dark'&&document.documentElement.dataset.theme==='dark');
  await click('.sgp-appearance-modes label','Sistema');await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}]);await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');await assert('System follows device without changing preference',()=>localStorage.getItem('sgp-theme-mode')==='system');
  await click('.sgp-appearance-modes label','Claro');await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}]);await assert('Explicit light ignores device changes',()=>document.documentElement.dataset.theme==='light');
  for(const value of ['bosque','claro','unl']){await page.click(`.sgp-appearance-palettes input[value="${value}"] + span`).catch(()=>page.$eval(`.sgp-appearance-palettes input[value="${value}"]`,e=>e.click()));await assert('Palette '+value+' independent of mode',()=>document.documentElement.dataset.theme==='light'&&Boolean(document.querySelector('.sgp-account-panel')));}
  await page.focus('.sgp-account-footer button');await page.keyboard.press('Tab');await assert('Tab stays in panel',()=>document.activeElement.getAttribute('aria-label')==='Cerrar menú de cuenta');await page.keyboard.press('Escape');await assert('Escape restores focus and scrolling',()=>document.activeElement.classList.contains('sgp-account-trigger')&&document.body.style.overflow!=='hidden');
  await page.reload({waitUntil:'networkidle0'});await page.click('.sgp-account-trigger');await assert('Preferences survive reload',()=>document.documentElement.dataset.theme==='light'&&localStorage.getItem('sgp-color-theme')==='unl');
  await page.click('.sgp-a11y-launcher');await click('.sgp-a11y-contrast label','Alto contraste');await page.keyboard.press('Escape');await assert('Accessibility stacks above account',()=>Boolean(document.querySelector('.sgp-account-panel'))&&document.body.style.overflow==='hidden'&&document.documentElement.classList.contains('aw-high-contrast'));
  await click('.sgp-appearance-modes label','Oscuro');await assert('Theme retains accessibility adjustments',()=>document.documentElement.classList.contains('aw-high-contrast'));
  await page.click('.sgp-a11y-launcher');await click('button','Restablecer ajustes');for(let i=0;i<10;i++)await click('button','Aumentar tamaño del texto');await page.keyboard.press('Escape');await inspect('200 percent text fits and actions remain reachable');
  await page.click('.sgp-a11y-launcher');await click('button','Restablecer ajustes');await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  if(width<1024){await page.click('button[title="Abrir menu"]');await click('button','Cuenta y apariencia');await inspect('Mobile navigation opens shared account panel');await page.keyboard.press('Escape');}
  await page.click('.sgp-account-trigger');await page.mouse.click(2,Math.floor(page.viewport().height/2));await assert('Outside click dismisses panel',()=>!document.querySelector('.sgp-account-panel'));
  await page.click('.sgp-account-trigger');await page.click('.sgp-account-profile');await assert('Profile navigation closes account',()=>!document.querySelector('.sgp-account-panel')&&location.hash.includes('profile'));
  await page.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
 fs.writeFileSync(path.join(output,'resultado.json'),JSON.stringify({date:'2026-11-06',mode:'Chrome; isolated API',checks,errors},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,errors},null,2));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
