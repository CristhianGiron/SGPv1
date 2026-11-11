/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DocumentsPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Presenta los módulos documentales de la práctica y sus operaciones autorizadas.
 */

import { workflowCopy } from '../config/roleExperience';
import { DOCUMENT_MODULES } from '../config/endpointModules';
import { EndpointConsole } from '../components/EndpointConsole';
import { useAuth } from '../auth/AuthContext';
import { usePracticeWorkspace } from '../contexts/PracticeWorkspaceContext';
import { PageHeader } from '../components/ui/PageHeader';

export function DocumentsPage({ activeModuleId }) {
  const { roles } = useAuth();
  const workspace = usePracticeWorkspace();
  const canFilterRows = !roles.includes('ROLE_ESTUDIANTE');
  const activeModule = DOCUMENT_MODULES.find((module) => module.id === activeModuleId);

  return (
    <>
      <PageHeader
        compact={Boolean(workspace)}
        eyebrow={workspace ? undefined : "Prácticas"}
        title={activeModule?.title || 'Documentos y reportes'}
        description={workspace ? undefined : workflowCopy('documents', roles, activeModule)}
        helpText={workflowCopy('documents', roles, activeModule)}
      />
      <EndpointConsole
        activeModuleId={activeModule?.id || null}
        enableListFilters={canFilterRows}
        modules={DOCUMENT_MODULES}
        showModuleSwitcher={false}
      />
    </>
  );
}
