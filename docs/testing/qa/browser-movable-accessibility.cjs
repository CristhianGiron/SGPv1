/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          browser-movable-accessibility.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo browser-movable-accessibility mediante pruebas de regresión.
 */

// Actual mouse and touch drags against the compiled app. API fixtures are isolated.
const fs=require('fs'),path=require('path'),http=require('http');
const project=path.resolve(__dirname,'../../..'),root=require('./runtime.cjs').buildPath;
const puppeteer=require('./runtime.cjs').puppeteer;
const output=process.env.SGP_QA_OUTPUT || path.join(project,'docs/testing/evidencias/accesibilidad-movil');fs.mkdirSync(output,{recursive:true});
const positionKey='sgp-accessibility-position';
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!f.startsWith(root+'/')||!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'})[path.extname(f)]||'text/html');fs.createReadStream(f).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath: require('./runtime.cjs').chromePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const checks=[],errors=[];
 try{for(const mode of ['light','dark'])for(const width of [320,390,1440]){
  const touch=width<768,height=touch?844:1000,page=await browser.newPage();await page.setViewport({width,height,isMobile:touch,hasTouch:touch});page.on('pageerror',e=>errors.push({mode,width,message:e.message}));
  await page.evaluateOnNewDocument(mode=>{if(!sessionStorage.getItem('drag-ready')){localStorage.clear();localStorage.setItem('sgp-auth',JSON.stringify({accessToken:'fixture'}));localStorage.setItem('sgp-theme-mode',mode);sessionStorage.setItem('drag-ready','yes');}},mode);
  await page.setRequestInterception(true);page.on('request',req=>{const u=new URL(req.url());if(u.origin!==origin)return req.abort();if(!u.pathname.startsWith('/api/'))return req.continue();let data=[];
   if(u.pathname==='/api/account/me')data={id:1,username:'qa',names:'María',roles:['ROLE_ESTUDIANTE']};
   if(u.pathname==='/api/public/institutional-defaults')data=require(path.join(project,'FrontEnd/src/config/institutionalDefaults.json'));
   if(['/api/enrollments/practices','/api/enrollments/me'].includes(u.pathname))data=[{id:7,courseId:10,courseName:'Prácticas de informática',studentFullName:'María Muñoz',status:'APPROVED',courseActive:true}];
   if(u.pathname.startsWith('/api/drafts/'))data={revision:0,content:null};
   req.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  const check=async(label,fn)=>{const pass=await page.evaluate(fn);checks.push({mode,width,input:touch?'touch':'mouse',label,pass});if(!pass)errors.push({mode,width,label});};
  const point=async()=>{await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));return page.$eval('.sgp-a11y-launcher',e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,cx:r.x+r.width/2,cy:r.y+r.height/2};});};
  const inside=()=>{const r=document.querySelector('.sgp-a11y-launcher').getBoundingClientRect();return r.left>=8&&r.top>=8&&r.right<=innerWidth-8&&r.bottom<=innerHeight-8&&r.width===50&&r.height===50;};
  const client=touch?await page.createCDPSession():null;
  async function drag(x,y){const start=await point();if(touch){await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start.cx,y:start.cy}]});for(let i=1;i<=8;i++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.cx+(x-start.cx)*i/8,y:start.cy+(y-start.cy)*i/8}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await page.mouse.move(start.cx,start.cy);await page.mouse.down();await page.mouse.move(x,y,{steps:12});await page.mouse.up();}}
  async function clickLauncher(){const p=await point();if(touch){await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.cx,y:p.cy}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else await page.click('.sgp-a11y-launcher');try{await page.waitForSelector('.sgp-a11y-panel',{timeout:5000});}catch(error){console.log(JSON.stringify({mode,width,failedTap:p,after:await point(),state:await page.evaluate(()=>({custom:document.querySelector('[data-accessibility-widget]').dataset.customPosition,viewport:{width:innerWidth,height:innerHeight,visualWidth:visualViewport?.width,visualHeight:visualViewport?.height}}))}));await page.screenshot({path:'/tmp/sgp-movable-tap-failure.png'});throw error;}}
  await page.goto(origin+'/?drag='+mode+width+'#practices/7/documents/activity-plans',{waitUntil:'networkidle0'});await page.waitForSelector('.sgp-a11y-launcher');await page.waitForSelector('.sgp-editor-actions');
  await check('Default launcher avoids sticky document actions',()=>{const r=document.querySelector('.sgp-a11y-launcher').getBoundingClientRect(),f=document.querySelector('.sgp-editor-actions').getBoundingClientRect();return r.bottom<=f.top||r.top>=f.bottom||r.right<=f.left||r.left>=f.right;});
  await clickLauncher();await check('Ordinary click or tap still opens tools',()=>Boolean(document.querySelector('.sgp-a11y-panel')));await page.keyboard.press('Escape');
  await drag(width-25,120);await check('Drag does not open tools and saves position',()=>!document.querySelector('.sgp-a11y-panel')&&document.querySelector('[data-accessibility-widget]').dataset.customPosition==='true'&&JSON.parse(localStorage.getItem('sgp-accessibility-position')).version===1);await check('Moved launcher stays round and within screen',inside);
  if(width!==320)await page.screenshot({path:path.join(output,`${mode}-${width}-boton.png`)});
  await clickLauncher();await page.waitForFunction(()=>!document.querySelector('.sgp-a11y-panel').getAnimations().some(a=>a.playState==='running'));await check('Click opens panel safely in the chosen corner',()=>{const r=document.querySelector('.sgp-a11y-panel').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;});
  if(width!==320)await page.screenshot({path:path.join(output,`${mode}-${width}-panel.png`)});
  await page.keyboard.press('Escape');await check('Closing restores focus to moved launcher',()=>document.activeElement.classList.contains('sgp-a11y-launcher'));
  await page.focus('.sgp-a11y-launcher');await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowUp');await check('Arrow keys move without opening',()=>!document.querySelector('.sgp-a11y-panel'));await page.keyboard.press('Enter');await page.waitForSelector('.sgp-a11y-panel');await page.keyboard.press('Escape');
  const before=await point();await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('.sgp-a11y-launcher');const after=await point();checks.push({mode,width,label:'Position survives reload',pass:Math.abs(before.x-after.x)<1&&Math.abs(before.y-after.y)<1});if(Math.abs(before.x-after.x)>1||Math.abs(before.y-after.y)>1)errors.push({mode,width,label:'Reload position mismatch',before,after});
  await page.setViewport({width:280,height:480,isMobile:touch,hasTouch:touch});await page.waitForFunction(inside);await check('Resize keeps launcher reachable',inside);await page.setViewport({width,height,isMobile:touch,hasTouch:touch});await page.waitForFunction(inside);
  await drag(0,0);await check('Dragging against edges remains bounded',inside);
  await clickLauncher();await page.click('button[role="switch"][aria-checked="false"]');await page.click('.sgp-a11y-position-reset');await check('Reset position retains other preferences',()=>localStorage.getItem('sgp-accessibility-position')===null&&document.querySelector('[data-accessibility-widget]').dataset.customPosition==='false'&&document.documentElement.classList.contains('aw-readable-font'));
  await page.click('.sgp-a11y-reset');await page.keyboard.press('Escape');await check('Default placement restored after reset',inside);
  await page.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
 fs.writeFileSync(path.join(output,'resultado.json'),JSON.stringify({date:'2026-11-07',mode:'Chrome mouse/touch; isolated API',checks,errors},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,errors},null,2));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
