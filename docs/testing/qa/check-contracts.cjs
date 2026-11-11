/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          check-contracts.cjs
 * @fecha         2026-11-09 11:08:16
 * @nota          Comprueba el comportamiento de el módulo check-contracts mediante pruebas de regresión.
 */

const fs=require('fs'),path=require('path');
const project=path.resolve(__dirname,'../../..');
const root=path.join(project,'FrontEnd/src/config/');
function buildConfig() {
const endpoint=fs.readFileSync(root+'endpointModules.js','utf8').replace(/export (const|function) /g,'$1 ');
const resources=fs.readFileSync(root+'resources.js','utf8').replace(/export (const|function) /g,'$1 ');
const names=[...fs.readFileSync(root+'navigation.js','utf8').matchAll(/import\s*{([\s\S]*?)}\s*from 'lucide-react';/g)].flatMap(m=>m[1].split(',').map(s=>s.trim()).filter(Boolean));
const nav=fs.readFileSync(root+'navigation.js','utf8').replace(/import[\s\S]*?from '[^']+';/g,'').replace(/export (const|function) /g,'$1 ');
const evaluate=new Function(endpoint+'\n'+resources+'\n'+names.map(n=>'const '+n+' = null;').join('\n')+'\n'+nav+'\nreturn {NAV_ITEMS,DOCUMENT_MODULES,SCHEDULE_MODULES,ROLES};');
const data=evaluate();const requests=[];
for(const module of [...data.DOCUMENT_MODULES,...data.SCHEDULE_MODULES]){
 for(const [key,method] of Object.entries({listPath:'GET',createPath:'POST',updatePath:'PUT',getPath:'GET',pdfPath:'GET',submitPath:'PATCH',reviewPath:'PATCH',defaultsPath:'GET'})){
  if(!module[key])continue;
  for(const role of data.ROLES){const value=typeof module[key]==='function'?module[key](123,[role]):module[key];requests.push({module:module.id,key,method,path:value,role});}
 }
 for(const list of module.altLists||[])requests.push({module:module.id,key:'altList',method:'GET',path:list.path,roles:list.roles});
 for(const action of module.extraActions||[])requests.push({module:module.id,key:action.label,method:action.method||'PATCH',path:typeof action.path==='function'?action.path(123):action.path,roles:action.roles});
}
const routes=data.ROLES.flatMap(role=>data.NAV_ITEMS.filter(i=>!i.roles.length||i.roles.includes(role)).flatMap(i=>[{role,route:i.id,label:i.label},...(i.children||[]).filter(c=>!c.roles.length||c.roles.includes(role)).map(c=>({role,route:c.id,label:c.label}))]));
return {routes,requests};
}

function checkContracts() {
 const {requests}=buildConfig();const mappings=[];
 const controllerRoot=path.join(project,'BackEnd/src/main/java/com/sgp/systemsgp/controller');
 for(const file of fs.readdirSync(controllerRoot,{recursive:true}).filter(f=>f.endsWith('.java'))){
  const source=fs.readFileSync(path.join(controllerRoot,file),'utf8');
  const header=source.split('public class')[0];
  const base=header.match(/@RequestMapping\("([^"]+)"\)/)?.[1]||'';
  for(const match of source.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping(?:\(([^)]*)\))?/g)){
   const suffixes=[...(match[2]||'').matchAll(/"(\/[^" ]*)"/g)].map(m=>m[1]);
   for(const suffix of suffixes.length?suffixes:[''])mappings.push({method:match[1].toUpperCase(),pattern:new RegExp('^'+(base+suffix).replace(/\{[^}]+\}/g,'[^/]+')+'$')});
  }
 }
 const checked=new Map();
 for(const request of requests){if(!request.path)continue;const requestPath=request.path.split('?')[0];checked.set(request.method+' '+requestPath,{...request,path:requestPath});}
 const missing=[...checked.values()].filter(r=>!mappings.some(m=>m.method===r.method&&m.pattern.test(r.path)));
 return {checked:checked.size,missing};
}
if(require.main===module){
 const result=checkContracts();
 fs.writeFileSync(path.join(project,'docs/testing/evidencias/evidencia-qa-contratos.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));if(result.missing.length)process.exitCode=1;
}
module.exports={buildConfig,checkContracts};
