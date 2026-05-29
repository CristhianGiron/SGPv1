import { ResourceCrud } from '../components/ResourceCrud';
import { PageHeader } from '../components/ui/PageHeader';
import { UNIVERSITY_CATALOG_RESOURCES } from '../config/resources';
import { InstitutionsPage } from './InstitutionsPage';

const UNIVERSITIES_MODULE = {
  id: 'universities',
  title: 'Universidades',
  description: 'Administra universidades, facultades, carreras, ciclos y asignaturas academicas.',
};

export function UniversitiesPage({ activeModuleId }) {
  const resource = UNIVERSITY_CATALOG_RESOURCES.find((item) => item.id === activeModuleId);
  const activeModule = resource || UNIVERSITIES_MODULE;

  return (
    <>
      <PageHeader
        eyebrow="Administracion"
        title={activeModule.title}
        description={activeModule.description || 'Configura la informacion academica de las universidades.'}
      />

      {!resource ? (
        <InstitutionsPage embedded scope="universities" />
      ) : (
        <ResourceCrud key={resource.id} resource={resource} />
      )}
    </>
  );
}
