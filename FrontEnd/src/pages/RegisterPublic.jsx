/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          RegisterPublic.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Presenta el registro público de estudiantes y sus datos de acceso.
 */

import { ModuleTab, ModuleTabs } from '../components/ui/ModuleTabs';
import { InstitutionalAuthLayout } from '../components/InstitutionalAuthLayout';
import { useInstitutionalContext } from "../contexts/InstitutionalContext";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  IdCard,
  ImagePlus,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus,
} from "lucide-react";
import { apiRequest, unwrapPage } from "../api/client";
import { Alert } from "../components/ui/Alert";
import { Field, Input, PasswordInput } from "../components/ui/FormControls";
import { PrimaryButton, SecondaryButton } from "../components/ui/ActionBar";
import { useAuth } from "../auth/AuthContext";
import { setHashRoute } from "../utils/routes";

const REGISTRATION_ROLES = [
  {
    id: "ROLE_ESTUDIANTE",
    label: "Estudiante",
    title: "Crear cuenta de estudiante",
    description:
      "Registra tu acceso y vincula tu cuenta a la facultad, carrera y ciclo académico correspondiente.",
    relation: "academicCycle",
  },
];

const REGISTRATION_STEPS = ['Datos personales', 'Cuenta', 'Información académica'];

const initialForm = {
  username: "",
  password: "",
  names: "",
  lastNames: "",
  cedula: "",
  institutionalEmail: "",
  phone: "",
  address: "",
  universityId: "",
  facultyId: "",
  careerId: "",
  academicCycleId: "",
  courseId: "",
  institutionId: "",
  gradeId: "",
  gradeParallelId: "",
};

