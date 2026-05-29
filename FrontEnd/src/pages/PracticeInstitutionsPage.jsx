import { ResourceCrud } from '../components/ResourceCrud';
import { PageHeader } from '../components/ui/PageHeader';
import { PRACTICE_CATALOG_RESOURCES } from '../config/resources';
import { InstitutionsPage } from './InstitutionsPage';

const INSTITUTIONS_MODULE = {
  id: 'institutions',
  title: 'Instituciones de practica',
  description: 'Administra las escuelas, colegios u organizaciones donde se desarrollan las practicas.',
};

export function PracticeInstitutionsPage({ activeModuleId }) {
  const resource = PRACTICE_CATALOG_RESOURCES.find((item) => item.id === activeModuleId);
  const activeModule = resource || INSTITUTIONS_MODULE;

  return (
    <>
      <PageHeader
        eyebrow="Instituciones"
        title={activeModule.title}
        description={activeModule.description || 'Configura la informacion que se usa en las practicas.'}
      />

      {!resource ? (
        <InstitutionsPage embedded scope="practice" />
      ) : (
        <ResourceCrud key={resource.id} resource={resource} />
      )}
    </>
  );
}
