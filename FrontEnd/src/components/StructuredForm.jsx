import { Plus, Trash2 } from 'lucide-react';
import { ENTITY_RELATIONS } from '../config/resources';
import { formatValue, labelFromKey } from '../utils/format';
import { DangerButton, SecondaryButton } from './ui/ActionBar';
import { useConfirm } from './ui/ConfirmDialog';
import { EntitySelect } from './ui/EntitySelect';
import { Field, Input, Select, Textarea } from './ui/FormControls';

const ENUM_OPTIONS = {
  practiceType: ['OBSERVACION', 'ELABORACION', 'DOCENTE'],
  developmentMode: ['ONLINE', 'PRESENCIAL'],
  aspectType: ['GENERAL', 'ESPECIFICO'],
  level: ['BAJO', 'MEDIO', 'ALTO'],
  dayOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
  status: ['PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED'],
};

const LONG_TEXT_KEYS =
  /description|presentation|objective|activities|resources|feedback|approval|antecedents|conclusion|recommendation|methodology|observations|notes|mission|vision|values|suggestions|supervised/i;

const NUMBER_KEYS =
  /(^id$|Id$|Count$|Minutes$|Score$|Percentage$|capacity|hours|credits|level|weekNumber|studentCount|teacherCount)/i;

function cloneValue(value) {
  if (value === undefined) {
    return {};
  }

  return JSON.parse(JSON.stringify(value));
}

function isObject(value) {
  return value !== null && !Array.isArray(value) && typeof value === 'object';
}

function emptyLike(value) {
  if (Array.isArray(value)) {
    return [];
  }

  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, emptyLike(item)]));
  }

  if (typeof value === 'boolean') {
    return false;
  }

  return '';
}

function setAtPath(source, path, nextValue) {
  if (path.length === 0) {
    return nextValue;
  }

  const [head, ...rest] = path;
  const target = Array.isArray(source) ? [...source] : { ...(source || {}) };
  target[head] = setAtPath(target[head], rest, nextValue);

  return target;
}

function removeAtPath(source, path) {
  const arrayPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const currentArray = arrayPath.reduce((accumulator, key) => accumulator?.[key], source) || [];
  const nextArray = currentArray.filter((_, itemIndex) => itemIndex !== index);

  return setAtPath(source, arrayPath, nextArray);
}

function addAtPath(source, path, template) {
  const currentArray = path.reduce((accumulator, key) => accumulator?.[key], source) || [];
  return setAtPath(source, path, [...currentArray, emptyLike(template)]);
}

function fieldType(key, value) {
  if (/Date$|fecha/i.test(key)) {
    return 'date';
  }

  if (/Time$|hora/i.test(key)) {
    return 'time';
  }

  if (typeof value === 'number' || NUMBER_KEYS.test(key)) {
    return 'number';
  }

  if (/email/i.test(key)) {
    return 'email';
  }

  if (/phone|telefono/i.test(key)) {
    return 'tel';
  }

  if (/link|url/i.test(key)) {
    return 'url';
  }

  return 'text';
}

function enumOptionsFor(key) {
  return ENUM_OPTIONS[key] || null;
}

function formatOptionLabel(value) {
  const labels = {
    MONDAY: 'Lunes',
    TUESDAY: 'Martes',
    WEDNESDAY: 'Miercoles',
    THURSDAY: 'Jueves',
    FRIDAY: 'Viernes',
    SATURDAY: 'Sabado',
    SUNDAY: 'Domingo',
    PRESENT: 'Presente',
    ABSENT: 'Ausente',
    LATE: 'Atraso',
    JUSTIFIED: 'Justificado',
    ONLINE: 'En linea',
    PRESENCIAL: 'Presencial',
    OBSERVACION: 'Observacion',
    ELABORACION: 'Elaboracion',
    DOCENTE: 'Docente',
    GENERAL: 'General',
    ESPECIFICO: 'Especifico',
    BAJO: 'Bajo',
    MEDIO: 'Medio',
    ALTO: 'Alto',
  };

  return labels[value] || labelFromKey(value);
}

