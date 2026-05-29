import { useState } from 'react';
import { PRACTICE_CATALOG_RESOURCES } from '../config/resources';
import { ResourceCrud } from '../components/ResourceCrud';
import { ModuleTab, ModuleTabs } from '../components/ui/ModuleTabs';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

export function CatalogsPage() {
  const [resourceId, setResourceId] = useState(PRACTICE_CATALOG_RESOURCES[0].id);
  const resource = PRACTICE_CATALOG_RESOURCES.find((item) => item.id === resourceId) || PRACTICE_CATALOG_RESOURCES[0];

  return (
    <>
      <PageHeader
        eyebrow="Administracion"
        title="Catalogos de practica"
        description="Mantiene grados y asignaturas relacionadas con las instituciones de practica."
      />

      <SectionCard description="Elige el catalogo de practica que quieres revisar o editar." title="Catalogo">
        <ModuleTabs>
          {PRACTICE_CATALOG_RESOURCES.map((item) => (
            <ModuleTab
              active={resourceId === item.id}
              key={item.id}
              onClick={() => setResourceId(item.id)}
            >
              {item.title}
            </ModuleTab>
          ))}
        </ModuleTabs>
      </SectionCard>

      <ResourceCrud key={resource.id} resource={resource} />
    </>
  );
}
