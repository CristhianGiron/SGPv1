/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          UniversitiesPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Presenta la estructura universitaria y su gestión según los permisos del usuario.
 */

import { CatalogWorkflowPage } from './CatalogWorkflowPage';
import { useAuth } from '../auth/AuthContext';
import { workflowCopy } from '../config/roleExperience';
import { ResourceCrud } from '../components/ResourceCrud';
import { PageHeader } from '../components/ui/PageHeader';
import { UNIVERSITY_CATALOG_RESOURCES } from '../config/resources';
import { InstitutionsPage } from './InstitutionsPage';

const UNIVERSITIES_MODULE = {
  id: 'universities',
  title: 'Universidades',
  description: 'Administra universidades, facultades, carreras, ciclos y asignaturas académicas.',
};

export function UniversitiesPage({ activeModuleId, route }) {
  const { roles } = useAuth();
  const resource = UNIVERSITY_CATALOG_RESOURCES.find((item) => item.id === activeModuleId);
  const activeModule = resource || UNIVERSITIES_MODULE;

  if (!activeModuleId || activeModuleId === 'universities') return <CatalogWorkflowPage kind="universities" route={route} />;

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title={activeModule.title}
        description={workflowCopy('universities', roles)}
        helpText={workflowCopy('universities', roles)}
      />

      {!resource ? (
        <InstitutionsPage embedded scope="universities" />
      ) : (
        <ResourceCrud key={resource.id} resource={resource} />
      )}
    </>
  );
}
