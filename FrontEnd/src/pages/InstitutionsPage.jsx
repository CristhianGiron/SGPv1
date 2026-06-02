import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, CheckCircle2, Pencil, Plus, RefreshCw, Save } from "lucide-react";
import { apiRequest, toQuery, unwrapPage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  EDUCATION_MODALITIES,
  ENTITY_RELATIONS,
  INSTITUTION_SUPPORTS,
  INSTITUTION_TYPES,
  SCHOOL_REGIMES,
} from "../config/resources";
import { Alert } from "../components/ui/Alert";
import {
  ActionBar,
  PrimaryButton,
  SecondaryButton,
} from "../components/ui/ActionBar";
import { ActionMenu } from "../components/ui/ActionMenu";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { DataTable } from "../components/ui/DataTable";
import { EntitySelect } from "../components/ui/EntitySelect";
import { FilterPanel } from "../components/ui/FilterPanel";
import { Field, Input, Select, Textarea } from "../components/ui/FormControls";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { SectionCard } from "../components/ui/SectionCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { booleanSelectValue, buildSelectOptions, matchesOpenSearch } from "../utils/filtering";
import { filterInactiveForNonAdmin } from "../utils/visibility";

const BASE_INITIAL_FORM = {
  code: "",
  name: "",
  type: "",
  support: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  agreementActive: true,
  acceptsInterns: true,
  provinceId: "",
  cantonId: "",
  parishId: "",
  regime: "",
  modality: "",
  teacherCount: "",
  studentCount: "",
  mission: "",
  vision: "",
  institutionalValues: "",
  educationLevels: "",
};

const INITIAL_FILTERS = {
  query: "",
  type: "",
  support: "",
  active: "",
  agreementActive: "",
  acceptsInterns: "",
  province: "",
  canton: "",
  parish: "",
  regime: "",
  modality: "",
};

const PRACTICE_INSTITUTION_TYPES = INSTITUTION_TYPES.filter((type) => type !== "UNIVERSIDAD");
const UNIVERSITY_INSTITUTION_TYPES = ["UNIVERSIDAD"];

function buildInitialForm(type = "ESCUELA") {
  return {
    ...BASE_INITIAL_FORM,
    type,
  };
}

