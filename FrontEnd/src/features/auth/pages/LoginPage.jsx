/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          LoginPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Presenta el acceso institucional y envía las credenciales al flujo de autenticación del sistema.
 */

import { InstitutionalAuthLayout } from '../components/InstitutionalAuthLayout';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useInstitutionalContext } from '../../../contexts/InstitutionalContext';
import { useAuth } from '../context/AuthContext';
import { Field, Input, PasswordInput } from '../../../components/ui/FormControls';
import { PrimaryButton } from '../../../components/ui/ActionBar';
import { setHashRoute } from '../../../utils/routes';

export function LoginPage() {
  const institution = useInstitutionalContext();
  const { login, sessionNotice } = useAuth();
  const [form, setForm] = useState({ username:'', password:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [capsLock, setCapsLock] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await login(form);
    } catch (requestError) {
      setError(requestError?.message || 'No se pudo iniciar sesión. Revisa tu usuario y contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return <InstitutionalAuthLayout titleId="login-title" skipTarget="login-username" skipLabel="Ir al formulario de acceso"
    helpTitle="Iniciar sesión"
    helpDescription={`Accede al Sistema de Gestión de Prácticas de ${institution.universityName} con el usuario o correo registrado y tu contraseña. Si no recuerdas tus datos de acceso, solicita ayuda a la administración del sistema. El registro público está disponible para estudiantes; las cuentas del personal las habilita administración.`}>
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card-heading">
          <h1 id="login-title">Iniciar sesión</h1>
        </div>
        {sessionNotice && <p role="status" className="login-error">{sessionNotice}</p>}
        <form onSubmit={handleSubmit} aria-label="Acceso al sistema" aria-busy={loading || undefined} aria-describedby={error ? 'login-error' : undefined}>
          <fieldset disabled={loading} className="login-fields">
            <Field label="Usuario o correo">
              <Input id="login-username" name="username" enterKeyHint="go" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Tu usuario o correo registrado" value={form.username} onChange={event=>setForm(current=>({...current,username:event.target.value}))} required />
            </Field>
            <Field label="Contraseña">
              <PasswordInput id="login-password" name="password" enterKeyHint="go" autoComplete="current-password" placeholder="Tu contraseña" value={form.password} onChange={event=>setForm(current=>({...current,password:event.target.value}))} onKeyUp={event=>setCapsLock(Boolean(event.getModifierState?.('CapsLock')))} onBlur={()=>setCapsLock(false)} aria-describedby={capsLock ? 'login-caps-lock' : undefined} required />
            </Field>
            {capsLock && <p id="login-caps-lock" className="login-caps-lock" role="status">Bloq Mayús está activado.</p>}
            {error && <p id="login-error" className="login-error" role="alert">{error}</p>}
            <PrimaryButton className="login-submit" icon={ArrowRight} loading={loading} type="submit" style={{'--action-ink':'var(--login-button)','--action-color':'var(--login-button)','--action-on-solid':'#fff'}}>{loading ? 'Ingresando…' : 'Entrar al sistema'}</PrimaryButton>
          </fieldset>
        </form>
        <div className="login-registration">
          <p>¿Aún no tienes una cuenta?</p>
          <button type="button" disabled={loading} onClick={()=>setHashRoute('register')}>Registrar estudiante <ArrowRight aria-hidden="true" size={14} /></button>
        </div>
      </section>
  </InstitutionalAuthLayout>;
}
