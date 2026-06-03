/**
 * RESOURCE CRUD - Componente genérico para CRUD de cualquier recurso
 * 
 * Este es un componente muy importante que maneja operaciones genéricas:
 * - C (Create): Crear nuevos registros
 * - R (Read): Listar y ver registros
 * - U (Update): Editar registros existentes
 * - D (Delete): Eliminar registros
 * 
 * Acepta una configuración de "recurso" que define:
 * - listPath: Endpoint para obtener lista de registros
 * - createPath: Endpoint para crear registro
 * - updatePath: Función que retorna endpoint para actualizar (recibe id)
 * - deletePath: Función que retorna endpoint para eliminar (recibe id)
 * - fields: Array de campos del formulario
 * - columns: Array de columnas de la tabla
 * - actions: Array de acciones adicionales
 * 
 * Proporciona:
 * - Vista de tabla con registros
 * - Vista de formulario para crear/editar
 * - Botones de acciones adicionales
 * - Manejo de errores y mensajes de éxito
 */
import { useEffect, useState } from 'react';
import { Pencil, Plus, RefreshCw, Save, Trash2, Zap } from 'lucide-react';
import { apiRequest, unwrapPage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from './ui/Alert';
import { ActionBar, DangerButton, PrimaryButton, SecondaryButton } from './ui/ActionBar';
import { ActionMenu } from './ui/ActionMenu';
import { useConfirm } from './ui/ConfirmDialog';
import { DataTable } from './ui/DataTable';
import { EntitySelect } from './ui/EntitySelect';
import { Field, Input, Select, Textarea } from './ui/FormControls';
import { Modal } from './ui/Modal';
import { SectionCard } from './ui/SectionCard';
import { StatusBadge } from './ui/StatusBadge';
import { filterInactiveForNonAdmin } from '../utils/visibility';

export function ResourceCrud({ resource }) {
  const { roles, token } = useAuth();
  const confirm = useConfirm();
  const canFilterRows = !roles.includes('ROLE_ESTUDIANTE');
  // Array de registros cargados del servidor
  const [rows, setRows] = useState([]);
  // Estado del formulario (datos que se están editando/creando)
  const [form, setForm] = useState(() => initialForm(resource.fields));
  // ID del registro que se está editando (vacío si es creación)
  const [selectedId, setSelectedId] = useState('');
  // Vista activa: 'list' (tabla) o 'form' (formulario)
  const [activeView, setActiveView] = useState('list');
  // Indica si está cargando registros
  const [loading, setLoading] = useState(false);
  // Indica si está guardando/deletando
  const [saving, setSaving] = useState(false);
  // Mensaje de éxito a mostrar
  const [message, setMessage] = useState('');
  // Mensaje de error a mostrar
  const [error, setError] = useState('');

  /**
   * loadRows - Carga la lista de registros desde el servidor
   * Se ejecuta automáticamente cuando el componente monta
   */
  async function loadRows() {
    setLoading(true);
    setError('');

    try {
      // Llamar al endpoint de listado definido en resource.listPath
      const payload = await apiRequest(resource.listPath, { token });
      // unwrapPage maneja respuestas paginadas o arrays directos
      const visibleRows = filterInactiveForNonAdmin(unwrapPage(payload), roles);
      setRows(resource.rowFilter ? visibleRows.filter(resource.rowFilter) : visibleRows);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  // Cargar registros cuando el componente monta o cambia el recurso
  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource.id, token]);

  /**
   * setField - Actualiza un campo específico del formulario
   */
  function setField(name, value) {
    setForm((current) => applyFieldChange(resource, current, name, value));
  }

  /**
   * startEdit - Prepara el formulario para editar un registro existente
   */
  function startEdit(row) {
    setSelectedId(row.id);
    setForm(fromRow(resource.fields, row));
    setActiveView('form');
  }

  /**
   * startCreate - Limpia el formulario para crear un nuevo registro
   */
  function startCreate() {
    resetForm();
    setActiveView('form');
  }

  /**
   * resetForm - Limpia el formulario a sus valores iniciales
   */
  function resetForm() {
    setSelectedId('');
    setForm(initialForm(resource.fields));
  }

  /**
   * runAction - Ejecuta una acción personalizada en un registro
   * Las acciones son botones adicionales configurados en resource.actions
   * Ejemplo: "Aprobar", "Rechazar", "Enviar", etc
   */
  async function runAction(action, row) {
    if (action.confirmation !== false) {
      const accepted = await confirm(resourceActionConfirmation(resource, action, row));

      if (!accepted) {
        return;
      }
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      // Llamar al endpoint de la acción, pasando el registro completo
      await apiRequest(action.path(row), {
        method: action.method || 'PATCH',
        token,
      });
      // Recargar lista para reflejar cambios
      await loadRows();
      setMessage(`${action.label} ejecutado`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  /**
   * handleSubmit - Maneja el envío del formulario (crear o actualizar)
   * Si hay selectedId = actualizar, si no = crear
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      // Limpiar el payload (remover campos vacíos, etc)
      const body = cleanPayload(resource.fields, form);
      // Determinar si es crear o actualizar
      await apiRequest(selectedId ? resource.updatePath(selectedId) : resource.createPath, {
        method: selectedId ? resource.updateMethod || 'PUT' : 'POST',
        token,
        body,
      });
      // Resetear formulario y cerrar modal
      resetForm();
      await loadRows();
      setMessage(selectedId ? 'Cambios guardados.' : 'Elemento creado correctamente.');
      setActiveView('list');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  /**
   * handleDelete - Elimina el registro actualmente seleccionado
   * Pide confirmación antes de eliminar
   */
  async function handleDelete() {
    if (!selectedId || !resource.deletePath) {
      return;
    }

    const accepted = await confirm({
      title: `Eliminar ${resource.title.toLowerCase()}`,
      description: 'Esta accion eliminara el registro seleccionado. Revisa antes de continuar.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await apiRequest(resource.deletePath(selectedId), {
        method: 'DELETE',
        token,
      });
      resetForm();
      await loadRows();
      setMessage('Elemento eliminado.');
      setActiveView('list');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    ...(resource.columns || []).map((column) => ({
      ...column,
      render:
        column.type === 'status'
          ? (row) => <StatusBadge status={row[column.key]} />
          : column.render,
    })),
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <ActionMenu
          actions={[
            {
              key: 'edit',
              label: 'Editar',
              icon: Pencil,
              onClick: () => startEdit(row),
            },
            ...(resource.actions || [])
              .filter((action) => !action.visibleWhen || action.visibleWhen(row))
              .map((action) => ({
                key: `action-${action.label}`,
                label: action.label,
                icon: action.icon || Zap,
                disabled: saving,
                onClick: () => runAction(action, row),
              })),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <SectionCard
        title={resource.title}
        action={
          <ActionBar>
            <PrimaryButton icon={Plus} onClick={startCreate} type="button">
              Agregar
            </PrimaryButton>
            <SecondaryButton icon={RefreshCw} loading={loading} onClick={loadRows} type="button">
              Actualizar
            </SecondaryButton>
          </ActionBar>
        }
      >
        <div className="space-y-3">
          {error && activeView !== 'form' && <Alert tone="error">{error}</Alert>}
          {message && <Alert tone="success">{message}</Alert>}
          <DataTable
            columns={columns}
            emptyText={`Aun no hay ${resource.title.toLowerCase()} para mostrar.`}
            enableFilters={canFilterRows}
            loading={loading}
            rows={rows}
          />
        </div>
      </SectionCard>

      <Modal
        description="Completa solo los campos necesarios y guarda para volver al listado."
        maxWidth="max-w-3xl"
        onClose={() => setActiveView('list')}
        open={activeView === 'form'}
        title={selectedId ? `Editar ${resource.title.toLowerCase()}` : `Agregar ${resource.title.toLowerCase()}`}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <Alert tone="error">{error}</Alert>}
          {resource.fields.map((field) => (
            <Field key={field.name} label={field.label}>
              <ResourceInput
                disabled={isFieldDisabled(resource, form, field)}
                field={field}
                form={form}
                resource={resource}
                required={isFieldRequired(field, form)}
                setField={setField}
                value={form[field.name]}
              />
            </Field>
          ))}

          <ActionBar>
            <PrimaryButton icon={selectedId ? Save : Plus} loading={saving} type="submit">
              {selectedId ? 'Guardar cambios' : 'Guardar'}
            </PrimaryButton>
            {selectedId && (
              <SecondaryButton icon={Plus} onClick={startCreate} type="button">
                Nuevo
              </SecondaryButton>
            )}
            {selectedId && resource.deletePath && (
              <DangerButton icon={Trash2} loading={saving} onClick={handleDelete} type="button">
                Eliminar
              </DangerButton>
            )}
          </ActionBar>
        </form>
      </Modal>
    </div>
  );
}

function resourceActionConfirmation(resource, action, row) {
  const label = action.label || 'Confirmar';
  const destructive = /desactivar|eliminar|rechazar|bloquear/i.test(label);

  return {
    title: `${label} registro`,
    description: action.confirmDescription || 'Esta accion modificara el estado o la disponibilidad del registro seleccionado.',
    details: row?.name || row?.title || row?.code || resource.title,
    confirmLabel: label,
    tone: destructive ? 'danger' : 'warning',
  };
}

function ResourceInput({ disabled = false, field, form, required = false, value, setField }) {
  if (field.relation) {
    return (
      <EntitySelect
        path={field.relation.path}
        placeholder={disabled && field.disabledPlaceholder ? field.disabledPlaceholder : field.relation.placeholder}
        required={required}
        value={value}
        disabled={disabled}
        rowFilter={buildRowFilter(field, form)}
        onChange={(nextValue) => setField(field.name, nextValue)}
      />
    );
  }

  const common = {
    value: value ?? '',
    onChange: (event) => setField(field.name, readValue(field, event.target.value)),
    required,
    disabled,
  };

  if (field.type === 'textarea') {
    return <Textarea {...common} />;
  }

  if (field.type === 'select') {
    return (
      <Select {...common}>
        <option value="">Seleccionar</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <input
        checked={Boolean(value)}
        className="h-5 w-5 rounded border-line text-accent-strong dark:border-line dark:text-accent"
        disabled={disabled}
        onChange={(event) => setField(field.name, event.target.checked)}
        type="checkbox"
      />
    );
  }

  return <Input type={field.type || 'text'} {...common} />;
}

function applyFieldChange(resource, current, name, value) {
  const field = resource.fields.find((item) => item.name === name);
  const next = {
    ...current,
    [name]: value,
  };

  (field?.clearOnChange || []).forEach((fieldName) => {
    next[fieldName] = '';
  });

  if (!hasFieldValue(value)) {
    return next;
  }

  (resource.mutuallyExclusiveFields || []).forEach((group) => {
    if (!group.includes(name)) {
      return;
    }

    group
      .filter((fieldName) => fieldName !== name)
      .forEach((fieldName) => {
        next[fieldName] = '';
      });
  });

  (resource.exclusiveFieldGroups || []).forEach((group) => {
    const changedInFields = (group.fields || []).includes(name);
    const changedInExcludes = (group.excludes || []).includes(name);

    if (changedInFields) {
      (group.excludes || []).forEach((fieldName) => {
        next[fieldName] = '';
      });
    }

    if (changedInExcludes) {
      (group.fields || []).forEach((fieldName) => {
        next[fieldName] = '';
      });
    }
  });

  return next;
}

function isFieldDisabled(resource, form, field) {
  const name = field.name;
  const dependencies = Array.isArray(field.dependsOn)
    ? field.dependsOn
    : field.dependsOn
      ? [field.dependsOn]
      : [];

  if (dependencies.some((fieldName) => !hasFieldValue(form[fieldName]))) {
    return true;
  }

  if ((resource.mutuallyExclusiveFields || []).some((group) =>
    group.includes(name)
      && group
        .filter((fieldName) => fieldName !== name)
        .some((fieldName) => hasFieldValue(form[fieldName]))
  )) {
    return true;
  }

  return (resource.exclusiveFieldGroups || []).some((group) => {
    if ((group.fields || []).includes(name)) {
      return (group.excludes || []).some((fieldName) => hasFieldValue(form[fieldName]));
    }

    if ((group.excludes || []).includes(name)) {
      return (group.fields || []).some((fieldName) => hasFieldValue(form[fieldName]));
    }

    return false;
  });
}

function isFieldRequired(field, form) {
  if (typeof field.requiredWhen === 'function') {
    return field.requiredWhen(form);
  }

  return Boolean(field.required);
}

function buildRowFilter(field, form) {
  const filters = [];

  if (field.rowFilter) {
    filters.push(field.rowFilter);
  }

  const filterRules = Array.isArray(field.filterBy)
    ? field.filterBy
    : field.filterBy
      ? [field.filterBy]
      : [];

  filterRules.forEach((rule) => {
    const selectedValue = form[rule.field];

    if (!hasFieldValue(selectedValue)) {
      filters.push(() => false);
      return;
    }

    filters.push((row) => sameFieldValue(row[rule.rowKey || rule.field], selectedValue));
  });

  if (!filters.length) {
    return undefined;
  }

  return (row) => filters.every((filter) => filter(row));
}

function hasFieldValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function sameFieldValue(left, right) {
  return String(left ?? '') === String(right ?? '');
}

function readValue(field, value) {
  if (field.type === 'number') {
    return value === '' ? '' : Number(value);
  }

  return value;
}

function initialForm(fields) {
  return fields.reduce((acc, field) => {
    acc[field.name] = field.defaultValue ?? (field.type === 'checkbox' ? false : '');
    return acc;
  }, {});
}

function fromRow(fields, row) {
  return fields.reduce((acc, field) => {
    acc[field.name] = row[field.name] ?? field.defaultValue ?? '';
    return acc;
  }, {});
}

function cleanPayload(fields, form) {
  return fields.reduce((acc, field) => {
    if (field.submit === false) {
      return acc;
    }

    const value = form[field.name];

    if (value === '' && !field.keepEmpty) {
      return acc;
    }

    acc[field.name] = value;
    return acc;
  }, {});
}
