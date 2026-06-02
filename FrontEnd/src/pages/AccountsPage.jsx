import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, Lock, RefreshCw, Unlock, UserPlus } from 'lucide-react';
import { apiRequest, toQuery, unwrapPage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ENTITY_RELATIONS, ROLES } from '../config/resources';
import { Alert } from '../components/ui/Alert';
import { ActionMenu } from '../components/ui/ActionMenu';
import { PrimaryButton, SecondaryButton } from '../components/ui/ActionBar';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { DataTable } from '../components/ui/DataTable';
import { EntitySelect } from '../components/ui/EntitySelect';
import { FilterPanel } from '../components/ui/FilterPanel';
import { Field, Input, Select } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { booleanSelectValue, buildSelectOptions, matchesOpenSearch } from '../utils/filtering';
import { formatRole, joinText } from '../utils/format';

const INITIAL_FORM = {
  username: '',
  password: '',
  names: '',
  lastNames: '',
  cedula: '',
  institutionalEmail: '',
  phone: '',
  address: '',
  role: 'ROLE_ESTUDIANTE',
  facultyId: '',
  careerId: '',
  academicCycleId: '',
  institutionId: '',
  gradeId: '',
  gradeParallelId: '',
};

export function AccountsPage() {
  const { token } = useAuth();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [filters, setFilters] = useState({
    query: '',
    role: '',
    enabled: '',
    locked: '',
    academicCycle: '',
    institution: '',
  });
  const [activeView, setActiveView] = useState('list');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const payload = await apiRequest(
        `/api/account/search${toQuery({ page: 0, size: 200 })}`,
        { token }
      );
      setRows(unwrapPage(payload));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  function setFormField(name, value) {
    setForm((current) => applyAccountFormChange(current, name, value));
  }

  async function createAccount(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest('/api/admin/accounts', {
        method: 'POST',
        token,
        body: cleanAccountPayload(form),
      });
      setForm(INITIAL_FORM);
      await loadAccounts();
      setActiveView('list');
      setMessage('Usuario creado correctamente.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function runAction(path, confirmation) {
    const accepted = await confirm(confirmation || {
      title: 'Confirmar accion',
      description: 'Esta accion modificara el acceso de la cuenta seleccionada.',
      confirmLabel: 'Confirmar',
      tone: 'warning',
    });

    if (!accepted) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest(path, {
        method: 'PATCH',
        token,
      });
      await loadAccounts();
      setMessage('Cambio aplicado.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'username', header: 'Usuario' },
    {
      key: 'name',
      header: 'Nombre',
      render: (row) => joinText(row.names, row.lastNames) || '-',
    },
    {
      key: 'roles',
      header: 'Rol',
      render: (row) => (row.roles || []).map(formatRole).join(', '),
    },
    { key: 'enabled', header: 'Estado', render: (row) => <StatusBadge status={row.enabled} /> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <ActionMenu
          actions={[
            {
              key: row.enabled ? 'disable' : 'enable',
              label: row.enabled ? 'Desactivar' : 'Activar',
              icon: row.enabled ? Ban : CheckCircle2,
              onClick: () =>
                runAction(`/api/admin/accounts/${row.id}/${row.enabled ? 'disable' : 'enable'}`, {
                  title: row.enabled ? 'Desactivar usuario' : 'Activar usuario',
                  description: row.enabled
                    ? 'La cuenta no podra ingresar al sistema mientras este desactivada.'
                    : 'La cuenta podra ingresar nuevamente al sistema.',
                  details: joinText(row.names, row.lastNames) || row.username,
                  confirmLabel: row.enabled ? 'Desactivar' : 'Activar',
                  tone: row.enabled ? 'danger' : 'warning',
                }),
            },
            {
              key: row.locked ? 'unlock' : 'lock',
              label: row.locked ? 'Desbloquear' : 'Bloquear',
              icon: row.locked ? Unlock : Lock,
              onClick: () =>
                runAction(`/api/admin/accounts/${row.id}/${row.locked ? 'unlock' : 'lock'}`, {
                  title: row.locked ? 'Desbloquear usuario' : 'Bloquear usuario',
                  description: row.locked
                    ? 'La cuenta podra volver a operar segun sus permisos.'
                    : 'La cuenta quedara bloqueada hasta que sea desbloqueada.',
                  details: joinText(row.names, row.lastNames) || row.username,
                  confirmLabel: row.locked ? 'Desbloquear' : 'Bloquear',
                  tone: row.locked ? 'warning' : 'danger',
                }),
            },
          ]}
        />
      ),
    },
  ];
  const filterOptions = useMemo(
    () => ({
      roles: ROLES.filter((role) => rows.some((row) => (row.roles || []).includes(role))),
      academicCycles: buildSelectOptions(rows, (row) => row.academicCycle),
      institutions: buildSelectOptions(rows, (row) => row.institution),
    }),
    [rows]
  );
  const filteredRows = useMemo(
    () => rows.filter((row) => filterAccountRow(row, filters)),
    [filters, rows]
  );

  return (
    <>
      <PageHeader
        eyebrow="Administracion"
        title="Usuarios"
        description="Crea usuarios y controla si pueden ingresar al sistema."
        action={
          <SecondaryButton icon={RefreshCw} loading={loading} onClick={loadAccounts} type="button">
            Actualizar
          </SecondaryButton>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <>
          <FilterPanel
            activeCount={countActiveFilters(filters, ['query'])}
            hasActiveFilters={countActiveFilters(filters) > 0}
            onClear={() => setFilters({ query: '', role: '', enabled: '', locked: '', academicCycle: '', institution: '' })}
            search={(
              <Field label="Buscar">
                <Input
                  placeholder="Usuario, nombre, cedula, correo o institucion"
                  type="search"
                  value={filters.query}
                  onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                />
              </Field>
            )}
            summary={`${filteredRows.length} de ${rows.length} usuarios`}
            title="Filtrar usuarios"
          >
              <Field label="Rol">
                <Select
                  value={filters.role}
                  onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
                >
                  <option value="">Todos</option>
                  {filterOptions.roles.map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Estado">
                <Select
                  value={filters.enabled}
                  onChange={(event) => setFilters((current) => ({ ...current, enabled: event.target.value }))}
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </Select>
              </Field>
              <Field label="Bloqueo">
                <Select
                  value={filters.locked}
                  onChange={(event) => setFilters((current) => ({ ...current, locked: event.target.value }))}
                >
                  <option value="">Todos</option>
                  <option value="true">Bloqueados</option>
                  <option value="false">Desbloqueados</option>
                </Select>
              </Field>
              <Field label="Ciclo academico">
                <Select
                  value={filters.academicCycle}
                  onChange={(event) => setFilters((current) => ({ ...current, academicCycle: event.target.value }))}
                >
                  <option value="">Todos</option>
                  {filterOptions.academicCycles.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Institucion">
                <Select
                  value={filters.institution}
                  onChange={(event) => setFilters((current) => ({ ...current, institution: event.target.value }))}
                >
                  <option value="">Todas</option>
                  {filterOptions.institutions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
          </FilterPanel>

          <SectionCard
            title="Usuarios"
            action={
              <PrimaryButton icon={UserPlus} onClick={() => setActiveView('create')} type="button">
                Crear usuario
              </PrimaryButton>
            }
          >
            <DataTable
              columns={columns}
              emptyText="Aun no hay usuarios registrados."
              loading={loading}
              rows={filteredRows}
            />
          </SectionCard>
        </>

      <Modal
        description="Registra la cuenta y vuelve al listado sin cambiar de pagina."
        maxWidth="max-w-5xl"
        onClose={() => setActiveView('list')}
        open={activeView === 'create'}
        title="Crear usuario"
      >
        <form className="grid gap-4 md:grid-cols-3" onSubmit={createAccount}>
          {[
            ['username', 'Usuario'],
            ['password', 'Contraseña inicial'],
            ['names', 'Nombres'],
            ['lastNames', 'Apellidos'],
            ['cedula', 'Cedula'],
            ['institutionalEmail', 'Correo institucional'],
            ['phone', 'Telefono'],
            ['address', 'Direccion'],
          ].map(([name, label]) => (
            <Field key={name} label={label}>
              <Input
                type={name === 'password' ? 'password' : 'text'}
                value={form[name]}
                onChange={(event) => setFormField(name, event.target.value)}
              />
            </Field>
          ))}
          <Field label="Rol">
            <Select value={form.role} onChange={(event) => setFormField('role', event.target.value)}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {formatRole(role)}
                </option>
              ))}
            </Select>
          </Field>
          {accountRoleUsesAcademicPath(form.role) && (
            <>
              <Field label="Facultad">
                <EntitySelect
                  path={ENTITY_RELATIONS.facultyId.path}
                  placeholder={ENTITY_RELATIONS.facultyId.placeholder}
                  value={form.facultyId}
                  onChange={(value) => setFormField('facultyId', value)}
                  required
                />
              </Field>
              <Field label="Carrera">
                <EntitySelect
                  disabled={!form.facultyId}
                  path={ENTITY_RELATIONS.careerId.path}
                  placeholder={form.facultyId ? ENTITY_RELATIONS.careerId.placeholder : 'Selecciona primero una facultad'}
                  value={form.careerId}
                  rowFilter={(row) => hasMatchingId(row.facultyId, form.facultyId)}
                  onChange={(value) => setFormField('careerId', value)}
                  required
                />
              </Field>
              {accountRoleUsesAcademicCycle(form.role) && (
                <Field label="Ciclo academico">
                  <EntitySelect
                    disabled={!form.careerId}
                    path={ENTITY_RELATIONS.academicCycleId.path}
                    placeholder={form.careerId ? ENTITY_RELATIONS.academicCycleId.placeholder : 'Selecciona primero una carrera'}
                    value={form.academicCycleId}
                    rowFilter={(row) => hasMatchingId(row.careerId, form.careerId)}
                    onChange={(value) => setFormField('academicCycleId', value)}
                    required
                  />
                </Field>
              )}
            </>
          )}
          {accountRoleUsesInstitution(form.role) && (
            <>
              <Field label={accountInstitutionLabel(form.role)}>
                <EntitySelect
                  path={ENTITY_RELATIONS.institutionId.path}
                  placeholder={accountInstitutionPlaceholder(form.role)}
                  value={form.institutionId}
                  rowFilter={accountInstitutionFilter(form.role)}
                  onChange={(value) => setFormField('institutionId', value)}
                  required
                />
              </Field>
              {accountRoleUsesGrade(form.role) && (
                <Field label="Grado">
                  <EntitySelect
                    disabled={!form.institutionId}
                    path={ENTITY_RELATIONS.gradeId.path}
                    placeholder={form.institutionId ? ENTITY_RELATIONS.gradeId.placeholder : 'Selecciona primero una institucion educativa'}
                    value={form.gradeId}
                    rowFilter={(row) => hasMatchingId(row.institutionId, form.institutionId)}
                    onChange={(value) => setFormField('gradeId', value)}
                    required
                  />
                </Field>
              )}
              {accountRoleUsesGradeParallel(form.role) && (
                <Field label="Paralelo">
                  <EntitySelect
                    disabled={!form.gradeId}
                    path={ENTITY_RELATIONS.gradeParallelId.path}
                    placeholder={form.gradeId ? ENTITY_RELATIONS.gradeParallelId.placeholder : 'Selecciona primero un grado'}
                    value={form.gradeParallelId}
                    rowFilter={(row) => hasMatchingId(row.gradeId, form.gradeId)}
                    onChange={(value) => setFormField('gradeParallelId', value)}
                    required
                  />
                </Field>
              )}
            </>
          )}
          <div className="md:col-span-3">
            <PrimaryButton icon={UserPlus} loading={loading} type="submit">Crear usuario</PrimaryButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

function applyAccountFormChange(form, name, value) {
  const next = { ...form, [name]: value };

  if (name === 'role') {
    next.facultyId = '';
    next.careerId = '';
    next.academicCycleId = '';
    next.institutionId = '';
    next.gradeId = '';
    next.gradeParallelId = '';
    return next;
  }

  if (name === 'facultyId') {
    next.careerId = '';
    next.academicCycleId = '';

    if (value) {
      next.institutionId = '';
    }
  }

  if (name === 'careerId') {
    next.academicCycleId = '';

    if (value) {
      next.institutionId = '';
    }
  }

  if (name === 'academicCycleId' && value) {
    next.institutionId = '';
  }

  if (name === 'institutionId' && value) {
    next.facultyId = '';
    next.careerId = '';
    next.academicCycleId = '';
    next.gradeId = '';
    next.gradeParallelId = '';
  }

  if (name === 'gradeId') {
    next.gradeParallelId = '';
  }

  return next;
}

function accountRoleUsesAcademicCycle(role) {
  return role === 'ROLE_ESTUDIANTE';
}

function accountRoleUsesAcademicPath(role) {
  return accountRoleUsesAcademicCycle(role) || role === 'ROLE_DIRECTOR_PRACTICAS';
}

function accountRoleUsesInstitution(role) {
  return [
    'ROLE_ADMIN',
    'ROLE_TUTOR_PRACTICAS',
    'ROLE_DIRECTORA_INSTITUCION',
    'ROLE_TUTOR_INSTITUCIONAL',
  ].includes(role);
}

function accountInstitutionLabel(role) {
  return accountRoleUsesSchoolInstitution(role) ? 'Institucion educativa' : 'Universidad';
}

function accountInstitutionPlaceholder(role) {
  return accountRoleUsesSchoolInstitution(role)
    ? 'Seleccionar escuela o colegio'
    : 'Seleccionar universidad';
}

function accountInstitutionFilter(role) {
  return accountRoleUsesSchoolInstitution(role)
    ? (row) => row?.type === 'ESCUELA' || row?.type === 'COLEGIO'
    : (row) => row?.type === 'UNIVERSIDAD';
}

function accountRoleUsesSchoolInstitution(role) {
  return role === 'ROLE_DIRECTORA_INSTITUCION' || role === 'ROLE_TUTOR_INSTITUCIONAL';
}

function accountRoleUsesGrade(role) {
  return role === 'ROLE_DIRECTORA_INSTITUCION' || role === 'ROLE_TUTOR_INSTITUCIONAL';
}

function accountRoleSubmitsGrade(role) {
  return role === 'ROLE_DIRECTORA_INSTITUCION';
}

function accountRoleUsesGradeParallel(role) {
  return role === 'ROLE_TUTOR_INSTITUCIONAL';
}

function hasMatchingId(left, right) {
  return Boolean(right) && String(left ?? '') === String(right ?? '');
}

function cleanAccountPayload(form) {
  return Object.fromEntries(
    Object.entries(form)
      .filter(([key]) => key !== 'facultyId')
      .filter(([key]) => key !== 'careerId' || form.role === 'ROLE_DIRECTOR_PRACTICAS')
      .filter(([key]) => key !== 'academicCycleId' || accountRoleUsesAcademicCycle(form.role))
      .filter(([key]) => key !== 'institutionId' || accountRoleUsesInstitution(form.role))
      .filter(([key]) => key !== 'gradeId' || accountRoleSubmitsGrade(form.role))
      .filter(([key]) => key !== 'gradeParallelId' || accountRoleUsesGradeParallel(form.role))
      .map(([key, value]) => [
        key,
        key.endsWith('Id') ? (value ? Number(value) : null) : value || null,
      ])
  );
}

function filterAccountRow(row, filters) {
  if (!matchesOpenSearch([
    row.username,
    row.names,
    row.lastNames,
    row.cedula,
    row.institutionalEmail,
    row.phone,
    row.address,
    row.academicCycle,
    row.institution,
    ...(row.roles || []),
  ], filters.query)) {
    return false;
  }

  if (filters.role && !(row.roles || []).includes(filters.role)) {
    return false;
  }

  if (filters.enabled && booleanSelectValue(row.enabled) !== filters.enabled) {
    return false;
  }

  if (filters.locked && booleanSelectValue(row.locked) !== filters.locked) {
    return false;
  }

  if (filters.academicCycle && row.academicCycle !== filters.academicCycle) {
    return false;
  }

  if (filters.institution && row.institution !== filters.institution) {
    return false;
  }

  return true;
}

function countActiveFilters(filters, excludeKeys = []) {
  return Object.entries(filters || {})
    .filter(([key]) => !excludeKeys.includes(key))
    .filter(([, value]) => String(value || '').trim())
    .length;
}