export function RegisterStudentPage() {
  const institutionDefaults = useInstitutionalContext();
  const activeRole = REGISTRATION_ROLES[0].id;
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(0);
  const [lastVisitedStep, setLastVisitedStep] = useState(0);
  const formRef = useRef(null);
  const focusFrame = useRef(null);
  const wizardId = useId();
  useEffect(() => () => cancelAnimationFrame(focusFrame.current), []);
  const [academicCycles, setAcademicCycles] = useState([]);
  const [courses, setCourses] = useState([]);
  const [educationalInstitutions, setEducationalInstitutions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [gradeParallels, setGradeParallels] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { registerStudent } = useAuth();

  const roleConfig = useMemo(
    () =>
      REGISTRATION_ROLES.find((role) => role.id === activeRole) ||
      REGISTRATION_ROLES[0],
    [activeRole],
  );

  const facultyRows = useMemo(
    () => buildFacultyRowsFromCycles(academicCycles.filter((cycle) => !form.universityId || hasMatchingId(cycle.institutionId, form.universityId))),
    [academicCycles, form.universityId],
  );

  const careerRows = useMemo(
    () => buildCareerRowsFromCycles(academicCycles, form.facultyId),
    [academicCycles, form.facultyId],
  );

  const filteredAcademicCycles = useMemo(
    () =>
      form.careerId
        ? academicCycles.filter((cycle) =>
            hasMatchingId(cycle.careerId, form.careerId),
          )
        : [],
    [academicCycles, form.careerId],
  );

  const filteredCourses = useMemo(
    () =>
      form.academicCycleId
        ? courses.filter((course) =>
            hasMatchingId(course.academicCycleId, form.academicCycleId),
          )
        : [],
    [courses, form.academicCycleId],
  );

  const filteredGrades = useMemo(
    () =>
      form.institutionId
        ? grades.filter((grade) =>
            hasMatchingId(grade.institutionId, form.institutionId),
          )
        : [],
    [grades, form.institutionId],
  );

  const filteredGradeParallels = useMemo(
    () =>
      form.gradeId
        ? gradeParallels.filter((parallel) =>
            hasMatchingId(parallel.gradeId, form.gradeId),
          )
        : [],
    [gradeParallels, form.gradeId],
  );

  useEffect(() => {
    let active = true;

    async function loadCatalogs() {
      setCatalogLoading(true);
      setCatalogError("");

      try {
        const cyclePayload = await apiRequest("/api/public/academic-cycles");
        const coursePayload = [], schoolPayload = [], collegePayload = [], gradePayload = [], gradeParallelPayload = [];
        if (active) {
          setAcademicCycles(
            Array.isArray(cyclePayload)
              ? cyclePayload
              : unwrapPage(cyclePayload),
          );
          setCourses(Array.isArray(coursePayload) ? coursePayload : unwrapPage(coursePayload));
          setEducationalInstitutions(
            dedupeById([
              ...unwrapPage(schoolPayload),
              ...unwrapPage(collegePayload),
            ]),
          );
          setGrades(Array.isArray(gradePayload) ? gradePayload : unwrapPage(gradePayload));
          setGradeParallels(
            Array.isArray(gradeParallelPayload)
              ? gradeParallelPayload
              : unwrapPage(gradeParallelPayload),
          );
        }
      } catch (requestError) {
        if (active) {
          setCatalogError(
            requestError.message ||
              "No se pudieron cargar los catálogos públicos.",
          );
        }
      } finally {
        if (active) {
          setCatalogLoading(false);
        }
      }
    }

    loadCatalogs();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setForm((current) => {
      if (current.universityId || current.facultyId || current.careerId || current.academicCycleId) return current;
      const ownCycles = academicCycles.filter((cycle) => hasMatchingId(cycle.careerId, institutionDefaults.careerId));
      if (!ownCycles.length) return current;
      return { ...current, universityId: String(institutionDefaults.universityId || ownCycles[0].institutionId || ''), facultyId: String(ownCycles[0].facultyId || ''), careerId: String(ownCycles[0].careerId || '') };
    });
  }, [institutionDefaults, academicCycles]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function showStep(nextStep, invalidControl, focusPanel = true) {
    setStep(nextStep);
    setLastVisitedStep(current => Math.max(current, nextStep));
    cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      if (invalidControl?.isConnected) invalidControl.reportValidity();
      else if (focusPanel) formRef.current?.querySelector(`[data-registration-step="${nextStep}"]`)?.focus();
    });
  }

  function validateSteps(through) {
    for (let index = 0; index <= through; index += 1) {
      const panel = formRef.current?.querySelector(`[data-registration-step="${index}"]`);
      const invalid = [...(panel?.querySelectorAll('input,select,textarea') || [])]
        .find(control => !control.disabled && !control.checkValidity());
      if (invalid) {
        showStep(index, invalid);
        return false;
      }
    }
    return true;
  }

  function selectStep(nextStep) {
    if (loading || nextStep === step) return;
    if (nextStep > step && !validateSteps(nextStep - 1)) return;
    showStep(nextStep, null, false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading || !validateSteps(step)) return;
    if (step < REGISTRATION_STEPS.length - 1) {
      showStep(step + 1);
      return;
    }
    if (catalogLoading || catalogError) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = cleanRegistrationPayload(form, activeRole);

      await registerStudent({ data, file });

      setSuccess("Cuenta registrada correctamente. Estamos preparando tu acceso.");
      setForm(initialForm);
      setFile(null);

      setHashRoute("dashboard");
    } catch (requestError) {
      const message = requestError.message || "";

      if (message.includes("Duplicate entry")) {
        setError("El correo, usuario o cédula ya se encuentra registrado.");
      } else {
        setError(message || "No se pudo registrar la cuenta.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <InstitutionalAuthLayout className="institutional-register" titleId="register-title"
      skipTarget={`${wizardId}-panel-${step}`} skipLabel="Ir al formulario de registro"
      serviceName={<>Registro de<br />estudiantes</>}
      helpTitle="Registro de cuenta"
      helpDescription="Crea tu cuenta de estudiante y selecciona tu universidad, facultad, carrera y ciclo académico. El personal institucional y los tutores reciben sus cuentas desde administración."
      supportText="Si necesitas ayuda para registrarte, contacta con la administración del sistema.">
      <section className="login-card" aria-labelledby="register-title">
        <div className="login-card-heading">
          <h1 id="register-title">{roleConfig.title}</h1>
          <p className="register-description">{roleConfig.description}</p>
        </div>
        <form ref={formRef} noValidate onSubmit={handleSubmit} aria-label="Registro de estudiante" aria-busy={loading || undefined}>
          <div className="register-progress">
            <p className="register-step-count" role="status">Paso {step + 1} de {REGISTRATION_STEPS.length}</p>
            <ModuleTabs className="register-step-tabs" aria-label="Pasos del registro">
              {REGISTRATION_STEPS.map((label, index) => <ModuleTab key={label} active={step === index}
                id={`${wizardId}-tab-${index}`} aria-controls={`${wizardId}-panel-${index}`}
                disabled={loading || index > lastVisitedStep} onClick={() => selectStep(index)}>
                <span className="register-step-number" aria-hidden="true">{index + 1}</span>{label}
              </ModuleTab>)}
            </ModuleTabs>
          </div>
          <fieldset className="register-fields" disabled={loading}>
            {catalogError && <Alert tone="error">{catalogError}</Alert>}
              <CompactSection title="Datos personales" panelIndex={0} activeStep={step} wizardId={wizardId}>
                <IconField icon={User} label="Nombres">
                  <StyledInput
                    id="register-names"
                    name="names"
                    value={form.names}
                    onChange={handleChange}
                    required
                    placeholder="Nombres"
                  />
                </IconField>

                <IconField icon={User} label="Apellidos">
                  <StyledInput
                    name="lastNames"
                    value={form.lastNames}
                    onChange={handleChange}
                    required
                    placeholder="Apellidos"
                  />
                </IconField>

                <IconField icon={IdCard} label="Cédula">
                  <StyledInput
                    name="cedula"
                    value={form.cedula}
                    onChange={handleChange}
                    required
                    placeholder="1100000001"
                  />
                </IconField>

                <IconField icon={Phone} label="Teléfono">
                  <StyledInput
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0990000001"
                  />
                </IconField>

                <div className="md:col-span-2">
                  <IconField icon={MapPin} label="Dirección">
                    <StyledInput
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Loja"
                    />
                  </IconField>
                </div>
              </CompactSection>

              <CompactSection title="Cuenta académica" panelIndex={1} activeStep={step} wizardId={wizardId}>
                <IconField icon={Mail} label="Correo institucional">
                  <StyledInput
                    name="institutionalEmail"
                    type="email"
                    value={form.institutionalEmail}
                    onChange={handleChange}
                    required
                    placeholder="usuario@unl.edu.ec"
                  />
                </IconField>

                <IconField icon={UserPlus} label="Usuario">
                  <StyledInput
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    placeholder="usuario"
                  />
                </IconField>

                <IconField icon={LockKeyhole} label="Contraseña">
                  <StyledPasswordInput
                    minLength={8}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Mínimo 8 caracteres"
                  />
                </IconField>

              </CompactSection>
              <CompactSection title="Información académica" panelIndex={2} activeStep={step} wizardId={wizardId}>
                <SlideRoleContent activeRole={activeRole}>
                  {(roleConfig.relation === "academicCycle" ||
                    roleConfig.relation === "course") && (
                    <>
                      <SearchableSelect
                        icon={Landmark}
                        label="Universidad"
                        loading={catalogLoading}
                        rows={dedupeById(academicCycles.filter((cycle) => cycle.institutionId).map((cycle) => ({ id: cycle.institutionId, name: cycle.institution })))}
                        value={form.universityId}
                        onChange={(value) => setForm((current) => ({ ...current, universityId: value, facultyId: '', careerId: '', academicCycleId: '' }))}
                        placeholder="Seleccionar universidad"
                        searchPlaceholder="Buscar universidad"
                        getOptionLabel={(row) => row.name}
                        required
                      />
                      <SearchableSelect
                        icon={GraduationCap}
                        label="Facultad"
                        disabled={!form.universityId}
                        loading={catalogLoading}
                        rows={facultyRows}
                        value={form.facultyId}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            facultyId: value,
                            careerId: "",
                            academicCycleId: "",
                            courseId: "",
                          }))
                        }
                        placeholder="Seleccionar facultad"
                        searchPlaceholder="Buscar facultad"
                        getOptionLabel={facultyLabel}
                        required
                      />

                      <SearchableSelect
                        icon={GraduationCap}
                        label="Carrera"
                        disabled={!form.facultyId}
                        loading={catalogLoading}
                        rows={careerRows}
                        value={form.careerId}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            careerId: value,
                            academicCycleId: "",
                            courseId: "",
                          }))
                        }
                        placeholder={
                          form.facultyId
                            ? "Seleccionar carrera"
                            : "Selecciona primero una facultad"
                        }
                        searchPlaceholder="Buscar carrera"
                        getOptionLabel={careerLabel}
                        required
                      />

                      <SearchableSelect
                        icon={GraduationCap}
                        label="Ciclo académico"
                        disabled={!form.careerId}
                        loading={catalogLoading}
                        rows={filteredAcademicCycles}
                        value={form.academicCycleId}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            academicCycleId: value,
                            courseId: "",
                          }))
                        }
                        placeholder={
                          form.careerId
                            ? "Seleccionar ciclo académico"
                            : "Selecciona primero una carrera"
                        }
                        searchPlaceholder="Buscar ciclo"
                        getOptionLabel={academicCycleLabel}
                        required
                      />

                      {roleConfig.relation === "course" && (
                        <SearchableSelect
                          icon={GraduationCap}
                          label="Paralelo universitario"
                          disabled={!form.academicCycleId}
                          loading={catalogLoading}
                          rows={filteredCourses}
                          value={form.courseId}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              courseId: value,
                            }))
                          }
                          placeholder={
                            form.academicCycleId
                              ? "Seleccionar paralelo"
                              : "Selecciona primero un ciclo"
                          }
                          searchPlaceholder="Buscar paralelo"
                          getOptionLabel={courseLabel}
                          required
                        />
                      )}
                    </>
                  )}

                  {roleConfig.relation === "gradeParallel" && (
                    <>
                      <SearchableSelect
                        icon={Landmark}
                        label={roleConfig.institutionLabel || "Institución"}
                        loading={catalogLoading}
                        rows={educationalInstitutions}
                        value={form.institutionId}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            institutionId: value,
                            gradeId: "",
                            gradeParallelId: "",
                          }))
                        }
                        placeholder={
                          roleConfig.institutionPlaceholder ||
                          "Seleccionar institución"
                        }
                        searchPlaceholder={
                          roleConfig.institutionSearchPlaceholder ||
                          "Buscar institución"
                        }
                        getOptionLabel={institutionLabel}
                        required
                      />

                      <SearchableSelect
                        icon={GraduationCap}
                        label="Grado"
                        disabled={!form.institutionId}
                        loading={catalogLoading}
                        rows={filteredGrades}
                        value={form.gradeId}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            gradeId: value,
                            gradeParallelId: "",
                          }))
                        }
                        placeholder={
                          form.institutionId
                            ? "Seleccionar grado"
                            : "Selecciona primero una institución"
                        }
                        searchPlaceholder="Buscar grado"
                        getOptionLabel={gradeLabel}
                        required
                      />

                      <SearchableSelect
                        icon={GraduationCap}
                        label="Paralelo institucional"
                        disabled={!form.gradeId}
                        loading={catalogLoading}
                        rows={filteredGradeParallels}
                        value={form.gradeParallelId}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            gradeParallelId: value,
                          }))
                        }
                        placeholder={
                          form.gradeId
                            ? "Seleccionar paralelo"
                            : "Selecciona primero un grado"
                        }
                        searchPlaceholder="Buscar paralelo"
                        getOptionLabel={gradeParallelLabel}
                        required
                      />
                    </>
                  )}
                </SlideRoleContent>
                <div className="md:col-span-2"><ProfileImagePicker file={file} onChange={setFile} /></div>
              </CompactSection>


            {error && <Alert tone="error">{error}</Alert>}
            {success && <p className="register-success" role="status"><CheckCircle2 aria-hidden="true" size={18} />{success}</p>}
            <div className="register-navigation">
              {step > 0 && <SecondaryButton className="register-previous" icon={ArrowLeft} onClick={() => showStep(step - 1)} type="button">Anterior</SecondaryButton>}
              <PrimaryButton className="login-submit" icon={step === 2 ? UserPlus : ArrowRight} loading={loading} type="submit"
                disabled={step === 2 && (catalogLoading || Boolean(catalogError))}
                style={{'--action-ink':'var(--login-button)','--action-color':'var(--login-button)','--action-on-solid':'#fff'}}>
                {loading ? "Registrando..." : step === 2 ? "Crear cuenta" : "Siguiente"}
              </PrimaryButton>
            </div>
          </fieldset>
        </form>
        <div className="login-registration">
          <p>¿Ya tienes una cuenta?</p>
          <button type="button" disabled={loading} onClick={() => setHashRoute("")}>Iniciar sesión</button>
        </div>
      </section>
    </InstitutionalAuthLayout>
  );
}

