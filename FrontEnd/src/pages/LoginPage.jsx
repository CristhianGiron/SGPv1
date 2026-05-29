import { useState } from "react";
import {
  KeyRound,
  LogIn,
  ShieldCheck,
  Workflow,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "../components/ui/Alert";
import { Field, Input } from "../components/ui/FormControls";
import { PrimaryButton } from "../components/ui/ActionBar";
import { ThemeToggle } from "../components/ui/ThemeToggle";

export function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-page text-ink">
      <div aria-hidden="true" className="h-[5px] bg-primary" />
      <div className="mx-auto flex min-h-[calc(100vh-5px)] w-full max-w-6xl items-center px-5 py-10">
        <section className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
          <div className="grid gap-8">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex w-fit items-center gap-3 rounded-lg border border-[#04344c]/15 bg-white/75 p-3 shadow-card dark:border-slate-700 dark:bg-surface">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-[#529914]/30 bg-primary text-sm font-black text-white shadow-[0_12px_24px_rgba(4,52,76,0.2)]" aria-hidden="true">UNL</div>
                <div>
                  <p className="text-xs font-extrabold uppercase leading-tight tracking-normal text-primary dark:text-sky-200">Universidad Nacional de Loja</p>
                  <p className="text-sm font-[850] leading-tight text-[#20282d] dark:text-slate-50">Sistema de Gestion de Practicas</p>
                </div>
              </div>
              <ThemeToggle />
            </div>

            <div>
              <h1 className="max-w-3xl text-[clamp(2rem,5vw,4rem)] font-black leading-tight text-[#20282d] dark:text-slate-50">Gestión académica institucional para prácticas preprofesionales.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
                Consulta tus cursos, envía evidencias, completa documentos y revisa observaciones
                desde un espacio claro y seguro.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-soft dark:border-slate-700 dark:bg-surface">
              <div className="flex items-center gap-4 border-b border-[#dbe8df] bg-[#e4f0d8] p-4 dark:border-slate-700 dark:bg-[#66bdf2]/15">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-[#d7e4e9] text-primary dark:bg-white/10 dark:text-sky-200">
                  <Workflow aria-hidden="true" size={22} />
                </span>
                <div>
                  <p className="font-bold text-[#20282d] dark:text-slate-50">Flujo académico organizado</p>
                  <p className="mt-1 text-sm text-muted">
                    Todo el proceso de práctica reunido en un solo lugar.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-4 lg:grid-cols-3">
                <Metric icon={Workflow} label="Proceso" value="Prácticas guiadas" />
                <Metric icon={ShieldCheck} label="Seguridad" value="Acceso institucional" />
                <Metric icon={KeyRound} label="Ingreso" value="Usuarios autorizados" />
              </div>
            </div>
          </div>

          <form className="rounded-lg border border-border bg-white p-6 shadow-card dark:border-slate-700 dark:bg-surface" onSubmit={handleSubmit}>
            <div className="mb-7">
              <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary text-white shadow-[0_14px_24px_rgba(4,52,76,0.2)]">
                <GraduationCap size={26} />
              </div>

              <p className="mt-4 inline-flex items-center rounded-full border border-[#529914]/30 bg-[#e4f0d8] px-3 py-2 text-xs font-black leading-none text-[#3f760f] dark:border-[#75c66a]/40 dark:bg-[#75c66a]/15 dark:text-[#bbf7d0]">Acceso autorizado UNL</p>

              <h2 className="mt-4 text-2xl font-black text-[#20282d] dark:text-slate-50">Iniciar sesión</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Ingresa con tu usuario o correo institucional para continuar.
              </p>
            </div>

            <Field label="Usuario o correo">
              <Input
                autoComplete="username"
                placeholder="usuario@unl.edu.ec o nombre de usuario"
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                required
              />
            </Field>

            <Field className="mt-4" label="Contraseña">
              <Input
                autoComplete="current-password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
              />
            </Field>

            {error && (
              <div className="mt-5">
                <Alert tone="error">{error}</Alert>
              </div>
            )}

            <PrimaryButton
              className="mt-6 h-12 w-full"
              icon={LogIn}
              loading={loading}
              type="submit"
            >
              {loading ? "Entrando..." : "Entrar al sistema"}
            </PrimaryButton>

            <p className="mt-6 text-center text-xs leading-5 text-muted">
              Plataforma institucional para el seguimiento de prácticas.
            </p>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  window.location.hash = "register";
                }}
                className="text-sm font-bold text-muted transition-colors hover:text-primary dark:hover:text-sky-200"
              >
                ¿No tienes cuenta? Registrarse
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="relative min-h-24 rounded-lg border border-[#04344c]/15 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-surface">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary" />
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#e4f0d8] text-[#3f760f] dark:bg-white/10 dark:text-[#bbf7d0]">
          <Icon aria-hidden="true" size={18} />
        </span>

        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-normal text-muted">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-bold text-[#20282d] dark:text-slate-50">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
