/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeWorkspacePage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Presenta las prácticas asignadas y permite abrir las actividades de cada práctica.
 */

import { PracticeOverview } from '../components/PracticeOverview';
import { WorkflowCard } from '../components/ui/WorkflowCard';
import { ListToolbar } from '../components/ui/ListToolbar';
import { EntityImage } from '../components/ui/EntityImage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Search, RefreshCw, Download } from 'lucide-react';
import { apiRequest, apiBlob, unwrapPage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { PracticeWorkspaceContext } from '../contexts/PracticeWorkspaceContext';
import { groupPractices, practiceSections, workspaceRoute } from '../config/practiceWorkflow';
import { getRouteSegments, setHashRoute } from '../utils/routes';
import { PageHeader } from '../components/ui/PageHeader';
import { ActionMenu } from '../components/ui/ActionMenu';
import { SectionCard } from '../components/ui/SectionCard';
import { Alert } from '../components/ui/Alert';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SecondaryButton } from '../components/ui/ActionBar';
import { PhotosPage } from './PhotosPage';
import { PracticeFormsPage, ObservationFormsPage } from './PracticeFormsPage';
import { DidacticPlansPage } from './DidacticPlansPage';
import { DocumentsPage } from './DocumentsPage';
import { SchedulesPage } from './SchedulesPage';

const pages = { photos: PhotosPage, forms: PracticeFormsPage, 'observation-forms': ObservationFormsPage, 'didactic-plans': DidacticPlansPage, documents: DocumentsPage, schedules: SchedulesPage };
const isStudentOnly = roles => roles.includes('ROLE_ESTUDIANTE') && !roles.some(role => ['ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS', 'ROLE_TUTOR_PRACTICAS', 'ROLE_TUTOR_INSTITUCIONAL', 'ROLE_DIRECTORA_INSTITUCION'].includes(role));

