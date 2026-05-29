import { useState } from 'react';
import { KeyRound, Save } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/ui/Alert';
import { PrimaryButton } from '../components/ui/ActionBar';
import { Field, FileInput, Input } from '../components/ui/FormControls';
import { ModuleTab, ModuleTabs } from '../components/ui/ModuleTabs';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { DataInspector } from '../components/DataInspector';
import { Avatar } from '../components/Avatar';
import { formatRole, formatValue, joinText } from '../utils/format';

export function ProfilePage() {
  const { token, profile, refreshProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    names: profile?.names || '',
    lastNames: profile?.lastNames || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileFile, setProfileFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState('summary');

  async function updateProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('data', new Blob([JSON.stringify(profileForm)], { type: 'application/json' }));

      if (profileFile) {
        formData.append('file', profileFile);
      }

      await apiRequest('/api/account/me', {
        method: 'PUT',
        token,
        body: formData,
      });
      await refreshProfile();
      setMessage('Perfil actualizado');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await apiRequest('/api/account/me/password', {
        method: 'PATCH',
        token,
        body: passwordForm,
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      await refreshProfile();
      setMessage('Contraseña actualizada');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Cuenta"
        title={joinText(profile?.names, profile?.lastNames) || profile?.username || 'Perfil'}
        description="Administra tus datos personales y tu contraseña."
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <SectionCard>
        <ModuleTabs>
          {[
            ['summary', 'Resumen'],
            ['profile', 'Datos personales'],
            ['password', 'Contraseña'],
            ['detail', 'Detalle'],
          ].map(([id, label]) => (
            <ModuleTab
              active={activeView === id}
              key={id}
              onClick={() => setActiveView(id)}
            >
              {label}
            </ModuleTab>
          ))}
        </ModuleTabs>
      </SectionCard>

      {activeView === 'summary' && (
        <SectionCard>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar profile={profile} size="lg" token={token} />
              <div>
                <p className="text-xl font-bold text-[#20282d] dark:text-slate-50">
                  {joinText(profile?.names, profile?.lastNames) || profile?.username}
                </p>
                <p className="text-sm text-muted">{profile?.institutionalEmail || 'Sin correo registrado'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(profile?.roles || []).map((role) => (
                    <span
                      className="inline-flex items-center rounded-full border border-[#529914]/30 bg-accent-soft px-2.5 py-1 text-xs font-extrabold leading-none text-accent-strong dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      key={role}
                    >
                      {formatRole(role)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <ProfileMetric label="Ciclo" value={profile?.academicCycle} />
              <ProfileMetric label="Institucion" value={profile?.institution} />
              <ProfileMetric label="Estado" value={profile?.enabled ? 'Activo' : 'Inactivo'} />
              <ProfileMetric label="Actualizado" value={formatValue(profile?.updatedAt, 'updatedAt')} />
            </div>
          </div>
        </SectionCard>
      )}

      {activeView === 'profile' && (
        <SectionCard title="Datos personales">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={updateProfile}>
            <Field label="Nombres">
              <Input
                value={profileForm.names}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, names: event.target.value }))
                }
              />
            </Field>
            <Field label="Apellidos">
              <Input
                value={profileForm.lastNames}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, lastNames: event.target.value }))
                }
              />
            </Field>
            <Field label="Telefono">
              <Input
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </Field>
            <Field label="Direccion">
              <Input
                value={profileForm.address}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </Field>
            <Field className="sm:col-span-2" label="Imagen">
              <FileInput
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setProfileFile(event.target.files?.[0] || null)}
              />
            </Field>
            <div className="sm:col-span-2">
              <PrimaryButton icon={Save} loading={saving} type="submit">Guardar perfil</PrimaryButton>
            </div>
          </form>
        </SectionCard>
      )}

      {activeView === 'password' && (
        <SectionCard title="Cambiar contraseña">
          <form className="space-y-4" onSubmit={changePassword}>
            <div className='grid lg:grid-cols-2 grid-cols-1 gap-3'>
        <Field label="Actual">
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
                required
              />
            </Field>
            <Field label="Nueva">
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
                required
              />
            </Field>
            <Field label="Confirmar">
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                required
              />
            </Field>
            </div>
            
            <PrimaryButton icon={KeyRound} loading={saving} type="submit">Actualizar</PrimaryButton>
          </form>
        </SectionCard>
      )}

      {activeView === 'detail' && (
        <SectionCard title="Detalle de cuenta">
          <DataInspector data={profile} />
        </SectionCard>
      )}
    </>
  );
}

function ProfileMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-[#c8d2cd] bg-[#eef3f2] px-3 py-2 dark:border-slate-700 dark:bg-surface-soft">
      <p className="text-xs font-bold uppercase text-muted">{label}</p>
      <p className="mt-1 font-semibold text-[#20282d] dark:text-slate-50">{value || '-'}</p>
    </div>
  );
}
