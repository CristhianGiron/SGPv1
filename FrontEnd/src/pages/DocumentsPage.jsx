import { DOCUMENT_MODULES } from '../config/endpointModules';
import { EndpointConsole } from '../components/EndpointConsole';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';

export function DocumentsPage({ activeModuleId }) {
  const { roles } = useAuth();
  const canFilterRows = !roles.includes('ROLE_ESTUDIANTE');
  const activeModule = DOCUMENT_MODULES.find((module) => module.id === activeModuleId);

  return (
    <>
      <PageHeader
        eyebrow="Practicas"
        title={activeModule?.title || 'Documentos y reportes'}
        description={
          activeModule
            ? 'Consulta, completa, envia y revisa la informacion de este documento.'
            : 'Trabaja con planes, informes, evaluaciones, seguimientos y actividades cumplidas.'
        }
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
