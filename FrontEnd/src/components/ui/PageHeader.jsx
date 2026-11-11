/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PageHeader.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente PageHeader de la interfaz del SGP.
 */

import { usePracticeWorkspace } from '../../contexts/PracticeWorkspaceContext';
import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { apiRequest, apiUrl } from '../../api/client';
import { Modal } from './Modal';

const PAGE_GUIDES = [
  {
    match: (eyebrow) => eyebrow === 'inicio',
    text: 'Consulta el resumen de actividad de tu cuenta. Las tarjetas muestran indicadores disponibles para tu rol; debajo aparecen tareas pendientes o el estado de tus documentos y prácticas. Usa el menú lateral para abrir los módulos.',
  },
  {
    match: (eyebrow, title) => title.includes('evidencias fotograficas'),
    text: 'En esta pantalla puedes consultar las fotografías de práctica, buscar por estudiante, paralelo o descripción y filtrar los resultados. Según tu rol, también puedes subir evidencias, revisarlas, abrirlas en pantalla completa o descargarlas.',
  },
  {
    match: (eyebrow, title) => title.includes('vista de imagen'),
    text: 'Muestra la evidencia seleccionada en tamaño ampliado para facilitar su revisión. Desde aquí puedes volver al registro de evidencias y continuar con las acciones disponibles para tu rol.',
  },
  {
    match: (eyebrow, title) => title.includes('planificaciones didacticas'),
    text: 'Crea y consulta planificaciones de unidad didáctica vinculadas con las prácticas. Puedes revisar los registros asignados, completar la información requerida y usar las acciones disponibles para enviar o revisar una planificación.',
  },
  {
    match: (eyebrow) => eyebrow === 'cuenta',
    text: 'Revisa y actualiza los datos asociados a tu cuenta y administra tu contraseña. Los campos disponibles dependen de la información registrada por la institución.',
  },
  {
    match: (eyebrow, title) => title.includes('archivo de practicas'),
    text: 'Consulta las prácticas y agrúpalas por cohorte, ciclo, carrera o paralelo. Busca y filtra registros; si tienes permisos de gestión, puedes archivar o recuperar prácticas concluidas.',
  },
  {
    match: (eyebrow, title) => title.includes('paralelos y practicas'),
    text: 'Busca y administra paralelos de práctica, organiza grupos, asigna tutores y consulta inscripciones e historial. Las pestañas y acciones que aparecen dependen de tu rol y del paralelo seleccionado.',
  },
  {
    match: (eyebrow, title) => title.includes('jornadas y asistencias'),
    text: 'Gestiona jornadas de práctica y sus registros de asistencia. Usa los controles de la pantalla para consultar los registros y, de acuerdo con tus permisos, crear o actualizar jornadas y asistencias.',
  },
  {
    match: (eyebrow, title) => title.includes('mis jornadas'),
    text: 'Consulta tus jornadas y revisa el resumen de asistencias, atrasos, faltas, justificativos y tiempo acumulado. Actualiza la información para cargar los registros más recientes.',
  },
  {
    match: (eyebrow, title) => title.includes('tus notificaciones'),
    text: 'Revisa avisos relacionados con envíos, comentarios, revisiones y cambios en la plataforma. Puedes abrir cada notificación y, si tienes permisos de administración, publicar anuncios.',
  },
  {
    match: (eyebrow, title) => title.includes('seguimiento general'),
    text: 'Da seguimiento al proceso de prácticas mediante los pendientes, correcciones, aprobaciones y tiempos de revisión disponibles. Usa la información para identificar registros que requieren atención.',
  },
  {
    match: (eyebrow, title) => title.includes('catalogos de practica'),
    text: 'Consulta y administra catálogos usados por las instituciones de práctica, como grados y asignaturas. Selecciona una categoría para revisar sus registros y las acciones habilitadas.',
  },
  {
    match: (eyebrow, title) => title.includes('territorio'),
    text: 'Administra la jerarquía territorial de provincias, cantones y parroquias. Estos datos permiten ubicar correctamente instituciones y mantener consistentes sus direcciones.',
  },
  {
    match: (eyebrow, title) => title.includes('usuarios'),
    text: 'Busca cuentas, filtra por rol o estado y revisa sus datos de acceso. Según tus permisos, puedes crear usuarios y administrar su habilitación o bloqueo.',
  },
  {
    match: (eyebrow, title) => title.includes('documentos y reportes'),
    text: 'Accede a los planes, informes, evaluaciones, seguimientos y actividades del proceso de prácticas. Selecciona un módulo para consultar registros; estudiantes pueden completar y enviar sus documentos, mientras los revisores gestionan los asignados.',
  },
  {
    match: (eyebrow, title) => eyebrow === 'practicas' && title.includes('formulario'),
    text: 'Consulta formularios de práctica, revisa preguntas y respuestas y, según tu rol, crea formularios, responde los asignados o interpreta respuestas recibidas.',
  },
  {
    match: (eyebrow, title) => eyebrow === 'practicas' && title.includes('entrevista'),
    text: 'Crea entrevistas para la institución receptora y organiza sus preguntas. Puedes responder entrevistas asignadas y guardar interpretaciones cuando tu rol tenga permisos de revisión.',
  },
  {
    match: (eyebrow, title) => eyebrow === 'practicas' && title.includes('ficha'),
    text: 'Crea fichas de observación para registrar información de la práctica. Consulta fichas asignadas, completa respuestas y revisa los registros según los permisos de tu rol.',
  },
  {
    match: (eyebrow) => eyebrow === 'instituciones',
    text: 'Consulta y administra la información de las instituciones vinculadas con las prácticas. Usa la búsqueda y los filtros para localizar registros; las opciones de creación y edición dependen de tus permisos.',
  },
  {
    match: (eyebrow) => eyebrow === 'administracion',
    text: 'Administra la información académica de la plataforma, consulta los registros disponibles y usa las acciones habilitadas para tu perfil.',
  },
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getPageGuide(eyebrow, title, description) {
  const normalizedEyebrow = normalize(eyebrow);
  const normalizedTitle = normalize(title);
  const guide = PAGE_GUIDES.find((entry) => entry.match(normalizedEyebrow, normalizedTitle));

  return guide?.text || `${description || title} Desde esta pantalla puedes consultar la información disponible y realizar las acciones que aparecen habilitadas para tu rol.`;
}

export function PageInfoButton({ title, description, className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label={`Información sobre ${title}`}
        className={`inline-flex min-h-10 flex-none items-center justify-center gap-2 rounded-md px-2 text-xs text-muted transition-colors hover:border-line hover:bg-panel-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-soft ${className}`}
        onClick={() => setOpen(true)}
        title={`Información sobre ${title}`}
        type="button"
      >
        <Info aria-hidden="true" size={16} />
        <span>Ayuda</span>
      </button>
      <Modal
        maxWidth="max-w-xl"
        onClose={() => setOpen(false)}
        open={open}
        title={`Acerca de ${title}`}
      >
        <p className="text-sm leading-6 text-body">{description}</p>
      </Modal>
    </>
  );
}

export function PageHeader({ eyebrow, title, description, action, bannerPlacement = 'PAGE_HEADER', helpText, headingLevel, compact = false }) {
  const workspace = usePracticeWorkspace();
  const Heading = headingLevel || (workspace ? 'h2' : 'h1');
  const consultOnly = workspace && (workspace.status !== 'APPROVED' || workspace.archived || workspace.courseActive === false);
  const effectiveDescription = consultOnly ? 'Consulta los registros de este apartado para la práctica seleccionada.' : description;
  const [bannerImages, setBannerImages] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadBanner() {
      try {
        const images = await apiRequest(`/api/public/interface-images?placement=${bannerPlacement}`);
        if (active) {
          setBannerImages(images.slice(0, 1));
        }
      } catch {
        if (active) {
          setBannerImages([]);
        }
      }
    }

    if (!workspace) loadBanner();

    return () => {
      active = false;
    };
  }, [bannerPlacement, workspace]);

  const primaryBanner = bannerImages[0];

  return (
    <div className={`sgp-page-header relative flex flex-col gap-3 ${compact ? 'sgp-page-header-compact' : ''}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="relative min-w-0">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {eyebrow}
            </p>
          )}
          <Heading className="mt-1 text-[clamp(1.65rem,2.6vw,2.25rem)] font-semibold leading-tight tracking-tight text-heading dark:text-heading">
            {title}
          </Heading>
          {effectiveDescription && (
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-body dark:text-ink">
              {effectiveDescription}
            </p>
          )}
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          {action}
          <PageInfoButton
            description={consultOnly ? effectiveDescription : helpText || getPageGuide(eyebrow, title, description)}
            title={title}
          />
        </div>
      </div>
      {primaryBanner && (
        <section className="flex items-center gap-3 rounded-lg border border-line bg-panel p-3">
          <img alt={primaryBanner.title || 'Aviso institucional'} className="h-14 w-20 flex-none rounded-md object-cover" src={apiUrl(primaryBanner.contentUrl)} />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Aviso institucional</p>
            <h2 className="mt-1 text-sm font-semibold text-heading">{primaryBanner.title}</h2>
            {primaryBanner.description && <p className="mt-1 text-sm text-body">{primaryBanner.description}</p>}
          </div>
        </section>
      )}
    </div>
  );
}
