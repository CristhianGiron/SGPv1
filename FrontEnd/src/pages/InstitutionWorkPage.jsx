/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          InstitutionWorkPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Agrupa las tareas y asignaciones vinculadas al trabajo de la institución.
 */

import { ListToolbar } from '../components/ui/ListToolbar';
import { useEffect, useState } from 'react';
import { apiRequest, unwrapPage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { PracticeWorkspaceContext } from '../contexts/PracticeWorkspaceContext';
import { PageHeader } from '../components/ui/PageHeader';
import { WorkflowCard } from '../components/ui/WorkflowCard';
import { SecondaryButton } from '../components/ui/ActionBar';
import { Alert } from '../components/ui/Alert';
import { getRouteSegments, setHashRoute } from '../utils/routes';
import { PracticeFormsPage } from './PracticeFormsPage';
import { SchedulesPage } from './SchedulesPage';

export function institutionAssignments(forms, schedules) {
  const assignments = new Map();
  for (const row of [...forms, ...schedules]) {
    if (row.enrollmentId == null) continue;
    const key = String(row.enrollmentId);
    const current = assignments.get(key) || { id: row.enrollmentId, status: 'APPROVED', studentFullName: row.studentFullName || row.studentUsername || row.student || 'Estudiante asignado', courseName: row.courseName, educationalInstitutionName: row.educationalInstitutionName, forms: 0, schedules: 0 };
    if (forms.includes(row)) current.forms++; else current.schedules++;
    assignments.set(key, current);
  }
  return [...assignments.values()];
}
export function InstitutionWorkPage({ route = '' }) {
  const { token } = useAuth();
  const [state, setState] = useState({ rows: [], loading: true, error: '' });
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  useEffect(() => {
    let active = true;
    setState({ rows: [], loading: true, error: '' });
    Promise.all([apiRequest('/api/practice-forms/assigned', { token }), apiRequest('/api/practice-schedules/institution-review', { token })])
      .then(([forms, schedules]) => { if (active) setState({ rows: institutionAssignments(unwrapPage(forms), unwrapPage(schedules)), loading: false, error: '' }); })
      .catch(e => { if (active) setState({ rows: [], loading: false, error: e.message || 'No se pudieron cargar las asignaciones.' }); });
    return () => { active = false; };
  }, [token, retry]);
  const segments = getRouteSegments(route);
  const id = segments[0] === 'institution-work' ? segments[1] : null;
  const section = segments[2];
  const selected = state.rows.find(row => String(row.id) === id);
  if (state.loading) return <><PageHeader title="Mi institución" /><p role="status">Cargando estudiantes y asignaciones…</p></>;
  if (state.error) return <><PageHeader title="Mi institución" /><Alert tone="error">{state.error}</Alert><SecondaryButton onClick={() => setRetry(value => value + 1)}>Reintentar</SecondaryButton></>;
  if (id && !selected) return <><PageHeader title="Asignación no disponible" description="Esta práctica no aparece en tus entrevistas o jornadas asignadas." /><SecondaryButton onClick={() => setHashRoute('institution-work')}>Volver a estudiantes</SecondaryButton></>;
  if (!selected) return <>
    <PageHeader title="Mi institución" description="Selecciona un estudiante para consultar sus jornadas y atender sus entrevistas asignadas." />
    <ListToolbar search={<input aria-label="Buscar estudiante asignado" placeholder="Buscar estudiante o paralelo" className="h-11 w-full rounded-lg border border-line bg-panel px-3 text-heading" value={query} onChange={e => setQuery(e.target.value)} />} actions={<SecondaryButton onClick={() => setRetry(value => value + 1)}>Actualizar</SecondaryButton>} />
    {!state.rows.length && <Alert tone="info">Los estudiantes aparecerán cuando tengas entrevistas o jornadas vinculadas a sus prácticas.</Alert>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{state.rows.filter(row => `${row.studentFullName} ${row.courseName || ''}`.toLowerCase().includes(query.toLowerCase())).map(row => <WorkflowCard key={row.id} title={row.studentFullName} description={[row.courseName, `${row.forms} entrevista(s) · ${row.schedules} jornada(s)`].filter(Boolean).join(' · ')} onClick={() => setHashRoute(`institution-work/${row.id}`)} />)}</div>
  </>;
  return <PracticeWorkspaceContext.Provider value={selected}>
    <nav aria-label="Ruta institucional" className="flex flex-wrap gap-3 text-sm text-primary"><button onClick={() => setHashRoute('institution-work')}>Mis estudiantes</button><span>/</span><button onClick={() => setHashRoute(`institution-work/${selected.id}`)}>{selected.studentFullName}</button></nav>
    <PageHeader headingLevel="h1" title={selected.studentFullName} description={[selected.courseName, selected.educationalInstitutionName].filter(Boolean).join(' · ')} />
    {section && <SecondaryButton onClick={() => setHashRoute(`institution-work/${selected.id}`)}>Volver a la asignación</SecondaryButton>}
    {section === 'forms' ? <PracticeFormsPage key={selected.id} /> : section === 'schedules' ? <SchedulesPage key={selected.id} /> : section ? <Alert tone="warning">Este apartado no está disponible para tu rol.</Alert> : <div className="grid gap-4 md:grid-cols-2"><WorkflowCard title="Entrevistas asignadas" description="Consulta y responde las entrevistas de esta práctica." onClick={() => setHashRoute(`institution-work/${selected.id}/forms`)} /><WorkflowCard title="Jornadas y asistencias" description="Consulta la programación y las asistencias de este estudiante." onClick={() => setHashRoute(`institution-work/${selected.id}/schedules`)} /></div>}
  </PracticeWorkspaceContext.Provider>;
}
