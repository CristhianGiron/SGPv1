/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeInstitutionsPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Presenta los centros receptores y su información para el desarrollo de prácticas.
 */

import { CatalogWorkflowPage } from '../../catalogs/pages/CatalogWorkflowPage';
import { ResourceCrud } from '../../catalogs/components/ResourceCrud';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PRACTICE_CATALOG_RESOURCES } from '../../../config/resources';
import { InstitutionsPage } from './InstitutionsPage';

const INSTITUTIONS_MODULE = {
  id: 'institutions',
  title: 'Instituciones de práctica',
  description: 'Administra las escuelas, colegios u organizaciones donde se desarrollan las prácticas.',
};

export function PracticeInstitutionsPage({ activeModuleId, route }) {
  const resource = PRACTICE_CATALOG_RESOURCES.find((item) => item.id === activeModuleId);
  const activeModule = resource || INSTITUTIONS_MODULE;

  if (!activeModuleId || activeModuleId === 'institutions') return <CatalogWorkflowPage kind="institutions" route={route} />;

  return (
    <>
      <PageHeader
        eyebrow="Instituciones"
        title={activeModule.title}
        description={activeModule.description || 'Configura la información que se usa en las prácticas.'}
        helpText={`Este módulo organiza ${activeModule.title.toLowerCase()} que se utilizan en la gestión de prácticas. Puedes consultar y localizar registros; las opciones para crear, editar o desactivar información dependen de los permisos de tu cuenta.`}
      />

      {!resource ? (
        <InstitutionsPage embedded scope="practice" />
      ) : (
        <ResourceCrud key={resource.id} resource={resource} />
      )}
    </>
  );
}
