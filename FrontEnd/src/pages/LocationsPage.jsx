import { useCallback, useEffect, useState } from 'react';
import { Eye, List, Plus, RefreshCw } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ENTITY_RELATIONS } from '../config/resources';
import { Alert } from '../components/ui/Alert';
import { ActionBar, PrimaryButton, SecondaryButton } from '../components/ui/ActionBar';
import { DataTable } from '../components/ui/DataTable';
import { EntitySelect } from '../components/ui/EntitySelect';
import { Field, Input } from '../components/ui/FormControls';
import { ModuleTab, ModuleTabs } from '../components/ui/ModuleTabs';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

export function LocationsPage() {
  const { token } = useAuth();
  const [provinces, setProvinces] = useState([]);
  const [cantons, setCantons] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [provinceId, setProvinceId] = useState('');
  const [cantonId, setCantonId] = useState('');
  const [forms, setForms] = useState({
    province: { code: '', name: '' },
    canton: { code: '', name: '', provinceId: '' },
    parish: { code: '', name: '', provinceId: '', cantonId: '' },
  });
  const [activeKind, setActiveKind] = useState('province');
  const [activeView, setActiveView] = useState('list');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProvinces = useCallback(async () => {
    setLoading(true);

    try {
      setProvinces(await apiRequest('/api/locations/provinces'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProvinces().catch((requestError) => setError(requestError.message));
  }, [loadProvinces]);

  async function loadCantons(id = provinceId) {
    if (!id) {
      return;
    }
    setLoading(true);
    setError('');

    try {
      setCantons(await apiRequest(`/api/locations/provinces/${id}/cantons`));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadParishes(id = cantonId) {
    if (!id) {
      return;
    }
    setLoading(true);
    setError('');

    try {
      setParishes(await apiRequest(`/api/locations/cantons/${id}/parishes`));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function create(kind, path) {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const body = cleanLocation(kind, forms[kind]);
      await apiRequest(path, {
        method: 'POST',
        token,
        body,
      });
      setForms((current) => ({
        ...current,
        [kind]: { code: '', name: '', provinceId: '', cantonId: '' },
      }));
      await refreshAfterCreate(kind, body);
      setActiveView('list');
      setMessage('Ubicacion creada correctamente.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshAfterCreate(kind, body) {
    await loadProvinces();

    if (kind === 'canton' && body.provinceId) {
      setProvinceId(String(body.provinceId));
      await loadCantons(body.provinceId);
    }

    if (kind === 'parish' && body.cantonId) {
      setCantonId(String(body.cantonId));
      await loadParishes(body.cantonId);
    }
  }

  function refreshActiveKind() {
    if (activeKind === 'province') {
      loadProvinces().catch((requestError) => setError(requestError.message));
      return;
    }

    if (activeKind === 'canton') {
      loadCantons();
      return;
    }

    loadParishes();
  }

  function setForm(kind, name, value) {
    setForms((current) => ({
      ...current,
      [kind]: resetLocationChildren(kind, { ...current[kind], [name]: value }, name),
    }));
  }

  const simpleColumns = [
    { key: 'id', header: 'ID' },
    { key: 'code', header: 'Codigo' },
    { key: 'name', header: 'Nombre' },
  ];
  const activeConfig = {
    province: {
      title: 'Provincias',
      rows: provinces,
      form: forms.province,
      path: '/api/locations/provinces',
    },
    canton: {
      title: 'Cantones',
      rows: cantons,
      form: forms.canton,
      path: '/api/locations/cantons',
      parentField: 'provinceId',
      parentLabel: 'Provincia',
      parentPath: ENTITY_RELATIONS.provinceId.path,
      listControl: (
        <Field label="Provincia para consultar">
          <div className="flex gap-2">
            <EntitySelect
              path={ENTITY_RELATIONS.provinceId.path}
              placeholder="Seleccionar provincia"
              value={provinceId}
              onChange={setProvinceId}
            />
            <SecondaryButton icon={Eye} loading={loading} onClick={() => loadCantons()} type="button">
              Ver
            </SecondaryButton>
          </div>
        </Field>
      ),
    },
    parish: {
      title: 'Parroquias',
      rows: parishes,
      form: forms.parish,
      path: '/api/locations/parishes',
      ancestorField: 'provinceId',
      ancestorLabel: 'Provincia',
      ancestorPath: ENTITY_RELATIONS.provinceId.path,
      parentField: 'cantonId',
      parentLabel: 'Canton',
      parentDisabled: (form) => !form.provinceId,
      parentPath: (form) =>
        form.provinceId ? `/api/locations/provinces/${form.provinceId}/cantons` : '',
      parentPlaceholder: (form) =>
        form.provinceId ? 'Seleccionar canton' : 'Selecciona primero una provincia',
      listControl: (
        <Field label="Canton para consultar">
          <div className="flex gap-2">
            <EntitySelect
              rows={cantons}
              placeholder="Seleccionar canton"
              value={cantonId}
              onChange={setCantonId}
            />
            <SecondaryButton icon={Eye} loading={loading} onClick={() => loadParishes()} type="button">
              Ver
            </SecondaryButton>
          </div>
        </Field>
      ),
    },
  }[activeKind];

  return (
    <>
      <PageHeader
        eyebrow="Catalogo territorial"
        title="Territorio"
        description="Administra provincias, cantones y parroquias para asociar instituciones correctamente."
        action={
          <SecondaryButton icon={RefreshCw} loading={loading} onClick={refreshActiveKind} type="button">
            Actualizar
          </SecondaryButton>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <SectionCard>
        <ModuleTabs>
          {[
            ['province', 'Provincias'],
            ['canton', 'Cantones'],
            ['parish', 'Parroquias'],
          ].map(([kind, label]) => (
            <ModuleTab
              active={activeKind === kind}
              key={kind}
              onClick={() => {
                setActiveKind(kind);
                setActiveView('list');
              }}
            >
              {label}
            </ModuleTab>
          ))}
        </ModuleTabs>
      </SectionCard>

      <SectionCard>
        <ModuleTabs>
          {[
            ['list', 'Listado'],
            ['form', 'Agregar'],
          ].map(([view, label]) => (
            <ModuleTab
              active={activeView === view}
              key={view}
              onClick={() => setActiveView(view)}
            >
              {label}
            </ModuleTab>
          ))}
        </ModuleTabs>
      </SectionCard>

      {activeView === 'list' && (
        <LocationListPanel
          columns={simpleColumns}
          control={activeConfig.listControl}
          loading={loading}
          onCreate={() => setActiveView('form')}
          rows={activeConfig.rows}
          title={activeConfig.title}
        />
      )}

      {activeView === 'form' && (
        <LocationFormPanel
          config={activeConfig}
          loading={loading}
          onCreate={() => create(activeKind, activeConfig.path)}
          onField={(name, value) => setForm(activeKind, name, value)}
          onList={() => setActiveView('list')}
        />
      )}
    </>
  );
}

function LocationListPanel({
  title,
  rows,
  columns,
  control,
  loading,
  onCreate,
}) {
  return (
    <SectionCard
      title={title}
      action={
        <PrimaryButton icon={Plus} onClick={onCreate} type="button">
          Agregar
        </PrimaryButton>
      }
    >
      <div className="space-y-4">
        {control}
        <DataTable
          columns={columns}
          emptyText={`Aun no hay ${title.toLowerCase()} registrados.`}
          enableFilters
          loading={loading}
          rows={rows}
        />
      </div>
    </SectionCard>
  );
}

function LocationFormPanel({ config, loading, onCreate, onField, onList }) {
  const {
    ancestorField,
    ancestorLabel,
    ancestorPath,
    form,
    parentDisabled,
    parentField,
    parentLabel,
    parentPath,
    parentPlaceholder,
    parentRows,
    title,
  } = config;
  const resolvedParentPath = typeof parentPath === 'function' ? parentPath(form) : parentPath;
  const resolvedParentDisabled = typeof parentDisabled === 'function' ? parentDisabled(form) : false;
  const resolvedParentPlaceholder =
    typeof parentPlaceholder === 'function'
      ? parentPlaceholder(form)
      : parentPlaceholder || `Seleccionar ${parentLabel?.toLowerCase()}`;

  return (
    <SectionCard
      title={`Agregar ${title.toLowerCase()}`}
      action={
        <SecondaryButton icon={List} onClick={onList} type="button">
          Volver al listado
        </SecondaryButton>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Codigo">
          <Input value={form.code || ''} onChange={(event) => onField('code', event.target.value)} />
        </Field>
        <Field label="Nombre">
          <Input value={form.name || ''} onChange={(event) => onField('name', event.target.value)} />
        </Field>
        {ancestorField && (
          <Field label={ancestorLabel}>
            <EntitySelect
              path={ancestorPath}
              placeholder={`Seleccionar ${ancestorLabel.toLowerCase()}`}
              value={form[ancestorField] || ''}
              onChange={(value) => onField(ancestorField, value)}
            />
          </Field>
        )}
        {parentField && (
          <Field label={parentLabel}>
            <EntitySelect
              disabled={resolvedParentDisabled}
              path={resolvedParentPath}
              rows={parentRows}
              placeholder={resolvedParentPlaceholder}
              value={form[parentField] || ''}
              onChange={(value) => onField(parentField, value)}
            />
          </Field>
        )}
      </div>
      <div className="mt-4">
        <ActionBar>
          <PrimaryButton icon={Plus} loading={loading} onClick={onCreate} type="button">
            Guardar ubicacion
          </PrimaryButton>
        </ActionBar>
      </div>
    </SectionCard>
  );
}

function resetLocationChildren(kind, form, changedField) {
  if (kind === 'parish' && changedField === 'provinceId') {
    return { ...form, cantonId: '' };
  }

  return form;
}

function cleanLocation(kind, form) {
  return Object.fromEntries(
    Object.entries(form)
      .filter(([key]) => !(kind === 'parish' && key === 'provinceId'))
      .filter(([, value]) => value !== '' && value !== null && value !== undefined)
      .map(([key, value]) => [key, key.endsWith('Id') ? Number(value) : value])
  );
}
