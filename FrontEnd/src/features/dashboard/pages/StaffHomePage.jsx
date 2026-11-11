/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          StaffHomePage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Presenta los accesos a las tareas del personal autorizado según su rol.
 */

import { UsersRound, GraduationCap, University, Building2, UserCog, Archive, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { WorkflowCard } from '../../../components/ui/WorkflowCard';
import { setHashRoute } from '../../../utils/routes';
import { PracticeWorkspacePage } from '../../practices/pages/PracticeWorkspacePage';
import { InstitutionWorkPage } from '../../institutions/pages/InstitutionWorkPage';

const TASK_ICONS = { practices: UsersRound, courses: GraduationCap, universities: University, institutions: Building2, accounts: UserCog, 'practice-archive': Archive, overview: ClipboardCheck };

export function StaffHomePage(props) {
  const { roles } = useAuth();
  const admin = roles.includes('ROLE_ADMIN');
  const director = roles.includes('ROLE_DIRECTOR_PRACTICAS');
  const tutor = roles.includes('ROLE_TUTOR_PRACTICAS');
  const institutional = roles.includes('ROLE_TUTOR_INSTITUCIONAL');
  if (!admin && !director && !tutor && !institutional) {
    return roles.includes('ROLE_DIRECTORA_INSTITUCION') ? <InstitutionWorkPage {...props} /> : <PracticeWorkspacePage {...props} />;
  }
  const tasks = [
    { title: institutional && !admin && !director && !tutor ? 'Mis estudiantes asignados' : 'Paralelos y estudiantes', description: 'Selecciona un paralelo y abre la práctica del estudiante que necesitas atender.', route: 'practices' },
    ...((admin || director || tutor) ? [{ title: 'Gestionar paralelos y grupos', description: 'Abre un paralelo para gestionar sus inscripciones y asignaciones.', route: 'courses' }] : []),
    ...((admin || director) ? [{ title: admin ? 'Organizar estructura académica' : 'Consultar mi estructura académica', description: 'Universidad, facultades, carreras, ciclos y asignaturas en un recorrido guiado.', route: 'universities' }, { title: 'Centros de prácticas', description: 'Selecciona una escuela o colegio para trabajar dentro de su estructura.', route: 'institutions' }] : []),
    ...(admin ? [{ title: 'Gestionar usuarios', description: 'Elige un tipo de usuario y después la cuenta que necesitas administrar.', route: 'accounts' }, { title: 'Archivo de prácticas', description: 'Consulta y administra las cohortes de prácticas concluidas.', route: 'practice-archive' }] : []),
    { title: 'Seguimiento y pendientes', description: 'Consulta los indicadores y abre las tareas pendientes de tus bandejas.', route: 'overview' },
  ];
  return <><PageHeader eyebrow="Espacio académico" title={admin ? 'Administración' : director ? 'Coordinación de prácticas' : institutional && !tutor ? 'Tutoría institucional' : 'Tutoría de prácticas'} description="Elige qué necesitas hacer. Después selecciona el registro con el que vas a trabajar." /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{tasks.map(task => <WorkflowCard key={task.route} Icon={TASK_ICONS[task.route]} area={{ universities: 'academic', institutions: 'institution', accounts: 'people', overview: 'review', 'practice-archive': 'records' }[task.route] || 'practice'} title={task.title} description={task.description} onClick={() => setHashRoute(task.route)} />)}</div></>;
}