function normalizePrimitiveValue(key, value) {
  const type = fieldType(key, value);

  if (value === null || value === undefined) {
    return '';
  }

  if (type === 'date') {
    return String(value).slice(0, 10);
  }

  if (type === 'time') {
    return String(value).slice(0, 5);
  }

  return value;
}

function parseFieldValue(key, value) {
  if (value === '') {
    return '';
  }

  if (fieldType(key, value) === 'number') {
    return Number(value);
  }

  return value;
}

function cleanValue(value) {
  if (value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map(cleanValue)
      .filter((item) => item !== undefined && !(isObject(item) && Object.keys(item).length === 0));
  }

  if (isObject(value)) {
    return Object.entries(value).reduce((accumulator, [key, item]) => {
      const cleaned = cleanValue(item);

      if (cleaned !== undefined) {
        accumulator[key] = cleaned;
      }

      return accumulator;
    }, {});
  }

  return value;
}

export function cleanStructuredPayload(value) {
  return cleanValue(value) || {};
}

export function cloneStructuredValue(value) {
  return cloneValue(value);
}

export function StructuredForm({
  value,
  onChange,
  relations = {},
  readOnlyFields = [],
  hiddenFields = [],
  customFields = {},
}) {
  const readOnlySet = new Set(readOnlyFields);
  const hiddenSet = new Set(hiddenFields);

  return (
    <div className="space-y-4">
      <FormNode
        hiddenFields={hiddenSet}
        name="form"
        path={[]}
        customFields={customFields}
        readOnlyFields={readOnlySet}
        relations={relations}
        value={value || {}}
        onChange={onChange}
        root={value || {}}
      />
    </div>
  );
}