function ProfileImagePicker({ file, onChange }) {
  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-body dark:text-ink">
        Foto de perfil opcional
      </p>

      <label className="register-profile-picker group flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-line bg-field-hover p-3 transition focus-within:ring-2 focus-within:ring-focus-soft hover:border-accent hover:bg-accent-soft dark:border-line dark:bg-surface-soft/70 dark:hover:border-accent dark:hover:bg-accent-soft">
        <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-panel text-accent-strong shadow-sm dark:border-line dark:bg-page dark:text-accent-strong">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Vista previa de la foto de perfil"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus size={24} />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-heading dark:text-heading">
            {file ? "Foto seleccionada" : "Subir imagen de perfil"}
          </span>

          <span className="mt-1 block truncate text-xs leading-5 text-body dark:text-ink">
            {file
              ? file.name
              : "Usa una imagen JPG, PNG o WebP para identificar tu cuenta."}
          </span>
        </span>

        <input
          accept="image/jpeg,image/png,image/webp"
          type="file"
          aria-label="Foto de perfil"
          className="sr-only"
          onChange={(event) => onChange(event.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
}

function cleanRegistrationPayload(form, role) {
  const payload = {
    role,
    username: form.username,
    password: form.password,
    names: form.names,
    lastNames: form.lastNames,
    cedula: form.cedula,
    institutionalEmail: form.institutionalEmail,
    phone: form.phone,
    address: form.address,
    academicCycleId: null,
    institutionId: null,
    courseId: null,
    gradeParallelId: null,
  };

  if (role === "ROLE_ESTUDIANTE") {
    payload.academicCycleId = form.academicCycleId
      ? Number(form.academicCycleId)
      : null;
  }

  if (role === "ROLE_TUTOR_PRACTICAS") {
    payload.courseId = form.courseId ? Number(form.courseId) : null;
  }

  if (role === "ROLE_TUTOR_INSTITUCIONAL") {
    payload.institutionId = form.institutionId
      ? Number(form.institutionId)
      : null;
    payload.gradeParallelId = form.gradeParallelId
      ? Number(form.gradeParallelId)
      : null;
  }

  return payload;
}

function academicCycleLabel(row) {
  return (
    [row.name, row.career, row.faculty].filter(Boolean).join(" - ") ||
    "Ciclo académico"
  );
}

function courseLabel(row) {
  return [row.name, row.code].filter(Boolean).join(" - ") || "Paralelo";
}

function facultyLabel(row) {
  return row.name || "Facultad";
}

function careerLabel(row) {
  return [row.name, row.faculty].filter(Boolean).join(" - ") || "Carrera";
}

function institutionLabel(row) {
  return [row.name, row.code].filter(Boolean).join(" - ") || "Institución";
}

function gradeLabel(row) {
  return [row.name, row.code].filter(Boolean).join(" - ") || "Grado";
}

function gradeParallelLabel(row) {
  return [row.name, row.letter].filter(Boolean).join(" - ") || "Paralelo";
}

function buildFacultyRowsFromCycles(cycles) {
  return dedupeById(
    cycles
      .filter((cycle) => cycle.facultyId)
      .map((cycle) => ({
        id: cycle.facultyId,
        name: cycle.faculty,
      })),
  );
}

function buildCareerRowsFromCycles(cycles, facultyId) {
  if (!facultyId) {
    return [];
  }

  return dedupeById(
    cycles
      .filter((cycle) => hasMatchingId(cycle.facultyId, facultyId))
      .filter((cycle) => cycle.careerId)
      .map((cycle) => ({
        id: cycle.careerId,
        name: cycle.career,
        faculty: cycle.faculty,
      })),
  );
}

function hasMatchingId(left, right) {
  return Boolean(right) && String(left ?? "") === String(right ?? "");
}

function dedupeById(rows) {
  return [...new Map(rows.map((row) => [row.id, row])).values()];
}

function SlideRoleContent({ activeRole, children }) {
  return (
    <div className="min-w-0 md:col-span-2">
      <div key={activeRole} className="grid gap-4 md:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function CompactSection({ title, children, panelIndex, activeStep, wizardId }) {
  return (
    <section className="register-section" role="tabpanel" tabIndex={-1} hidden={activeStep !== panelIndex}
      id={`${wizardId}-panel-${panelIndex}`} aria-labelledby={`${wizardId}-tab-${panelIndex}`} data-registration-step={panelIndex}>
      <h2 className="register-section-title">
        {title}
      </h2>

      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function IconField({ label, children }) {
  return <Field label={label}>{children}</Field>;
}

function SearchableSelect({
  label,
  loading,
  rows,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  getOptionLabel,
  required = false,
  disabled = false,
}) {
  const [query, setQuery] = useState("");
  const selectId = useId();

  const options = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return rows;
    }

    return rows.filter((row) =>
      getOptionLabel(row).toLowerCase().includes(normalizedQuery),
    );
  }, [getOptionLabel, query, rows]);

  return (
    <div>
      <label htmlFor={selectId} className="mb-2 block text-xs font-medium text-body dark:text-ink">{label}</label>

      <div className="space-y-2">
        {(rows.length > 6 || query) && <div className="relative">
          <StyledInput
            aria-label={`Buscar ${label.toLowerCase()}`}
            disabled={loading || disabled}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={loading ? "Cargando registros..." : searchPlaceholder}
            type="search"
            value={query}
          />
        </div>}

        <div className="relative">
          <select
            id={selectId}
            className={[
              "h-11 w-full rounded-xl border border-line bg-panel py-2.5 px-3 text-sm",
              "text-heading shadow-sm outline-none transition",
              "focus:border-focus focus:bg-panel focus:ring-2 focus:ring-focus-soft",
              "dark:border-line dark:bg-page dark:text-heading dark:focus:border-accent dark:focus:bg-page dark:focus:ring-focus-soft",
            ].join(" ")}
            disabled={loading || disabled}
            onChange={(event) => onChange(event.target.value)}
            required={required}
            value={value ?? ""}
          >
            <option value="">{placeholder}</option>

            {options.map((row) => (
              <option key={row.id} value={row.id}>
                {getOptionLabel(row)}
              </option>
            ))}
          </select>
        </div>

        {!loading && rows.length === 0 && (
          <p className="text-xs font-semibold text-body dark:text-ink">
            No hay registros disponibles.
          </p>
        )}

        {query && options.length === 0 && rows.length > 0 && (
          <p className="text-xs font-semibold text-body dark:text-ink">
            No hay coincidencias.
          </p>
        )}
      </div>
    </div>
  );
}

function StyledInput(props) {
  return <Input {...props} />;
}

function StyledPasswordInput(props) {
  return <PasswordInput {...props} />;
}

StyledInput.fieldControl = true;
StyledPasswordInput.fieldControl = true;
