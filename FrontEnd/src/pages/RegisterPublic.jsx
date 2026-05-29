import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  GraduationCap,
  IdCard,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Search,
  Upload,
  User,
  UserPlus,
} from "lucide-react";
import { apiRequest, unwrapPage } from "../api/client";
import { Alert } from "../components/ui/Alert";
import { Input } from "../components/ui/FormControls";
import { PrimaryButton } from "../components/ui/ActionBar";
import { useAuth } from "../auth/AuthContext";

const REGISTRATION_ROLES = [
  {
    id: "ROLE_ESTUDIANTE",
    label: "Estudiante",
    title: "Crear cuenta de estudiante",
    description:
      "Registra tu acceso y vincula tu cuenta al ciclo académico correspondiente.",
    relation: "academicCycle",
  },
  {
    id: "ROLE_TUTOR_INSTITUCIONAL",
    label: "Tutor institucional",
    title: "Crear cuenta de tutor institucional",
    description:
      "Registra tu acceso como tutor institucional vinculado a una escuela o colegio.",
    relation: "institution",
    institutionKind: "educational",
    institutionLabel: "Institución educativa",
    institutionPlaceholder: "Seleccionar escuela o colegio",
    institutionSearchPlaceholder: "Buscar escuela o colegio",
  },
  {
    id: "ROLE_TUTOR_PRACTICAS",
    label: "Tutor de prácticas",
    title: "Crear cuenta de tutor de prácticas",
    description: "Registra tu acceso como tutor vinculado a una universidad.",
    relation: "institution",
    institutionKind: "university",
    institutionLabel: "Universidad",
    institutionPlaceholder: "Seleccionar universidad",
    institutionSearchPlaceholder: "Buscar universidad",
  },
];

const initialForm = {
  username: "",
  password: "",
  names: "",
  lastNames: "",
  cedula: "",
  institutionalEmail: "",
  phone: "",
  address: "",
  facultyId: "",
  careerId: "",
  academicCycleId: "",
  institutionId: "",
};

function StorySlide({ number, title, text }) {
  return (
    <article className="relative flex min-h-[108px] gap-3 rounded-3xl border border-[#529914] bg-[#074462] p-4 shadow-xl shadow-black/10 before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-full before:bg-[#529914]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#04344c] text-[11px] font-black text-white">
        {number}
      </span>

      <div>
        <h3 className="text-sm font-black text-white">{title}</h3>

        <p className="mt-1.5 text-xs leading-5 text-slate-300/75">{text}</p>
      </div>
    </article>
  );
}