function FormNode({ name, path, customFields, readOnlyFields, hiddenFields, relations, value, onChange, root }) {
  if (Array.isArray(value)) {
    return (
      <ArrayEditor
        customFields={customFields}
        hiddenFields={hiddenFields}
        name={name}
        path={path}
        readOnlyFields={readOnlyFields}
        relations={relations}
        root={root}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (isObject(value)) {
    return (
      <ObjectEditor
        customFields={customFields}
        hiddenFields={hiddenFields}
        path={path}
        readOnlyFields={readOnlyFields}
        relations={relations}
        root={root}
        value={value}
        onChange={onChange}
      />
    );
  }

  return (
    <PrimitiveField
      name={name}
      customFields={customFields}
      readOnly={readOnlyFields.has(name)}
      relations={relations}
      value={value}
      onChange={(nextValue) => onChange(setAtPath(root, path, nextValue))}
    />
  );
}

function ObjectEditor({ path, customFields, readOnlyFields, hiddenFields, relations, value, onChange, root }) {
  const entries = Object.entries(value);

  if (entries.length === 0) {
    return <p className="text-sm text-muted">No hay campos configurados para esta seccion.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {entries.map(([key, item]) => {
        if (hiddenFields.has(key)) {
          return null;
        }

        const isComplex = Array.isArray(item) || isObject(item);

        return (
          <div className={isComplex ? 'md:col-span-2' : ''} key={key}>
            {isComplex ? (
              <FormGroup title={labelFromKey(key)}>
                <FormNode
                  name={key}
                  customFields={customFields}
                  hiddenFields={hiddenFields}
                  path={[...path, key]}
                  readOnlyFields={readOnlyFields}
                  relations={relations}
                  root={root}
                  value={item}
                  onChange={onChange}
                />
              </FormGroup>
            ) : (
              <PrimitiveField
                name={key}
                customFields={customFields}
                readOnly={readOnlyFields.has(key)}
                relations={relations}
                value={item}
                onChange={(nextValue) => onChange(setAtPath(root, [...path, key], nextValue))}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ArrayEditor({ name, path, customFields, readOnlyFields, hiddenFields, relations, value, onChange, root }) {
  const confirm = useConfirm();
  const template = value[0] || {};

  async function removeItem(index) {
    const accepted = await confirm({
      title: `Quitar ${labelFromKey(name).toLowerCase()}`,
      description: 'Este elemento se quitara del formulario en edicion.',
      details: `${labelFromKey(name)} ${index + 1}`,
      confirmLabel: 'Quitar',
      tone: 'danger',
    });

    if (accepted) {
      onChange(removeAtPath(root, [...path, index]));
    }
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted">Todavia no hay registros agregados.</p>
      )}

      {value.map((item, index) => (
        <div className="rounded-lg border border-[#c8d2cd] bg-[#eef3f2] p-3 dark:border-slate-700 dark:bg-surface-soft" key={`${name}-${index}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-extrabold text-[#20282d] dark:text-slate-50">
              {labelFromKey(name)} {index + 1}
            </h4>
            <DangerButton
              className="inline-flex items-center gap-2 px-3 py-2"
              onClick={() => removeItem(index)}
              type="button"
            >
              <Trash2 size={16} />
              Quitar
            </DangerButton>
          </div>
          <FormNode
            name={`${name}-${index}`}
            customFields={customFields}
            hiddenFields={hiddenFields}
            path={[...path, index]}
            readOnlyFields={readOnlyFields}
            relations={relations}
            root={root}
            value={item}
            onChange={onChange}
          />
        </div>
      ))}

      <SecondaryButton
        className="inline-flex items-center gap-2"
        onClick={() => onChange(addAtPath(root, path, template))}
        type="button"
      >
        <Plus size={16} />
        Agregar {labelFromKey(name).toLowerCase()}
      </SecondaryButton>
    </div>
  );
}

function PrimitiveField({ name, customFields = {}, readOnly = false, relations, value, onChange }) {
  const relation = relations[name] || ENTITY_RELATIONS[name];
  const customField = customFields[name];

  if (customField) {
    return customField({
      label: relation?.label || labelFromKey(name),
      name,
      onChange,
      readOnly,
      value,
    });
  }

  if (readOnly) {
    return (
      <Field label={relation?.label || labelFromKey(name)}>
        <ReadOnlyValue name={name} value={value} />
      </Field>
    );
  }

  if (relation) {
    return (
      <Field label={relation.label}>
        <EntitySelect
          disabled={relation.disabled}
          getOptionLabel={relation.getOptionLabel}
          path={relation.path}
          placeholder={relation.placeholder}
          rows={relation.rows}
          value={value}
          onChange={onChange}
        />
      </Field>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <label className="flex min-h-[44px] items-center gap-3 rounded-lg border border-[#c8d2cd] bg-white px-3 py-2 dark:border-slate-700 dark:bg-surface">
        <input
          checked={value}
          className="h-4 w-4 accent-[#529914]"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="text-sm font-bold text-[#34443b] dark:text-slate-200">{labelFromKey(name)}</span>
      </label>
    );
  }

  const options = enumOptionsFor(name);

  if (options) {
    return (
      <Field label={labelFromKey(name)}>
        <Select
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Selecciona una opcion</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {formatOptionLabel(option)}
            </option>
          ))}
        </Select>
      </Field>
    );
  }

  if (LONG_TEXT_KEYS.test(name)) {
    return (
      <Field label={labelFromKey(name)}>
        <Textarea
          value={normalizePrimitiveValue(name, value)}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
    );
  }

  return (
    <Field label={labelFromKey(name)}>
      <Input
        type={fieldType(name, value)}
        value={normalizePrimitiveValue(name, value)}
        onChange={(event) => onChange(parseFieldValue(name, event.target.value))}
      />
    </Field>
  );
}

function ReadOnlyValue({ name, value }) {
  return (
    <div className="min-h-[44px] rounded-lg border border-[#c8d2cd] bg-[#eef3f2] px-3 py-2 text-sm font-semibold text-[#20282d] dark:border-slate-700 dark:bg-surface-soft dark:text-slate-100">
      {formatValue(value, name)}
    </div>
  );
}

function FormGroup({ title, children }) {
  return (
    <div className="rounded-lg border border-[#c8d2cd] bg-white p-3 dark:border-slate-700 dark:bg-surface">
      <h3 className="mb-3 text-sm font-extrabold text-[#20282d] dark:text-slate-50">{title}</h3>
      {children}
    </div>
  );
}
