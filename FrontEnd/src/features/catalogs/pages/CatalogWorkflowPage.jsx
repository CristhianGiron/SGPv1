/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CatalogWorkflowPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Organiza la gestión de catálogos y sus relaciones en la interfaz.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { apiRequest } from '../../../api/client';
import { UNIVERSITY_CATALOG_RESOURCES, PRACTICE_CATALOG_RESOURCES } from '../../../config/resources';
import { setHashRoute } from '../../../utils/routes';
import { ResourceCrud } from '../components/ResourceCrud';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SecondaryButton } from '../../../components/ui/ActionBar';
import { Alert } from '../../../components/ui/Alert';
import { WorkflowCard } from '../../../components/ui/WorkflowCard';
import { InstitutionsPage } from '../../institutions/pages/InstitutionsPage';

const same = (a, b) => a != null && b != null && String(a) === String(b);
export function scopedCatalogResource(resource, fixedValues, labels, openRecord) {
  fixedValues = Object.fromEntries(Object.entries(fixedValues).map(([key, value]) => [key, Number(value)]));
  return {
    ...resource, fixedValues, openRecord,
    columns: resource.columns.filter(column => !Object.entries({
      institutionId: ['institution', 'institutionName'], facultyId: ['faculty', 'facultyName'],
      careerId: ['career', 'careerName'], academicCycleId: ['academicCycle', 'academicCycleName'],
      gradeId: ['grade', 'gradeName'], gradeParallelId: ['gradeParallel', 'gradeParallelName'],
    }).some(([key, columns]) => key in fixedValues && columns.includes(column.key))),
    rowFilter: row => (!resource.rowFilter || resource.rowFilter(row)) && Object.entries(fixedValues)
      .filter(([key]) => resource.id === 'careers' ? key === 'facultyId' : resource.id === 'academic-cycles' ? key === 'careerId' : resource.id === 'grade-parallels' ? key === 'gradeId' : resource.id === 'practice-subjects' ? ['gradeId', 'gradeParallelId'].includes(key) : resource.id === 'university-subjects' ? key === 'academicCycleId' : key === 'institutionId')
      .every(([key, value]) => same(row[key], value)),
    fields: resource.fields.map(field => Object.prototype.hasOwnProperty.call(fixedValues, field.name) ? { ...field, fixedLabel: labels[field.name] || String(fixedValues[field.name]) } : field),
  };
}

