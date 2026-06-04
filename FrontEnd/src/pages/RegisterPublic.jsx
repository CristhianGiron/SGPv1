import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Fingerprint,
  FileCheck2,
  GraduationCap,
  IdCard,
  ImagePlus,
  Landmark,
  LockKeyhole,
  LogIn,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";
import { apiRequest, unwrapPage } from "../api/client";
import { Alert } from "../components/ui/Alert";
import { Input, PasswordInput } from "../components/ui/FormControls";
import { PrimaryButton } from "../components/ui/ActionBar";
import { ThemeToggle } from "../components/ui/ThemeToggle";
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
  {
    id: "ROLE_TUTOR_INSTITUCIONAL",
    label: "Tutor institucional",
    title: "Crear cuenta de tutor institucional",
    description:
      "Registra tu acceso como tutor institucional vinculado al paralelo de una escuela o colegio.",
    relation: "gradeParallel",
    institutionKind: "educational",
    institutionLabel: "Institución educativa",
    institutionPlaceholder: "Seleccionar escuela o colegio",
    institutionSearchPlaceholder: "Buscar escuela o colegio",
  },
  {
    id: "ROLE_TUTOR_PRACTICAS",
    label: "Tutor de prácticas",
    title: "Crear cuenta de tutor de prácticas",
    description:
      "Registra tu acceso como tutor académico vinculado al paralelo universitario que gestionas.",
    relation: "course",
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
  courseId: "",
  institutionId: "",
  gradeId: "",
  gradeParallelId: "",
};

