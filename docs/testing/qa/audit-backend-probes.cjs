/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          audit-backend-probes.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo audit-backend-probes mediante pruebas de regresión.
 */

// Reproduce audit defects in the test H2 database. Expected to fail until corrected.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const project=path.resolve(__dirname,'../../..'),backend=path.join(project,'BackEnd');
const source=path.join(__dirname,'probes/AuditBehaviorProbeTest.java');
const target=path.join(backend,'src/test/java/com/sgp/systemsgp/service/AuditBehaviorProbeTest.java');
const output=path.join(project,'docs/testing/evidencias/auditoria-integral-2026-11-07');
if(fs.existsSync(target))throw new Error('AuditBehaviorProbeTest.java already exists; it will not be overwritten.');
const generated=[path.join(backend,'target/test-classes/com/sgp/systemsgp/service'),path.join(backend,'target/surefire-reports')];
const old=new Map();for(const folder of generated)if(fs.existsSync(folder))for(const file of fs.readdirSync(folder))if(file.includes('AuditBehaviorProbeTest'))old.set(path.join(folder,file),fs.readFileSync(path.join(folder,file)));
try{
 fs.copyFileSync(source,target);
 const run=spawnSync(path.join(backend,'mvnw'),['-q','-Dtest=AuditBehaviorProbeTest','test'],{cwd:backend,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
 fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'reproduccion-probes.log'),(run.stdout||'')+(run.stderr||''));
 console.log(JSON.stringify({exitCode:run.status,note:'These tests assert desired behavior; failures reproduce the audit findings.',log:path.join(output,'reproduccion-probes.log')}));process.exitCode=run.status??1;
}finally{
 fs.rmSync(target,{force:true});
 for(const folder of generated)if(fs.existsSync(folder))for(const file of fs.readdirSync(folder))if(file.includes('AuditBehaviorProbeTest'))fs.rmSync(path.join(folder,file));
 for(const [file,bytes]of old)fs.writeFileSync(file,bytes);
}
