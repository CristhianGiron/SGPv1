import { useState } from "react";
import {
  LogIn,
  ShieldCheck,
  Fingerprint,
  FileCheck2,
  Building2,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "../components/ui/Alert";
import { Field, Input, PasswordInput } from "../components/ui/FormControls";
import { PrimaryButton } from "../components/ui/ActionBar";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { setHashRoute } from "../utils/routes";

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
      setError(
        requestError.message ||
          "No se pudo iniciar sesión. Revisa tu usuario y contraseña.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page relative min-h-dvh overflow-x-hidden bg-page text-heading dark:bg-page dark:text-heading">
      <style>{`
        @media (min-width: 1024px) {
          .login-viewport {
            min-height: 100dvh;
            height: 100dvh;
          }

          .login-layout {
            height: min(720px, calc(100dvh - 3rem));
          }

          .login-side-card,
          .login-form-card {
            height: 100%;
          }
        }

        @media (min-width: 1024px) and (max-height: 780px) {
          .login-layout {
            height: calc(100dvh - 2.5rem);
          }

          .login-side-card,
          .login-form-card {
            padding: 1.5rem !important;
          }

          .login-brand-logo {
            width: 3.25rem !important;
            height: 3.25rem !important;
            border-radius: 1rem !important;
          }

          .login-brand-school {
            font-size: 0.68rem !important;
          }

          .login-brand-system {
            font-size: 0.95rem !important;
          }

          .login-hero {
            padding-block: 1rem !important;
          }

          .login-hero-badge {
            padding: 0.4rem 0.85rem !important;
            font-size: 0.65rem !important;
          }

          .login-hero-title {
            margin-top: 1rem !important;
            font-size: clamp(1.75rem, 2.5vw, 2.35rem) !important;
            line-height: 1.03 !important;
          }

          .login-hero-text {
            margin-top: 0.75rem !important;
            font-size: 0.82rem !important;
            line-height: 1.55 !important;
          }

          .login-credential {
            padding: 1rem !important;
            border-radius: 1.5rem !important;
          }

          .login-credential-label {
            font-size: 0.62rem !important;
          }

          .login-credential-title {
            margin-top: 0.6rem !important;
            font-size: 1.25rem !important;
          }

          .login-credential-text {
            margin-top: 0.45rem !important;
            font-size: 0.72rem !important;
            line-height: 1.55 !important;
          }

          .login-credential-icon {
            width: 3rem !important;
            height: 3rem !important;
          }

          .login-pills {
            margin-top: 0.8rem !important;
            gap: 0.45rem !important;
          }

          .login-pill {
            padding: 0.55rem 0.6rem !important;
            border-radius: 0.9rem !important;
          }

          .login-pill-icon {
            width: 1.55rem !important;
            height: 1.55rem !important;
          }

          .login-pill-text {
            font-size: 0.55rem !important;
          }

          .login-form-content {
            max-width: 100%;
          }

          .login-form-icon {
            width: 2.75rem !important;
            height: 2.75rem !important;
          }

          .login-form-title {
            margin-top: 1rem !important;
            font-size: 1.75rem !important;
          }

          .login-form-text {
            font-size: 0.82rem !important;
            line-height: 1.5 !important;
          }

          .login-form-fields {
            margin-top: 1.25rem !important;
          }

          .login-security-box {
            margin-top: 1.25rem !important;
            padding: 0.85rem !important;
          }

          .login-register-link {
            margin-top: 1.1rem !important;
          }
        }

        @media (min-width: 1024px) and (max-height: 680px) {
          .login-layout {
            height: calc(100dvh - 2rem);
          }

          .login-side-card,
          .login-form-card {
            padding: 1.25rem !important;
          }

          .login-hero-title {
            font-size: clamp(1.55rem, 2.2vw, 2rem) !important;
            max-width: 16ch !important;
          }

          .login-hero-text {
            font-size: 0.75rem !important;
          }

          .login-credential-text {
            display: none;
          }

          .login-pill {
            justify-content: center;
          }

          .login-pill-text {
            display: none;
          }

          .login-form-title {
            font-size: 1.55rem !important;
          }

          .login-security-text {
            font-size: 0.68rem !important;
            line-height: 1.45 !important;
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

      <div className="login-viewport relative mx-auto flex w-full max-w-7xl items-center px-5 py-6 lg:px-8">
        <section className="login-layout grid w-full items-stretch gap-8 lg:grid-cols-[1fr_470px]">
          {/* Tarjeta izquierda */}
          <aside className="login-side-card relative hidden overflow-hidden rounded-[2rem] border border-inverse/70 bg-panel/82 p-8 shadow-soft backdrop-blur-xl dark:border-line dark:bg-surface/75 lg:grid lg:grid-rows-[auto_minmax(0,1fr)_auto]">
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
                <div className="login-brand-logo grid h-16 w-16 place-items-center rounded-2xl bg-primary text-lg font-black text-inverse shadow-card">
                  UNL
                </div>

                <div>
                  <p className="login-brand-school text-xs font-black uppercase tracking-[0.2em] text-muted dark:text-muted">
                    Universidad Nacional de Loja
                  </p>
                  <p className="login-brand-system mt-1 text-lg font-black text-heading dark:text-heading">
                    Sistema de Gestión de Prácticas
                  </p>
                </div>
              </div>
            </div>

            <div className="login-hero relative z-10 flex min-h-0 flex-col justify-center py-8">
              <p className="login-hero-badge inline-flex w-fit rounded-full border border-accent/25 bg-accent-soft px-4 py-2 text-xs font-black uppercase tracking-wide text-accent-strong dark:border-accent/30 dark:bg-accent-soft dark:text-accent-strong">
                Portal institucional
              </p>

              <h1 className="login-hero-title mt-6 max-w-[14ch] text-[clamp(2rem,3vw,3rem)] font-black leading-[1.04] tracking-tight text-primary dark:text-heading">
                Gestiona tus prácticas con acceso seguro.
              </h1>

              <p className="login-hero-text mt-4 max-w-md text-[15px] leading-7 text-muted dark:text-muted">
                Un espacio académico para registrar información, revisar
                evidencias y mantener organizado el proceso de prácticas
                preprofesionales.
              </p>
            </div>

            <AccessCredential />
          </aside>

          {/* Tarjeta derecha / formulario */}
          <div className="relative mx-auto w-full max-w-[470px] lg:max-w-none">
            <div className="mb-5 flex items-center gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-sm font-black text-inverse">
                UNL
              </div>

              <div>
                <p className="text-xs font-black uppercase text-muted dark:text-muted">
                  Universidad Nacional de Loja
                </p>
                <p className="text-sm font-extrabold text-heading dark:text-heading">
                  Gestión de Prácticas
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="login-form-card relative flex overflow-hidden rounded-[2rem] border border-inverse/80 bg-panel/92 p-8 shadow-soft backdrop-blur-xl dark:border-line dark:bg-surface/90"
            >
              <div
                aria-hidden="true"
                className="absolute right-0 top-0 h-32 w-32 rounded-bl-[5rem] bg-accent-soft dark:bg-accent-soft"
              />

              <div
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-24 w-24 rounded-tr-[4rem] bg-primary/5 dark:bg-primary-soft"
              />

              <div className="login-form-content relative z-10 m-auto w-full">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="login-form-icon grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-inverse shadow-card">
                      <ShieldCheck size={22} />
                    </div>

                    <p className="inline-flex rounded-full border border-accent/25 bg-accent-soft px-3 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-accent dark:border-accent/30 dark:bg-accent-soft dark:text-accent-strong">
                      Acceso autorizado
                    </p>
                  </div>

                  <h2 className="login-form-title mt-5 text-[2rem] font-black tracking-tight text-heading dark:text-heading">
                    Iniciar sesión
                  </h2>

                  <p className="login-form-text mt-2 text-sm leading-6 text-muted dark:text-muted">
                    Ingresa tus credenciales institucionales para acceder al
                    sistema. Usa el usuario o correo con el que fue creada tu
                    cuenta.
                  </p>
                </div>

                <div className="login-form-fields relative mt-7">
                  <Field label="Usuario o correo">
                    <Input
                      autoComplete="username"
                      placeholder="usuario@unl.edu.ec"
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
                    <PasswordInput
                      autoComplete="current-password"
                      placeholder="Ingresa tu contraseña"
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
                    className="mt-6 h-12 w-full rounded-xl"
                    icon={LogIn}
                    loading={loading}
                    type="submit"
                  >
                    {loading ? "Ingresando..." : "Entrar al sistema"}
                  </PrimaryButton>
                </div>

                <div className="login-security-box relative mt-6 rounded-2xl border border-line bg-field-hover p-4 dark:border-line dark:bg-surface-soft/70">
                  <div className="flex gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-strong dark:bg-panel/10 dark:text-accent-strong">
                      <Fingerprint size={18} />
                    </span>

                    <p className="login-security-text text-xs leading-5 text-muted dark:text-muted">
                      El acceso está protegido y reservado para usuarios
                      registrados dentro del sistema institucional.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHashRoute("register");
                  }}
                  className="login-register-link mt-6 w-full text-center text-sm font-bold text-muted transition-colors hover:text-primary dark:text-muted dark:hover:text-info-strong"
                >
                  ¿No tienes cuenta? Solicitar registro
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function AccessCredential() {
  return (
    <div className="relative z-10">
      <div className="login-credential relative rotate-[-1deg] overflow-hidden rounded-[2rem] border border-line bg-primary p-5 text-inverse shadow-soft">
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
            <p className="login-credential-label text-xs font-black uppercase tracking-[0.22em] text-inverse/55">
              Credencial de acceso
            </p>

            <h2 className="login-credential-title mt-3 max-w-xs text-[1.5rem] font-black leading-tight">
              Gestión académica institucional
            </h2>

            <p className="login-credential-text mt-2 max-w-xs text-[13px] leading-6 text-inverse/65">
              Acceso reservado para usuarios vinculados al proceso formativo de
              prácticas.
            </p>
          </div>

          <div className="login-credential-icon grid h-14 w-14 shrink-0 place-items-center rounded-3xl border border-inverse/20 bg-panel/10 backdrop-blur">
            <Fingerprint size={29} className="text-inverse/85" />
          </div>
        </div>

        <div className="login-pills relative mt-5 grid grid-cols-3 gap-3">
          <AccessPill icon={GraduationCap} label="Académico" />
          <AccessPill icon={FileCheck2} label="Evidencias" />
          <AccessPill icon={Building2} label="Institución" />
        </div>
      </div>
    </div>
  );
}

function AccessPill({ icon: Icon, label }) {
  return (
    <div className="login-pill flex min-w-0 items-center gap-2 rounded-2xl border border-inverse/15 bg-panel/10 px-3 py-3 backdrop-blur">
      <span className="login-pill-icon grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-panel text-primary">
        <Icon size={16} />
      </span>

      <span className="login-pill-text truncate text-[10px] font-black uppercase tracking-wide text-inverse/75">
        {label}
      </span>
    </div>
  );
}