export function CatalogWorkflowPage({ kind, route = '' }) {
  const { token, roles } = useAuth();
  const academic = kind === 'universities';
  const params = new URLSearchParams(route.split('?')[1] || '');
  const keys = academic ? ['institutionId', 'facultyId', 'careerId', 'academicCycleId'] : ['institutionId', 'gradeId', 'gradeParallelId'];
  const ids = Object.fromEntries(keys.filter(key => params.get(key)).map(key => [key, params.get(key)]));
  const view = params.get('view') || '';
  const selectionKey = JSON.stringify(ids);
  const [loaded, setLoaded] = useState({ key: '', entities: {}, error: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const paths = { institutionId: 'institutions', facultyId: 'faculties', careerId: 'careers', academicCycleId: 'academic-cycles', gradeId: 'grades', gradeParallelId: 'grade-parallels' };
    const selected = JSON.parse(selectionKey);
    async function load() {
      try {
        const entities = Object.fromEntries(await Promise.all(Object.entries(selected).map(async ([key, id]) => [key, await apiRequest(`/api/${paths[key]}/${encodeURIComponent(id)}`, { token })])));
        const institution = entities.institutionId;
        if (institution && (academic ? institution.type !== 'UNIVERSIDAD' : !['ESCUELA', 'COLEGIO'].includes(institution.type))) throw new Error('La institución no corresponde a este espacio de trabajo.');
        const parents = academic ? { facultyId: 'institutionId', careerId: 'facultyId', academicCycleId: 'careerId' } : { gradeId: 'institutionId', gradeParallelId: 'gradeId' };
        for (const [child, parent] of Object.entries(parents)) {
          if (entities[child] && (!entities[parent] || !same(entities[child][parent], selected[parent]))) throw new Error('Los registros seleccionados no pertenecen a la misma estructura.');
        }
        if (active) setLoaded({ key: selectionKey, entities, error: '' });
      } catch (e) { if (active) setLoaded({ key: selectionKey, entities: {}, error: e.message || 'No se pudo cargar la selección.' }); }
    }
    load(); return () => { active = false; };
  }, [selectionKey, academic, token, retry]);
  function go(values = {}, nextView = '') {
    const query = new URLSearchParams({ ...values, ...(nextView ? { view: nextView } : {}) });
    setHashRoute(`${kind}${query.size ? `?${query}` : ''}`);
  }
  const rootTitle = academic ? 'Estructura académica' : 'Centros de prácticas';
  if (!Object.keys(ids).length) return <>
    <PageHeader title={rootTitle} description={academic ? 'Selecciona una universidad para explorar sus facultades, carreras y ciclos.' : 'Selecciona una escuela o colegio para organizar su estructura educativa.'} />
    <InstitutionsPage embedded scope={academic ? 'universities' : 'practice'} onOpen={row => go({ institutionId: row.id })} />
  </>;
  if (loaded.key !== selectionKey) return <><PageHeader title={rootTitle} /><p role="status">Cargando selección…</p></>;
  if (loaded.error) return <><PageHeader title="Selección no disponible" /><Alert tone="error">{loaded.error}</Alert><SecondaryButton onClick={() => go()}>Volver al listado</SecondaryButton><SecondaryButton onClick={() => setRetry(value => value + 1)}>Reintentar</SecondaryButton></>;
  const entities = loaded.entities;
  const labels = Object.fromEntries(Object.entries(entities).map(([key, entity]) => [key, entity.name || entity.code]));
  const canManage = roles.includes('ROLE_ADMIN');
  let resourceId, openRecord;
  if (academic) {
    if (!ids.facultyId) { resourceId = 'faculties'; openRecord = row => go({ ...ids, facultyId: row.id }); }
    else if (!ids.careerId) { resourceId = 'careers'; openRecord = row => go({ ...ids, careerId: row.id }); }
    else if (ids.academicCycleId) resourceId = 'university-subjects';
    else if (view === 'cycles') { resourceId = 'academic-cycles'; openRecord = row => go({ ...ids, academicCycleId: row.id }); }
  } else if (canManage) {
    if (!ids.gradeId) { resourceId = 'grades'; openRecord = row => go({ ...ids, gradeId: row.id }); }
    else if (view === 'subjects' || ids.gradeParallelId) resourceId = 'practice-subjects';
    else if (view === 'parallels') { resourceId = 'grade-parallels'; openRecord = row => go({ ...ids, gradeParallelId: row.id }); }
  }
  const resource = [...UNIVERSITY_CATALOG_RESOURCES, ...PRACTICE_CATALOG_RESOURCES].find(item => item.id === resourceId);
  return <>
    <nav aria-label="Ruta de administración" className="flex flex-wrap gap-2 text-sm text-body"><button className="text-primary underline" onClick={() => go()}>{rootTitle}</button>{keys.filter(key => ids[key]).map((key, index) => <span key={key}> / <button className="text-primary underline" onClick={() => go(Object.fromEntries(keys.slice(0, index + 1).filter(k => ids[k]).map(k => [k, ids[k]])))}>{labels[key]}</button></span>)}</nav>
    <PageHeader title={labels[keys.filter(key => ids[key]).at(-1)]} description={resource ? `${resource.title} de esta selección. Los nuevos registros conservarán este contexto.` : academic ? 'Elige qué necesitas consultar o gestionar dentro de esta carrera.' : 'Elige cómo organizar el grado seleccionado.'} />
    {resource ? <ResourceCrud key={`${resource.id}/${selectionKey}`} resource={scopedCatalogResource(resource, ids, labels, openRecord)} /> : <div className="grid gap-4 md:grid-cols-2">
      {academic ? <WorkflowCard title="Ciclos y asignaturas" description="Abre un ciclo para consultar o mantener sus asignaturas." onClick={() => go(ids, 'cycles')} /> : canManage ? <>
        <WorkflowCard title="Paralelos del grado" description="Selecciona un paralelo para organizar sus asignaturas." onClick={() => go(ids, 'parallels')} />
        <WorkflowCard title="Asignaturas del grado" description="Consulta o configura las asignaturas del grado completo." onClick={() => go(ids, 'subjects')} />
      </> : <p className="text-sm text-body">La configuración de grados y asignaturas corresponde a administración. Puedes gestionar los datos del centro desde su listado.</p>}
    </div>}
  </>;
}
