/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          audit-http-startup.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo audit-http-startup mediante pruebas de regresión.
 */

const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const project=path.resolve(__dirname,'../../..'),out=project+'/docs/testing/evidencias/correcciones-2026-11-07';
const options='--server.address=127.0.0.1 --server.port=0 --spring.profiles.active=test --spring.datasource.url=jdbc:h2:mem:sgp_audit_http;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE --spring.datasource.driver-class-name=org.h2.Driver --spring.datasource.username=sa --spring.datasource.password= --spring.jpa.hibernate.ddl-auto=create-drop --spring.flyway.enabled=false --spring.sql.init.mode=never';
const child=spawn('./mvnw',['-q','spring-boot:run','-Dspring-boot.run.useTestClasspath=true','-Dspring-boot.run.jvmArguments=-Dspring.devtools.restart.enabled=false','-Dspring-boot.run.arguments='+options],{cwd:project+'/BackEnd',detached:true,stdio:['ignore','pipe','pipe']});
const log=fs.createWriteStream('/tmp/sgp-audit-http-server.log');let text='',started=false,finished=false;
const stop=()=>{try{process.kill(-child.pid,'SIGTERM');}catch{}};
const timer=setTimeout(()=>{if(!finished){finished=true;stop();console.error('Isolated HTTP startup timed out');process.exitCode=1;}},90000);
async function exercise(port){try{const base='http://127.0.0.1:'+port,checks=[];for(const entry of [{path:'/api/public/institutional-defaults',expected:200},{path:'/api/account/me',expected:401},{path:'/api/auth/login',method:'POST',body:{},expected:400},{path:'/api/auth/login',method:'POST',body:{username:'nobody.audit',password:'fixture-only'},expected:401}]){const r=await fetch(base+entry.path,{method:entry.method||'GET',headers:{'Content-Type':'application/json'},body:entry.body?JSON.stringify(entry.body):undefined});const body=await r.text();checks.push({path:entry.path,method:entry.method||'GET',status:r.status,expected:entry.expected,contentType:r.headers.get('content-type'),pass:r.status===entry.expected,spanishPreserved:entry.path.endsWith('institutional-defaults')?!/Ã[¡©­³º±]/.test(body):undefined});}const result={date:'2026-11-07',mode:'Real Tomcat HTTP; forced isolated H2; no real database',started:true,checks};fs.writeFileSync(out+'/http-arranque.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}catch(e){console.error(e.stack);process.exitCode=1;}finally{finished=true;clearTimeout(timer);stop();}}
for(const stream of [child.stdout,child.stderr])stream.on('data',data=>{log.write(data);text+=data.toString();if(text.length>100000)text=text.slice(-50000);const match=text.match(/Tomcat started on port (\d+)/);if(match&&!started){started=true;exercise(Number(match[1]));}});
child.on('exit',code=>{log.end();if(!started&&!finished){finished=true;clearTimeout(timer);console.error('Isolated HTTP server exited: '+code);process.exitCode=1;}});
process.on('SIGTERM',()=>{stop();process.exit();});