export function PracticeWorkspacePage({ route = 'dashboard' }) {
  const { token, roles } = useAuth();
  const student = isStudentOnly(roles);
  const institutionalDirector = roles.includes('ROLE_DIRECTORA_INSTITUCION') && !roles.some(role => ['ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS', 'ROLE_TUTOR_PRACTICAS', 'ROLE_TUTOR_INSTITUCIONAL', 'ROLE_ESTUDIANTE'].includes(role));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  async function downloadArchive() {
    if (exporting || !practiceId) return;
    setExporting(true); setExportError('');
    try {
      const blob = await apiBlob(`/api/enrollments/${practiceId}/archive.zip`, token);
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `expediente-practica-${practiceId}.zip`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setExportError(error.message || 'No se pudo descargar el expediente.'); }
    finally { setExporting(false); }
  }
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('current');
  const [groupId, setGroupId] = useState('');
  const segments = getRouteSegments(route);
  const practiceId = segments[0] === 'practices' ? segments[1] : null;
  const sectionId = segments.slice(2).join('/');
  const sections = useMemo(() => practiceSections(roles), [roles]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRows(unwrapPage(await apiRequest('/api/enrollments/practices', { token }))); }
    catch (e) { setError(e.message || 'No se pudieron cargar las prácticas.'); setRows([]); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { if (!institutionalDirector) load(); else setLoading(false); }, [load, institutionalDirector]);
  useEffect(() => { setQuery(''); setGroupId(''); }, [token]);
  const practice = rows.find(row => String(row.id) === String(practiceId));
  const filtered = rows.filter(row => {
    if (status === 'current' && (row.status === 'COMPLETED' || row.archived)) return false;
    if (status === 'history' && row.status !== 'COMPLETED' && !row.archived) return false;
    return [row.practiceName, row.courseName, row.studentFullName, row.student, row.educationalInstitutionName, row.groupName, row.academicCycleName].filter(Boolean).join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase());
  });
  const groups = groupPractices(filtered);
  const currentGroup = groups.find(group => group.id === groupId);
  const title = student ? 'Mis prácticas' : roles.includes('ROLE_TUTOR_INSTITUCIONAL') ? 'Mis estudiantes asignados' : 'Paralelos y estudiantes';

  if (institutionalDirector) return <>
    <PageHeader title="Mi institución" description="Elige el trabajo que necesitas atender con los estudiantes de tu institución." />
    <div className="grid gap-4 md:grid-cols-2">
      <WorkCard title="Entrevistas asignadas" description="Abre una entrevista, consulta sus preguntas y registra tus respuestas." onClick={() => setHashRoute('forms')} />
      <WorkCard title="Jornadas de estudiantes" description="Consulta la programación y las asistencias de tu institución." onClick={() => setHashRoute('schedules')} />
    </div>
  </>;

  if (!practiceId) return <>
    <PageHeader title={title} description={student ? 'Selecciona una práctica para continuar con tus actividades y consultar sus registros.' : 'Abre un paralelo y después la práctica de un estudiante para consultar o atender su trabajo.'} />
    {error && <Alert tone="error">{error}</Alert>}
    <ListToolbar search={<label className="block relative"><Search size={17} className="absolute left-3 top-3 text-muted" /><input aria-label="Buscar prácticas" className="h-11 w-full rounded-lg border border-line bg-panel pl-10 pr-3 text-sm text-heading" placeholder={student ? 'Buscar por paralelo o institución' : 'Buscar estudiante, paralelo o institución'} value={query} onChange={e => setQuery(e.target.value)} /></label>} actions={<>
      <select aria-label="Estado de las prácticas" className="h-11 rounded-lg border border-line bg-panel px-3 text-sm text-heading" value={status} onChange={e => { setStatus(e.target.value); setGroupId(''); }}><option value="current">En curso</option><option value="history">Historial</option><option value="all">Todas</option></select>
      {!student && roles.some(role => ['ROLE_ADMIN', 'ROLE_DIRECTOR_PRACTICAS', 'ROLE_TUTOR_PRACTICAS'].includes(role)) && <SecondaryButton onClick={() => setHashRoute('courses')}>Gestionar paralelos y grupos</SecondaryButton>}
      <SecondaryButton icon={RefreshCw} loading={loading} onClick={load}>Actualizar</SecondaryButton>
    </>} />

    {loading ? <p role="status" className="py-10 text-body">Cargando prácticas…</p> : !error && !filtered.length ? <SectionCard title="Sin prácticas en esta vista"><p className="text-sm text-body">{query ? 'No hay coincidencias. Prueba otra búsqueda.' : student ? 'Aquí encontrarás las prácticas que te asigne el personal académico. Cuando tengas una asignada, podrás abrirla y comenzar a trabajar.' : 'No hay prácticas asignadas en esta vista. Puedes cambiar el estado o revisar la gestión de paralelos.'}</p></SectionCard> : null}
    {!student && !currentGroup && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groups.map(group => <WorkCard key={group.id} title={group.label} description={[group.cycle, `${group.rows.length} práctica(s)`].filter(Boolean).join(' · ')} onClick={() => setGroupId(group.id)} />)}</div>}
    {currentGroup && <div className="flex items-center gap-4"><SecondaryButton icon={ArrowLeft} onClick={() => setGroupId('')}>Volver a paralelos</SecondaryButton><h2 className="font-semibold text-heading">{currentGroup.label}</h2></div>}
    {(student || currentGroup) && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(student ? filtered : currentGroup.rows).map(row => <button type="button" key={row.id} onClick={() => setHashRoute(workspaceRoute(row.id))} data-state={row.archived ? 'ARCHIVED' : row.status} className="sgp-practice-card group rounded-xl border border-line bg-panel p-5 text-left transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus">
      <EntityImage path={row.coverImageUrl} className="mb-4 h-32 w-full rounded-lg" />
      <div className="mb-5 flex items-center justify-between gap-3"><GraduationCap size={22} className="text-primary" /><StatusBadge status={row.archived ? 'ARCHIVED' : row.status} /></div>
      <h2 className="text-lg font-semibold text-heading">{student ? row.practiceName || row.courseName : row.studentFullName || row.student}</h2><p className="mt-2 flex items-center gap-2 text-sm text-body">{row.institutionLogoUrl && <EntityImage path={row.institutionLogoUrl} logo className="h-8 w-8 shrink-0 rounded-md bg-panel" />}{row.educationalInstitutionName || 'Institución por asignar'}</p><p className="mt-1 text-xs text-muted">{[row.courseName, row.practiceName, row.academicCycleName, row.groupName].filter(Boolean).join(' · ')}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">Abrir práctica <ArrowRight size={16} /></span>
    </button>)}</div>}
  </>;

  if (loading) return <p role="status">Cargando práctica…</p>;
  if (error || !practice) return <><PageHeader title="Práctica no disponible" description="No se pudo abrir esta práctica dentro de tus asignaciones." />{error && <Alert tone="error">{error}</Alert>}<SecondaryButton onClick={() => setHashRoute('practices')}>Volver a mis prácticas</SecondaryButton><SecondaryButton onClick={load}>Reintentar</SecondaryButton></>;
  const documentSections = sections.filter(item => item.id.startsWith('documents/'));
  const section = sectionId === 'documents' && documentSections.length ? { id: 'documents', label: 'Documentos y evaluación' } : sections.find(item => item.id === sectionId);
  const Page = section && section.id !== 'documents' ? pages[section.id.split('/')[0]] : null;
  const operational = practice.status === 'APPROVED' && !practice.archived && practice.courseActive !== false;
  return <PracticeWorkspaceContext.Provider value={practice}>
    {exportError && <Alert tone="error">{exportError}</Alert>}
    {practice.coverImageUrl && !sectionId && <EntityImage path={practice.coverImageUrl} alt={`Portada de ${practice.courseName || 'la práctica'}`} className="h-32 w-full rounded-xl sm:h-44" />}
    <section aria-label="Práctica seleccionada" className={`sgp-practice-context rounded-xl border border-line bg-panel ${sectionId ? 'space-y-2 p-3' : 'space-y-4 p-4 md:p-6'}`}>
      {sectionId && <h1 className="sr-only">{student ? practice.practiceName || practice.courseName : practice.studentFullName || practice.student}</h1>}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <nav aria-label="Ruta de la práctica" className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-body"><button className="min-h-10 text-primary hover:underline" onClick={() => setHashRoute('practices')}>{title}</button><span aria-hidden="true">/</span><button className="min-h-10 text-primary hover:underline" onClick={() => setHashRoute(workspaceRoute(practice.id))}>{practice.practiceName || practice.courseName || 'Práctica'}</button>{section && <><span aria-hidden="true">/</span><span aria-current="page">{section.label}</span></>}</nav>
        <div className="flex flex-none items-center gap-2"><StatusBadge status={practice.archived ? 'ARCHIVED' : practice.status} />{!institutionalDirector && <ActionMenu label="Acciones de la práctica" actions={[{key:'archive',label:exporting ? 'Preparando expediente…' : 'Descargar expediente',icon:Download,onClick:downloadArchive,disabled:exporting}]} />}</div>
      </div>
      {!sectionId ? <div><h1 className="text-2xl font-semibold tracking-tight text-heading">{student ? practice.practiceName || practice.courseName : practice.studentFullName || practice.student}</h1><p className="mt-1 text-sm text-body">{practice.educationalInstitutionName || 'Institución por asignar'}</p><p className="mt-2 text-sm text-muted">{[practice.academicCycleName, practice.groupName, practice.practiceTutor && `Tutor de prácticas: ${practice.practiceTutor}`, practice.institutionalTutor && `Tutor institucional: ${practice.institutionalTutor}`].filter(Boolean).join(' · ')}</p></div>
       : <details className="text-sm text-body"><summary className="w-fit cursor-pointer rounded py-1 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus">Datos de la práctica</summary><p className="mt-2">{[practice.studentFullName,practice.educationalInstitutionName || 'Institución por asignar',practice.academicCycleName,practice.groupName,practice.practiceTutor && `Tutor de prácticas: ${practice.practiceTutor}`,practice.institutionalTutor && `Tutor institucional: ${practice.institutionalTutor}`].filter(Boolean).join(' · ')}</p></details>}
      <nav aria-label="Secciones de la práctica" className="flex flex-wrap items-center gap-2 border-t border-line pt-2"><SectionButton active={!sectionId} onClick={() => setHashRoute(workspaceRoute(practice.id))}>Resumen de la práctica</SectionButton><label className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm text-body"><span className={sectionId ? 'sr-only' : ''}>Ir a un apartado</span><select aria-label="Apartado de la práctica" className="h-11 w-full max-w-sm rounded-lg border border-line bg-panel px-3 text-heading" value={sectionId} onChange={event => setHashRoute(workspaceRoute(practice.id, event.target.value))}><option value="">Seleccionar apartado</option>{documentSections.length > 0 && <option value="documents">Documentos y evaluación</option>}{sections.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></nav>
    </section>
    {!operational && <Alert tone="info">{practice.status === 'PENDING' ? 'El personal académico debe habilitar esta práctica antes de que puedas trabajar.' : 'Esta práctica está disponible para consulta de sus registros. La creación de actividades requiere una práctica activa y aprobada.'}</Alert>}
    {sectionId && !section && <Alert tone="warning">Esta sección no está disponible para tu rol.</Alert>}
    {sectionId === 'documents' && documentSections.length > 0 && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{documentSections.map(item => <WorkCard key={item.id} title={item.label} description="Consulta el estado del documento y las acciones disponibles para tu rol." onClick={() => setHashRoute(workspaceRoute(practice.id, item.id))} Icon={item.Icon} />)}</div>}
    {Page ? <div key={`${practice.id}/${sectionId}`} className="practice-workspace-content"><Page activeModuleId={section.id.split('/')[1]} /></div> : !sectionId && <>
      <PracticeOverview practice={practice} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{documentSections.length > 0 && <WorkCard title="Documentos y evaluación" description="Prepara o revisa los documentos y consulta su estado." onClick={() => setHashRoute(workspaceRoute(practice.id, 'documents'))} />}{sections.filter(item => !item.id.startsWith('documents/')).map(item => <WorkCard key={item.id} title={item.label} description="Abrir los registros de esta práctica." onClick={() => setHashRoute(workspaceRoute(practice.id, item.id))} Icon={item.Icon} />)}</div>
    </>}
  </PracticeWorkspaceContext.Provider>;
}
function SectionButton({ active, children, onClick }) { return <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={`min-h-11 shrink-0 rounded-md px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${active ? 'bg-primary text-inverse' : 'text-body hover:bg-surface-soft'}`}>{children}</button>; }
function WorkCard({ Icon = BookOpen, ...props }) { return <WorkflowCard Icon={Icon} {...props} />; }
