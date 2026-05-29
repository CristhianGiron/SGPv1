import { useState } from 'react';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/ui/Alert';
import { PrimaryButton, SecondaryButton } from '../components/ui/ActionBar';
import { Field, Input } from '../components/ui/FormControls';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { joinText } from '../utils/format';

export function ForcePasswordChangePage() {
  const { logout, profile, refreshProfile, token } = useAuth();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiRequest('/api/account/me/password', {
        method: 'PATCH',
        token,
        body: form,
      });
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      await refreshProfile();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <main className="min-h-screen bg-page text-ink">
      <div aria-hidden="true" className="h-[5px] bg-primary" />
      <div className="mx-auto flex min-h-[calc(100vh-5px)] w-full max-w-6xl items-center px-5 py-10">
        <section className="mx-auto w-full max-w-xl rounded-lg border border-border bg-white p-6 shadow-card dark:border-slate-700 dark:bg-surface">
          <div className="mb-5 flex justify-end">
            <ThemeToggle />
          </div>
          <div className="mb-7">
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary text-white shadow-[0_14px_24px_rgba(4,52,76,0.2)]">
              <ShieldCheck size={26} />
            </div>

            <p className="mt-4 inline-flex items-center rounded-full border border-[#529914]/30 bg-[#e4f0d8] px-3 py-2 text-xs font-black leading-none text-[#3f760f] dark:border-[#75c66a]/40 dark:bg-[#75c66a]/15 dark:text-[#bbf7d0]">Actualización requerida</p>
            <h1 className="mt-4 text-2xl font-black text-[#20282d] dark:text-slate-50">Cambia tu contraseña</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {joinText(profile?.names, profile?.lastNames) || profile?.username}, antes de continuar debes
              reemplazar la contraseña asignada inicialmente.
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <Alert tone="error">{error}</Alert>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Contraseña actual">
              <Input
                autoComplete="current-password"
                type="password"
                value={form.currentPassword}
                onChange={(event) => updateField('currentPassword', event.target.value)}
                required
              />
            </Field>

            <Field label="Nueva contraseña">
              <Input
                autoComplete="new-password"
                minLength={8}
                type="password"
                value={form.newPassword}
                onChange={(event) => updateField('newPassword', event.target.value)}
                required
              />
            </Field>

            <Field label="Confirmar contraseña">
              <Input
                autoComplete="new-password"
                minLength={8}
                type="password"
                value={form.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                required
              />
            </Field>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <PrimaryButton className="h-12 flex-1" icon={KeyRound} loading={saving} type="submit">
                Actualizar contraseña
              </PrimaryButton>
              <SecondaryButton className="h-12" icon={LogOut} onClick={logout} type="button">
                Salir
              </SecondaryButton>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