export function InstitutionsPage({ scope = "practice", embedded = false } = {}) {
  const { token, roles } = useAuth();
  const confirm = useConfirm();
  const isAdmin = roles.includes("ROLE_ADMIN");
  const isUniversityScope = scope === "universities";
  const allowedTypes = useMemo(
    () => (isUniversityScope ? UNIVERSITY_INSTITUTION_TYPES : PRACTICE_INSTITUTION_TYPES),
    [isUniversityScope]
  );
  const defaultType = allowedTypes[0] || "ESCUELA";
  const pageCopy = isUniversityScope
      ? {
        eyebrow: "Universidades",
        title: "Universidades",
        description: "Administra las universidades vinculadas al proceso de practicas.",
        listLabel: "Universidades",
        formNoun: "universidad",
      }
    : {
        eyebrow: "Instituciones",
        title: "Instituciones de practica",
        description: "Administra los centros donde los estudiantes realizaran sus practicas.",
        listLabel: "Instituciones de practica",
        formNoun: "institucion",
      };
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(() => buildInitialForm(defaultType));
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [editingId, setEditingId] = useState("");
  const [activeView, setActiveView] = useState("list");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await apiRequest(
        `/api/institutions/search${toQuery({ active: !isAdmin ? true : undefined, page: 0, size: 200 })}`,
        { token },
      );
      setRows(
        filterInactiveForNonAdmin(unwrapPage(payload), roles).filter((row) =>
          allowedTypes.includes(row.type)
        )
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token, roles, isAdmin, allowedTypes]);

  useEffect(() => {
    setRows([]);
    setForm(buildInitialForm(defaultType));
    setFilters(INITIAL_FILTERS);
    setEditingId("");
    setActiveView("list");
  }, [defaultType]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function edit(row) {
    setEditingId(row.id);
    setActiveView("form");
    setForm({
      ...buildInitialForm(defaultType),
      ...row,
      provinceId: "",
      cantonId: "",
      parishId: "",
      educationLevels: (row.educationLevels || []).join(","),
    });
  }

  function reset() {
    setEditingId("");
    setForm(buildInitialForm(defaultType));
    setActiveView("form");
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(
        editingId ? `/api/institutions/${editingId}` : "/api/institutions",
        {
          method: editingId ? "PATCH" : "POST",
          token,
          body: cleanInstitutionPayload(form, Boolean(editingId)),
        },
      );
      reset();
      await loadRows();
      setActiveView("list");
      setMessage(editingId ? "Institucion actualizada" : "Institucion creada");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function action(path, method = "PATCH", confirmation) {
    const accepted = await confirm(confirmation || {
      title: "Confirmar accion",
      description: "Esta accion modificara el estado de la institucion seleccionada.",
      confirmLabel: "Confirmar",
      tone: "warning",
    });

    if (!accepted) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await apiRequest(path, { method, token });
      await loadRows();
      setMessage("Accion ejecutada");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: "id", header: "ID" },
    { key: "code", header: "Codigo" },
    { key: "name", header: "Nombre" },
    { key: "type", header: "Tipo" },
    ...(isUniversityScope
      ? []
      : [
          {
            key: "schoolProfile",
            header: "Comunidad",
            render: (row) =>
              isSchoolOrCollege(row.type)
                ? `${row.teacherCount ?? 0} docentes / ${row.studentCount ?? 0} estudiantes`
                : "-",
          },
        ]),
    {
      key: "active",
      header: "Estado",
      render: (row) => <StatusBadge status={row.active} />,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (row) => (
        <ActionMenu
          actions={[
            {
              key: "edit",
              label: "Editar",
              icon: Pencil,
              onClick: () => edit(row),
            },
            {
              key: row.active ? "disable" : "enable",
              label: row.active ? "Desactivar" : "Activar",
              icon: row.active ? Ban : CheckCircle2,
              onClick: () =>
                action(`/api/institutions/${row.id}/${row.active ? "disable" : "enable"}`, "PATCH", {
                  title: row.active ? "Desactivar institucion" : "Activar institucion",
                  description: row.active
                    ? "La institucion dejara de estar disponible para nuevos procesos."
                    : "La institucion volvera a estar disponible.",
                  details: row.name,
                  confirmLabel: row.active ? "Desactivar" : "Activar",
                  tone: row.active ? "danger" : "warning",
                }),
            },
          ]}
        />
      ),
    },
  ];
  const showSchoolProfileFields = isSchoolOrCollege(form.type);
  const filterOptions = useMemo(
    () => ({
      provinces: buildSelectOptions(rows, (row) => row.province),
      cantons: buildSelectOptions(rows, (row) => row.canton),
      parishes: buildSelectOptions(rows, (row) => row.parish),
      regimes: buildSelectOptions(rows, (row) => row.regime),
      modalities: buildSelectOptions(rows, (row) => row.modality),
    }),
    [rows]
  );
  const filteredRows = useMemo(
    () => rows.filter((row) => filterInstitutionRow(row, filters)),
    [filters, rows]
  );
  const listLabelLower = pageCopy.listLabel.toLowerCase();

  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow={pageCopy.eyebrow}
          title={pageCopy.title}
          description={pageCopy.description}
          action={
            <SecondaryButton
              icon={RefreshCw}
              loading={loading}
              onClick={loadRows}
              type="button"
            >
              Actualizar
            </SecondaryButton>
          }
        />
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <>
          <FilterPanel
            activeCount={countActiveFilters(filters, ["query"])}
            hasActiveFilters={countActiveFilters(filters) > 0}
            onClear={() => setFilters(INITIAL_FILTERS)}
            search={(
              <Field label="Buscar">
                <Input
                  placeholder="Nombre, codigo, correo o ubicacion"
                  type="search"
                  value={filters.query}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      query: event.target.value,
                    }))
                  }
                />
              </Field>
            )}
            summary={`${filteredRows.length} de ${rows.length} ${listLabelLower}`}
            title={`Filtrar ${listLabelLower}`}
          >
              {allowedTypes.length > 1 && (
                <Field label="Tipo">
                  <Select
                    value={filters.type}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                  >
                    <option value="">Todos</option>
                    {allowedTypes.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label="Sostenimiento">
                <Select
                  value={filters.support}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      support: event.target.value,
                    }))
                  }
                >
                  <option value="">Todos</option>
                  {INSTITUTION_SUPPORTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Estado">
                <Select
                  disabled={!isAdmin}
                  value={!isAdmin ? "true" : filters.active}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      active: event.target.value,
                    }))
                  }
                >
                  {isAdmin && <option value="">Todos</option>}
                  <option value="true">Activas</option>
                  {isAdmin && <option value="false">Inactivas</option>}
                </Select>
              </Field>
              <Field label="Convenio">
                <Select
                  value={filters.agreementActive}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      agreementActive: event.target.value,
                    }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </Select>
              </Field>
              <Field label="Practicantes">
                <Select
                  value={filters.acceptsInterns}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      acceptsInterns: event.target.value,
                    }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="true">Acepta</option>
                  <option value="false">No acepta</option>
                </Select>
              </Field>
              <Field label="Provincia">
                <Select
                  value={filters.province}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      province: event.target.value,
                    }))
                  }
                >
                  <option value="">Todas</option>
                  {filterOptions.provinces.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Canton">
                <Select
                  value={filters.canton}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      canton: event.target.value,
                    }))
                  }
                >
                  <option value="">Todos</option>
                  {filterOptions.cantons.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {!isUniversityScope && (
                <Field label="Regimen">
                  <Select
                    value={filters.regime}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        regime: event.target.value,
                      }))
                    }
                  >
                    <option value="">Todos</option>
                    {filterOptions.regimes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {!isUniversityScope && (
                <Field label="Modalidad">
                  <Select
                    value={filters.modality}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        modality: event.target.value,
                      }))
                    }
                  >
                    <option value="">Todas</option>
                    {filterOptions.modalities.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
          </FilterPanel>

          <SectionCard
            title={pageCopy.listLabel}
            action={
              <PrimaryButton
                icon={Plus}
                onClick={() => {
                  setEditingId("");
                  setForm(buildInitialForm(defaultType));
                  setActiveView("form");
                }}
                type="button"
              >
                Crear
              </PrimaryButton>
            }
          >
            <DataTable columns={columns} loading={loading} rows={filteredRows} />
          </SectionCard>
        </>

      <Modal
        description="Edita la informacion en una ventana enfocada y regresa al listado al guardar."
        maxWidth="max-w-5xl"
        onClose={() => setActiveView("list")}
        open={activeView === "form"}
        title={editingId ? `Editar ${pageCopy.formNoun}` : `Crear ${pageCopy.formNoun}`}
      >
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid lg:grid-cols-2 gap-4">
              {[
                ["code", "Codigo"],
                ["name", "Nombre"],
                ["address", "Direccion"],
                ["phone", "Telefono"],
                ["email", "Correo"],
                ["website", "Sitio web"],
                ["educationLevels", "Niveles, separados por coma"],
              ]
                .filter(([name]) => !isUniversityScope || name !== "educationLevels")
                .map(([name, label]) => (
                <Field className="" key={name} label={label}>
                  <Input
                    value={form[name] || ""}
                    onChange={(event) => setField(name, event.target.value)}
                  />
                </Field>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <Field label="Tipo">
                <Select
                  disabled={allowedTypes.length === 1}
                  value={form.type || ""}
                  onChange={(event) => setField("type", event.target.value)}
                >
                  {allowedTypes.length > 1 && <option value="">Seleccionar</option>}
                  {allowedTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sostenimiento">
                <Select
                  value={form.support || ""}
                  onChange={(event) => setField("support", event.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {INSTITUTION_SUPPORTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <Field label="Provincia">
                <EntitySelect
                  path={ENTITY_RELATIONS.provinceId.path}
                  placeholder={ENTITY_RELATIONS.provinceId.placeholder}
                  value={form.provinceId}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      provinceId: value,
                      cantonId: "",
                      parishId: "",
                    }))
                  }
                />
              </Field>
              <Field label="Canton">
                <EntitySelect
                  disabled={!form.provinceId}
                  path={
                    form.provinceId
                      ? `/api/locations/provinces/${form.provinceId}/cantons`
                      : ""
                  }
                  placeholder={
                    form.provinceId
                      ? "Seleccionar canton"
                      : "Selecciona primero una provincia"
                  }
                  value={form.cantonId}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      cantonId: value,
                      parishId: "",
                    }))
                  }
                />
              </Field>
              <Field label="Parroquia">
                <EntitySelect
                  disabled={!form.cantonId}
                  path={
                    form.cantonId
                      ? `/api/locations/cantons/${form.cantonId}/parishes`
                      : ""
                  }
                  placeholder={
                    form.cantonId
                      ? "Seleccionar parroquia"
                      : "Selecciona primero un canton"
                  }
                  value={form.parishId}
                  onChange={(value) => setField("parishId", value)}
                />
              </Field>
            </div>
            {!isUniversityScope && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Regimen">
                  <Select
                    value={form.regime || ""}
                    onChange={(event) => setField("regime", event.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {SCHOOL_REGIMES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Modalidad">
                  <Select
                    value={form.modality || ""}
                    onChange={(event) => setField("modality", event.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {EDUCATION_MODALITIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}

            {showSchoolProfileFields && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Docentes">
                  <Input
                    min="0"
                    type="number"
                    value={form.teacherCount ?? ""}
                    onChange={(event) =>
                      setField("teacherCount", event.target.value)
                    }
                  />
                </Field>
                <Field label="Estudiantes">
                  <Input
                    min="0"
                    type="number"
                    value={form.studentCount ?? ""}
                    onChange={(event) =>
                      setField("studentCount", event.target.value)
                    }
                  />
                </Field>
                <Field className="md:col-span-2" label="Mision">
                  <Textarea
                    value={form.mission || ""}
                    onChange={(event) =>
                      setField("mission", event.target.value)
                    }
                  />
                </Field>
                <Field className="md:col-span-2" label="Vision">
                  <Textarea
                    value={form.vision || ""}
                    onChange={(event) => setField("vision", event.target.value)}
                  />
                </Field>
                <Field
                  className="md:col-span-2"
                  label="Valores institucionales"
                >
                  <Textarea
                    value={form.institutionalValues || ""}
                    onChange={(event) =>
                      setField("institutionalValues", event.target.value)
                    }
                  />
                </Field>
              </div>
            )}
            <ActionBar>
              <PrimaryButton icon={editingId ? Save : Plus} loading={loading} type="submit">
                {editingId ? "Guardar" : "Crear"}
              </PrimaryButton>
              {editingId && (
                <SecondaryButton icon={Plus} onClick={reset} type="button">
                  Nuevo
                </SecondaryButton>
              )}
            </ActionBar>
          </form>
      </Modal>
    </>
  );
}

function cleanInstitutionPayload(form, editing) {
  const payload = {};
  const schoolProfileFields = [
    "teacherCount",
    "studentCount",
    "mission",
    "vision",
    "institutionalValues",
  ];

  Object.entries(form).forEach(([key, value]) => {
    if (!isSchoolOrCollege(form.type) && schoolProfileFields.includes(key)) {
      return;
    }

    if (key === "educationLevels") {
      const levels = value
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
      if (levels.length) {
        payload.educationLevels = levels;
      }
      return;
    }

    if (value === "" || value === null || value === undefined) {
      return;
    }

    if (key.endsWith("Id")) {
      payload[key] = Number(value);
      return;
    }

    if (key === "teacherCount" || key === "studentCount") {
      payload[key] = Number(value);
      return;
    }

    payload[key] = value;
  });

  if (editing) {
    delete payload.code;
  }

  return payload;
}

function isSchoolOrCollege(type) {
  return type === "ESCUELA" || type === "COLEGIO";
}

function filterInstitutionRow(row, filters) {
  if (!matchesOpenSearch([
    row.code,
    row.name,
    row.type,
    row.support,
    row.address,
    row.phone,
    row.email,
    row.website,
    row.province,
    row.canton,
    row.parish,
    row.regime,
    row.modality,
    row.mission,
    row.vision,
    row.institutionalValues,
  ], filters.query)) {
    return false;
  }

  if (filters.type && row.type !== filters.type) {
    return false;
  }

  if (filters.support && row.support !== filters.support) {
    return false;
  }

  if (filters.active && booleanSelectValue(row.active) !== filters.active) {
    return false;
  }

  if (filters.agreementActive && booleanSelectValue(row.agreementActive) !== filters.agreementActive) {
    return false;
  }

  if (filters.acceptsInterns && booleanSelectValue(row.acceptsInterns) !== filters.acceptsInterns) {
    return false;
  }

  if (filters.province && row.province !== filters.province) {
    return false;
  }

  if (filters.canton && row.canton !== filters.canton) {
    return false;
  }

  if (filters.parish && row.parish !== filters.parish) {
    return false;
  }

  if (filters.regime && row.regime !== filters.regime) {
    return false;
  }

  if (filters.modality && row.modality !== filters.modality) {
    return false;
  }

  return true;
}

function countActiveFilters(filters, excludeKeys = []) {
  return Object.entries(filters || {})
    .filter(([key]) => !excludeKeys.includes(key))
    .filter(([, value]) => String(value || "").trim())
    .length;
}