export function RegisterStudentPage() {
  const [activeRole, setActiveRole] = useState(REGISTRATION_ROLES[0].id);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
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
        const [
          cyclePayload,
          coursePayload,
          schoolPayload,
          collegePayload,
          gradePayload,
          gradeParallelPayload,
        ] =
          await Promise.all([
            apiRequest("/api/public/academic-cycles"),
            apiRequest("/api/public/courses"),
            apiRequest("/api/public/institutions?type=ESCUELA&size=100"),
            apiRequest("/api/public/institutions?type=COLEGIO&size=100"),
            apiRequest("/api/public/grades"),
            apiRequest("/api/public/grade-parallels"),
          ]);

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
      courseId: "",
      institutionId: "",
      gradeId: "",
      gradeParallelId: "",
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
    <main className="register-page relative min-h-dvh overflow-x-hidden bg-page text-heading dark:bg-page dark:text-heading">
      <style>{`
        @media (min-width: 1024px) {
          .register-viewport {
            min-height: 100dvh;
            height: 100dvh;
          }

          .register-layout {
            height: min(760px, calc(100dvh - 3rem));
          }

          .register-side-card,
          .register-form-card {
            height: 100%;
          }

          .register-form-scroll {
            max-height: 100%;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: color-mix(in srgb, var(--color-primary) 35%, transparent) transparent;
          }

          .register-form-scroll::-webkit-scrollbar {
            width: 8px;
          }

          .register-form-scroll::-webkit-scrollbar-thumb {
            background: color-mix(in srgb, var(--color-primary) 28%, transparent);
            border-radius: 999px;
          }

          .register-form-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
        }

        @media (min-width: 1024px) and (max-height: 780px) {
          .register-layout {
            height: calc(100dvh - 2.25rem);
          }

          .register-side-card,
          .register-form-card {
            padding: 1.35rem !important;
          }

          .register-hero-title {
            font-size: clamp(1.65rem, 2.4vw, 2.25rem) !important;
          }

          .register-hero-text,
          .register-credential-text {
            font-size: 0.78rem !important;
            line-height: 1.55 !important;
          }

          .register-credential {
            padding: 1rem !important;
          }

          .register-form-header {
            padding-bottom: 1rem !important;
            margin-bottom: 1rem !important;
          }

          .register-section {
            padding: 0.85rem !important;
            margin-bottom: 0.85rem !important;
          }
        }
      `}</style>

      <div className="absolute inset-x-0 top-0 z-20 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="fixed right-5 top-5 z-50 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      <div
        aria-hidden="true"
        className="absolute left-[-10rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-primary/18 blur-3xl dark:bg-primary-soft"
      />

      <div
        aria-hidden="true"
        className="absolute bottom-[-12rem] right-[-12rem] h-[34rem] w-[34rem] rounded-full bg-accent/18 blur-3xl dark:bg-accent-soft"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.32] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--color-primary) 10%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="register-viewport relative mx-auto flex w-full max-w-7xl items-center px-5 py-6 lg:px-8">
        <section className="register-layout grid w-full items-stretch gap-8 lg:grid-cols-[0.9fr_1.35fr]">
          <aside className="register-side-card relative hidden overflow-hidden rounded-[2rem] border border-inverse/70 bg-panel/82 p-8 shadow-soft backdrop-blur-xl dark:border-line dark:bg-surface/75 lg:grid lg:grid-rows-[auto_minmax(0,1fr)_auto]">
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 h-40 w-40 rounded-bl-[6rem] bg-accent-soft dark:bg-accent-soft"
            />

            <div
              aria-hidden="true"
              className="absolute bottom-[-5rem] right-[-4rem] h-64 w-64 rounded-full bg-accent/10 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.28] dark:opacity-[0.1]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, color-mix(in srgb, var(--color-primary) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-primary) 6%, transparent) 1px, transparent 1px)",
                backgroundSize: "34px 34px",
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-lg font-black text-inverse shadow-card">
                  UNL
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-muted dark:text-muted">
                    Universidad Nacional de Loja
                  </p>
                  <p className="mt-1 text-lg font-black text-heading dark:text-heading">
                    Sistema de Gestión de Prácticas
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex min-h-0 flex-col justify-center py-8">
              <p className="inline-flex w-fit rounded-full border border-accent/25 bg-accent-soft px-4 py-2 text-xs font-black uppercase tracking-wide text-accent-strong dark:border-accent/30 dark:bg-accent-soft dark:text-accent-strong">
                Registro público
              </p>

              <h1 className="register-hero-title mt-6 max-w-[13ch] text-[clamp(2rem,3vw,3rem)] font-black leading-[1.04] tracking-tight text-primary dark:text-heading">
                Crea tu acceso institucional.
              </h1>

              <p className="register-hero-text mt-4 max-w-md text-[15px] leading-7 text-muted dark:text-muted">
                Registra tu perfil, vincula tu rol académico y accede al sistema
                de seguimiento de prácticas preprofesionales.
              </p>
            </div>

            <RegisterCredential />
          </aside>

          <form
            onSubmit={handleSubmit}
            className="register-form-card relative flex min-h-[calc(100dvh-3rem)] overflow-hidden rounded-[2rem] border border-inverse/80 bg-panel/92 p-5 shadow-soft backdrop-blur-xl dark:border-line dark:bg-surface/90 sm:p-6 lg:min-h-0 lg:p-8"
          >
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 h-32 w-32 rounded-bl-[5rem] bg-accent-soft dark:bg-accent-soft"
            />

            <div
              aria-hidden="true"
              className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-[4rem] bg-primary/5 dark:bg-primary-soft"
            />

            <div className="register-form-scroll relative z-10 w-full pr-1">
              <header className="register-form-header mb-5 border-b border-line pb-5 dark:border-line">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-inverse shadow-card">
                        <UserPlus size={22} />
                      </div>

                      <p className="inline-flex rounded-full border border-accent/25 bg-accent-soft px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-accent dark:border-accent/30 dark:bg-accent-soft dark:text-accent-strong">
                        Registro autorizado
                      </p>
                    </div>

                    <div key={activeRole} className="animate-role-slide">
                      <h2 className="mt-5 text-[2rem] font-black tracking-tight text-heading dark:text-heading">
                        {roleConfig.title}
                      </h2>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted dark:text-muted">
                        {roleConfig.description}
                      </p>

                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHashRoute("");
                    }}
                    className="hidden shrink-0 items-center gap-2 rounded-full border border-line bg-panel px-4 py-2 text-sm font-bold text-muted transition hover:border-primary/30 hover:text-primary dark:border-line dark:bg-page dark:text-muted dark:hover:text-info-strong sm:inline-flex"
                  >
                    <LogIn size={16} />
                    Iniciar sesión
                  </button>
                </div>

                <div className="mt-5 grid gap-2 md:grid-cols-3" role="tablist">
                  {REGISTRATION_ROLES.map((role) => (
                    <button
                      aria-selected={activeRole === role.id}
                      className={[
                        "rounded-2xl border px-3 py-2.5 text-sm font-black transition",
                        activeRole === role.id
                          ? "border-accent bg-accent text-inverse shadow-lg shadow-accent/20"
                          : "border-line bg-panel/80 text-muted hover:border-primary/30 hover:text-primary dark:border-line dark:bg-page dark:text-muted dark:hover:border-accent dark:hover:text-heading",
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
                  <StyledPasswordInput
                    minLength={8}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Mínimo 8 caracteres"
                  />
                </IconField>

                <SlideRoleContent activeRole={activeRole}>
                  {(roleConfig.relation === "academicCycle" ||
                    roleConfig.relation === "course") && (
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
              </CompactSection>

              <div className="mb-4 grid gap-3 grid-cols-1 lg:grid-cols-[1fr_210px] lg:items-end">
                <ProfileImagePicker file={file} onChange={setFile} />

                <PrimaryButton
                  className="h-12 w-full rounded-xl bg-primary font-bold text-primary-strong shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-strong dark:bg-accent dark:shadow-soft dark:hover:bg-accent-strong"
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
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-success bg-success-soft px-4 py-3 text-sm font-semibold text-success-strong dark:border-success/40 dark:bg-success-soft dark:text-success-strong">
                  <CheckCircle2 size={18} />
                  {success}
                </div>
              )}

              <p className="mt-4 text-center text-xs text-muted dark:text-muted">
                ¿Ya tienes una cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setHashRoute("");
                  }}
                  className="font-bold text-primary transition hover:text-accent dark:text-body dark:hover:text-accent-strong"
                >
                  Iniciar sesión
                </button>
              </p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function RegisterCredential() {
  return (
    <div className="relative z-10">
      <div className="register-credential relative rotate-[-1deg] overflow-hidden rounded-[2rem] border border-line bg-primary p-5 text-inverse shadow-soft">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div
          aria-hidden="true"
          className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-accent/45 blur-2xl"
        />

        <div className="relative flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-inverse/55">
              Credencial de registro
            </p>

            <h2 className="mt-3 max-w-xs text-[1.5rem] font-black leading-tight">
              Perfil académico institucional
            </h2>

            <p className="register-credential-text mt-2 max-w-xs text-[13px] leading-6 text-inverse/65">
              Tus datos permiten identificar tu rol dentro del proceso de
              prácticas.
            </p>
          </div>

          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl border border-inverse/20 bg-panel/10 backdrop-blur">
            <Fingerprint size={29} className="text-inverse/85" />
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-3">
          <AccessPill icon={GraduationCap} label="Rol" />
          <AccessPill icon={FileCheck2} label="Perfil" />
          <AccessPill icon={ShieldCheck} label="Acceso" />
        </div>
      </div>
    </div>
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
      <p className="mb-2 text-xs font-bold text-muted dark:text-muted">
        Foto de perfil opcional
      </p>

      <label className="group flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-line bg-field-hover p-3 transition hover:border-accent hover:bg-accent-soft dark:border-line dark:bg-surface-soft/70 dark:hover:border-accent dark:hover:bg-accent-soft">
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
          <span className="block text-sm font-black text-heading dark:text-heading">
            {file ? "Foto seleccionada" : "Subir imagen de perfil"}
          </span>

          <span className="mt-1 block truncate text-xs leading-5 text-muted dark:text-muted">
            {file
              ? file.name
              : "Usa una imagen JPG, PNG o WebP para identificar tu cuenta."}
          </span>
        </span>

        <input
          accept="image/jpeg,image/png,image/webp"
          type="file"
          className="hidden"
          onChange={(event) => onChange(event.target.files?.[0] || null)}
        />
      </label>
    </div>
  );
}

function AccessPill({ icon: Icon, label }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-inverse/15 bg-panel/10 px-3 py-3 backdrop-blur">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-panel text-primary">
        <Icon size={16} />
      </span>

      <span className="truncate text-[10px] font-black uppercase tracking-wide text-inverse/75">
        {label}
      </span>
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
    <div className="relative overflow-hidden md:col-span-2">
      <div key={activeRole} className="animate-role-slide">
        {children}
      </div>
    </div>
  );
}

function CompactSection({ title, children }) {
  return (
    <section className="register-section mb-4 rounded-2xl border border-line bg-field-hover/80 p-3.5 dark:border-line dark:bg-surface-soft/70">
      <h3 className="mb-3 px-1 text-[11px] font-black uppercase tracking-[0.2em] text-muted dark:text-muted">
        {title}
      </h3>

      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function IconField({ icon: Icon, label, children }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold text-muted dark:text-muted">
        {label}
      </p>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg bg-panel text-muted shadow-sm dark:bg-page dark:text-muted">
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
      <p className="mb-2 text-xs font-bold text-muted dark:text-muted">
        {label}
      </p>

      <div className="space-y-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg bg-panel text-muted shadow-sm dark:bg-page dark:text-muted">
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
          <span className="pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg bg-panel text-muted shadow-sm dark:bg-page dark:text-muted">
            <Icon size={14} />
          </span>

          <select
            className={[
              "h-11 w-full rounded-xl border border-line bg-panel py-2.5 pl-11 pr-4 text-sm",
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
          <p className="text-xs font-semibold text-muted dark:text-muted">
            No hay registros disponibles.
          </p>
        )}

        {query && options.length === 0 && rows.length > 0 && (
          <p className="text-xs font-semibold text-muted dark:text-muted">
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
        "h-11 w-full rounded-xl border border-line bg-panel py-2.5 pl-11 pr-4 text-sm",
        "text-heading placeholder:text-muted",
        "shadow-sm outline-none transition",
        "focus:border-focus focus:bg-panel focus:ring-2 focus:ring-focus-soft",
        "dark:border-line dark:bg-page dark:text-heading dark:placeholder:text-muted dark:focus:border-accent dark:focus:bg-page dark:focus:ring-focus-soft",
        props.className || "",
      ].join(" ")}
    />
  );
}

function StyledPasswordInput(props) {
  return (
    <PasswordInput
      {...props}
      className={[
        "h-11 w-full rounded-xl border border-line bg-panel py-2.5 pl-11 pr-12 text-sm",
        "text-heading placeholder:text-muted",
        "shadow-sm outline-none transition",
        "focus:border-focus focus:bg-panel focus:ring-2 focus:ring-focus-soft",
        "dark:border-line dark:bg-page dark:text-heading dark:placeholder:text-muted dark:focus:border-accent dark:focus:bg-page dark:focus:ring-focus-soft",
        props.className || "",
      ].join(" ")}
    />
  );
}