export function RegisterStudentPage() {
  const [activeRole, setActiveRole] = useState(REGISTRATION_ROLES[0].id);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [academicCycles, setAcademicCycles] = useState([]);
  const [universityInstitutions, setUniversityInstitutions] = useState([]);
  const [educationalInstitutions, setEducationalInstitutions] = useState([]);
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

  const institutionRows =
    roleConfig.institutionKind === "educational"
      ? educationalInstitutions
      : universityInstitutions;
  const facultyRows = useMemo(
    () => buildFacultyRowsFromCycles(academicCycles),
    [academicCycles],
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

  useEffect(() => {
    let active = true;

    async function loadCatalogs() {
      setCatalogLoading(true);
      setCatalogError("");

      try {
        const [cyclePayload, universityPayload, schoolPayload, collegePayload] =
          await Promise.all([
            apiRequest("/api/public/academic-cycles"),
            apiRequest("/api/public/institutions?type=UNIVERSIDAD&size=100"),
            apiRequest("/api/public/institutions?type=ESCUELA&size=100"),
            apiRequest("/api/public/institutions?type=COLEGIO&size=100"),
          ]);

        if (active) {
          setAcademicCycles(
            Array.isArray(cyclePayload)
              ? cyclePayload
              : unwrapPage(cyclePayload),
          );
          setUniversityInstitutions(unwrapPage(universityPayload));
          setEducationalInstitutions(
            dedupeById([
              ...unwrapPage(schoolPayload),
              ...unwrapPage(collegePayload),
            ]),
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

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function changeRole(roleId) {
    if (roleId === activeRole) return;

    setActiveRole(roleId);
    setError("");
    setSuccess("");

    setForm((current) => ({
      ...current,
      facultyId: "",
      careerId: "",
      academicCycleId: "",
      institutionId: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = cleanRegistrationPayload(form, activeRole);

      await registerStudent({ data, file });

      setSuccess("Cuenta registrada correctamente.");
      setForm(initialForm);
      setFile(null);

      window.location.hash = "dashboard";
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
    <main className="relative min-h-screen bg-[#d1dde1] px-4 py-6 text-zinc-900 dark:bg-[#0b1120] dark:text-slate-100">
      <section className="flex gap-6 lg:mx-8">
        <aside className="hidden lg:block sticky top-6 self-start">
          <div className="relative min-h-[680px] rounded-[2rem] bg-[#04344c] p-6 text-white shadow-2xl shadow-[#04344c]/30">
            {/* Fondos decorativos */}
            <div className="pointer-events-none absolute inset-0 bg-[#04344c]" />

            {/* Capa inferior oscura */}
            <div className="pointer-events-none absolute inset-x-6 bottom-0 z-10 h-40 bg-[#04344c]" />

            {/* Header brand */}
            <div className="inline-flex min-w-80 items-center gap-3 rounded-lg border border-white/15 bg-white/10 p-3 shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-[#529914]/40 bg-[#529914] text-sm font-black text-white" aria-hidden="true">UNL</div>
              <div>
                <p className="text-xs font-extrabold uppercase leading-tight tracking-normal text-[#bbf7d0]">Universidad Nacional de Loja</p>
                <p className="text-sm font-[850] leading-tight text-white">Sistema de Gestion de Practicas</p>
              </div>
            </div>

            {/* Texto principal */}
            <div className="relative z-20 mt-16">
              <span className="inline-flex rounded-full border border-[#529914] bg-[#074462] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                Prácticas preprofesionales
              </span>

              <h1 className="mt-5 max-w-72 text-4xl font-black leading-[0.98] tracking-[-0.06em] text-white">
                Gestión académica institucional para prácticas preprofesionales.
              </h1>

              <p className="mt-4 max-w-72 text-sm leading-7 text-slate-300/80">
                Centraliza el seguimiento, la vinculación institucional y el
                control académico de estudiantes, tutores e instituciones.
              </p>
            </div>

            {/* Slider vertical */}
            <div className="relative z-20 mt-8 h-60 overflow-hidden rounded-3xl">
              <div className="flex animate-vertical-slide flex-col gap-3 hover:[animation-play-state:paused]">
                <StorySlide
                  number="01"
                  title="Vinculación institucional"
                  text="Relaciona estudiantes, tutores, universidades y centros de práctica desde un mismo espacio."
                />

                <StorySlide
                  number="02"
                  title="Seguimiento académico"
                  text="Organiza ciclos, carreras, asignaturas y procesos asociados a las prácticas."
                />

                <StorySlide
                  number="03"
                  title="Control seguro"
                  text="Acceso por roles para mantener la información ordenada y protegida."
                />

                <StorySlide
                  number="04"
                  title="Gestión eficiente"
                  text="Reduce procesos manuales y mejora la trazabilidad institucional."
                />

                {/* Repetidos para loop fluido */}
                <StorySlide
                  number="01"
                  title="Vinculación institucional"
                  text="Relaciona estudiantes, tutores, universidades y centros de práctica desde un mismo espacio."
                />

                <StorySlide
                  number="02"
                  title="Seguimiento académico"
                  text="Organiza ciclos, carreras, asignaturas y procesos asociados a las prácticas."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-white">SGP</p>
                <p className="text-xs font-medium text-slate-400">
                  Plataforma académica
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300/80 [animation-delay:200ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30 [animation-delay:400ms]" />
              </div>
            </div>
          </div>
        </aside>

        <form
          onSubmit={handleSubmit}
          className="w-full rounded-[2rem] border border-white/90 bg-white/90 p-5 shadow-2xl shadow-zinc-300/60 backdrop-blur-xl dark:border-slate-700 dark:bg-surface dark:shadow-black/35 sm:p-6"
        >
          <header className="mb-5 border-b border-zinc-100 pb-4 dark:border-slate-700">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[11px] font-black uppercase tracking-normal text-primary">
                  Registro público
                </p>

                <div key={activeRole} className="animate-role-slide">
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 dark:text-slate-50">
                    {roleConfig.title}
                  </h2>

                  <p className="mt-1 text-sm text-muted">
                    {roleConfig.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = "";
                }}
                className="rounded-full px-3 py-2 text-sm font-semibold text-muted transition hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-slate-800 dark:hover:text-slate-50 lg:hidden"
              >
                Iniciar sesión
              </button>
            </div>

            <div className="mt-5 grid gap-2 md:grid-cols-3" role="tablist">
              {REGISTRATION_ROLES.map((role) => (
                <button
                  aria-selected={activeRole === role.id}
                  className={[
                    "rounded-xl border px-3 py-2 text-sm font-black transition",
                    activeRole === role.id
                      ? "border-[--unl-green-strong] bg-[--unl-green] text-white shadow-lg shadow-zinc-200 dark:shadow-black/25"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-950 dark:border-slate-700 dark:bg-surface-soft dark:text-slate-300 dark:hover:border-[#75c66a] dark:hover:text-slate-50",
                  ].join(" ")}
                  key={role.id}
                  onClick={() => changeRole(role.id)}
                  role="tab"
                  type="button"
                >
                  {role.label}
                </button>
              ))}
            </div>
          </header>

          {catalogError && (
            <div className="mb-4">
              <Alert tone="error">{catalogError}</Alert>
            </div>
          )}

          <CompactSection title="Datos personales">
            <IconField icon={User} label="Nombres">
              <StyledInput
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

          <CompactSection title="Cuenta académica">
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
              <StyledInput
                minLength={8}
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Mínimo 8 caracteres"
              />
            </IconField>

            <SlideRoleContent activeRole={activeRole}>
              {roleConfig.relation === "academicCycle" && (
                <>
                  <SearchableSelect
                    icon={GraduationCap}
                    label="Facultad"
                    loading={catalogLoading}
                    rows={facultyRows}
                    value={form.facultyId}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        facultyId: value,
                        careerId: "",
                        academicCycleId: "",
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
                </>
              )}

              {roleConfig.relation === "institution" && (
                <SearchableSelect
                  icon={Landmark}
                  label={roleConfig.institutionLabel || "Institución"}
                  loading={catalogLoading}
                  rows={institutionRows}
                  value={form.institutionId}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      institutionId: value,
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
              )}
            </SlideRoleContent>
          </CompactSection>

          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_190px] md:items-end">
            <div>
              <p className="mb-2 text-xs font-bold text-muted">
                Archivo opcional
              </p>

              <label className="group flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 text-sm text-zinc-500 transition hover:border-zinc-500 hover:bg-zinc-100 dark:border-slate-700 dark:bg-surface-soft dark:text-slate-300 dark:hover:border-[#75c66a] dark:hover:bg-[#203026]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-500 shadow-sm transition group-hover:bg-zinc-950 group-hover:text-white dark:bg-slate-900 dark:text-slate-300 dark:group-hover:bg-[#75c66a] dark:group-hover:text-[#0b1120]">
                  <Upload size={15} />
                </span>

                <span className="truncate font-medium">
                  {file ? file.name : "Seleccionar archivo"}
                </span>

                <input
                  accept="image/jpeg,image/png,image/webp"
                  type="file"
                  className="hidden"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>

            <PrimaryButton
              className="h-11 w-full rounded-xl bg-zinc-950 font-bold text-white shadow-lg shadow-zinc-300 transition hover:-translate-y-0.5 hover:bg-zinc-800 dark:bg-[#2f7a4d] dark:shadow-black/25 dark:hover:bg-[#25643d]"
              icon={UserPlus}
              loading={loading}
              type="submit"
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </PrimaryButton>
          </div>

          {error && (
            <div className="mt-3">
              <Alert tone="error">{error}</Alert>
            </div>
          )}

          {success && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 dark:border-green-400/40 dark:bg-green-950/35 dark:text-green-200">
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted">
            ¿Ya tienes una cuenta?{" "}
            <button
              type="button"
              onClick={() => {
                window.location.hash = "";
              }}
              className="font-bold text-[#34443b] transition hover:text-zinc-950 dark:text-slate-200 dark:hover:text-white"
            >
              Iniciar sesión
            </button>
          </p>
        </form>
      </section>
    </main>
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
  };

  if (role === "ROLE_ESTUDIANTE") {
    payload.academicCycleId = form.academicCycleId
      ? Number(form.academicCycleId)
      : null;
  }

  if (role === "ROLE_TUTOR_INSTITUCIONAL" || role === "ROLE_TUTOR_PRACTICAS") {
    payload.institutionId = form.institutionId
      ? Number(form.institutionId)
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

function facultyLabel(row) {
  return row.name || "Facultad";
}

function careerLabel(row) {
  return [row.name, row.faculty].filter(Boolean).join(" - ") || "Carrera";
}

function institutionLabel(row) {
  return [row.name, row.code].filter(Boolean).join(" - ") || "Institución";
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
    <div className="relative overflow-hidden md:col-span-2">
      <div key={activeRole} className="animate-role-slide">
        {children}
      </div>
    </div>
  );
}

function CompactSection({ title, children }) {
  return (
    <section className="mb-4 rounded-2xl border border-zinc-100 bg-zinc-50/55 p-3.5 dark:border-slate-700 dark:bg-surface-soft">
      <h3 className="mb-3 px-1 text-[11px] font-black uppercase tracking-[0.2em] text-muted">
        {title}
      </h3>

      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function IconField({ icon: Icon, label, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-muted">{label}</p>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-zinc-400 shadow-sm dark:bg-slate-900 dark:text-slate-400">
          <Icon size={14} />
        </span>

        {children}
      </div>
    </div>
  );
}

function SearchableSelect({
  icon: Icon,
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
      <p className="mb-2 text-xs font-bold text-muted">{label}</p>

      <div className="space-y-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-zinc-400 shadow-sm dark:bg-slate-900 dark:text-slate-400">
            <Search size={14} />
          </span>

          <StyledInput
            disabled={loading || disabled}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={loading ? "Cargando registros..." : searchPlaceholder}
            type="search"
            value={query}
          />
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg bg-white text-zinc-400 shadow-sm dark:bg-slate-900 dark:text-slate-400">
            <Icon size={14} />
          </span>

          <select
            className={[
              "h-11 w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-11 pr-4 text-sm",
              "text-zinc-900 shadow-sm outline-none transition",
              "focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10",
              "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-300 dark:focus:bg-slate-950 dark:focus:ring-sky-300/20",
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
          <p className="text-xs font-semibold text-muted">
            No hay registros disponibles.
          </p>
        )}

        {query && options.length === 0 && rows.length > 0 && (
          <p className="text-xs font-semibold text-muted">
            No hay coincidencias.
          </p>
        )}
      </div>
    </div>
  );
}

function StyledInput(props) {
  return (
    <Input
      {...props}
      className={[
        "h-11 w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-11 pr-4 text-sm",
        "text-zinc-900 placeholder:text-zinc-400",
        "shadow-sm outline-none transition",
        "focus:border-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-900/10",
        "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-300 dark:focus:bg-slate-950 dark:focus:ring-sky-300/20",
        props.className || "",
      ].join(" ")}
    />
  );
}
