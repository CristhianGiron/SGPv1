import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Building2, GraduationCap, KeyRound, Layers, Save, UsersRound } from 'lucide-react';
import { apiRequest, toQuery, unwrapPage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/ui/Alert';
import { PrimaryButton } from '../components/ui/ActionBar';
import { Field, FileInput, Input, PasswordInput } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { ModuleTab, ModuleTabs } from '../components/ui/ModuleTabs';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { DataInspector } from '../components/DataInspector';
import { Avatar } from '../components/Avatar';
import { formatRole, joinText } from '../utils/format';

const visualVariants = ['a', 'b', 'c', 'd', 'e'];

export function ProfilePage() {
  const { token, profile, refreshProfile } = useAuth();
  const roles = useMemo(() => profile?.roles || [], [profile?.roles]);
  const isStudent = roles.includes('ROLE_ESTUDIANTE');
  const isPracticeTutor = roles.includes('ROLE_TUTOR_PRACTICAS');
  const isInstitutionalTutor = roles.includes('ROLE_TUTOR_INSTITUCIONAL');
  const isPracticeDirector = roles.includes('ROLE_DIRECTOR_PRACTICAS');
  const isAdmin = roles.includes('ROLE_ADMIN');
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
  const [membership, setMembership] = useState({ enrollments: [], courses: [] });
  const [membershipError, setMembershipError] = useState('');
  const currentEnrollment = useMemo(
    () => resolveCurrentEnrollment(membership.enrollments),
    [membership.enrollments]
  );

  useEffect(() => {
    let active = true;

    async function loadMembership() {
      if (!token || !profile) {
        return;
      }

      setMembershipError('');

      try {
        if (isStudent) {
          const payload = await apiRequest('/api/enrollments/me', { token });

          if (active) {
            setMembership({ enrollments: unwrapPage(payload), courses: [] });
          }

          return;
        }

        if (isPracticeTutor) {
          const payload = await apiRequest(`/api/courses/search${toQuery({
            active: true,
            practiceTutor: profile.username,
            size: 200,
          })}`, { token });

          if (active) {
            setMembership({ enrollments: [], courses: unwrapPage(payload) });
          }

          return;
        }

        if (isInstitutionalTutor || isPracticeDirector || isAdmin) {
          const payload = await apiRequest('/api/enrollments/managed', { token });

          if (active) {
            setMembership({ enrollments: unwrapPage(payload), courses: [] });
          }

          return;
        }

        if (active) {
          setMembership({ enrollments: [], courses: [] });
        }
      } catch (requestError) {
        if (active) {
          setMembershipError(requestError.message);
          setMembership({ enrollments: [], courses: [] });
        }
      }
    }

    loadMembership();

    return () => {
      active = false;
    };
  }, [isAdmin, isInstitutionalTutor, isPracticeDirector, isPracticeTutor, isStudent, profile, token]);

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
      setActiveView('summary');
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
      setActiveView('summary');
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

      {activeView !== 'detail' && (
        <>
          <SectionCard>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar profile={profile} size="lg" token={token} />
                <div>
                  <p className="text-xl font-medium text-heading dark:text-heading">
                    {joinText(profile?.names, profile?.lastNames) || profile?.username}
                  </p>
                  <p className="text-sm text-body">{profile?.institutionalEmail || 'Sin correo registrado'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <span
                        className="inline-flex items-center rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1 text-xs font-semibold leading-none text-accent-strong dark:border-line dark:bg-surface-soft dark:text-ink"
                        key={role}
                      >
                        {formatRole(role)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <ProfileMetric icon={Building2} index={0} label="Facultad" value={profile?.faculty} />
                <ProfileMetric icon={GraduationCap} index={1} label="Carrera" value={profile?.career} />
                <ProfileMetric icon={BookOpen} index={2} label={profile?.academicCycle ? 'Ciclo' : 'Grado'} value={profile?.academicCycle || profile?.grade} />
                <ProfileMetric icon={Building2} index={3} label="Institucion" value={profile?.academicInstitution || profile?.institution} />
              </div>
            </div>
          </SectionCard>

          <MembershipSummary
            courses={membership.courses}
            currentEnrollment={currentEnrollment}
            enrollments={membership.enrollments}
            error={membershipError}
            profile={profile}
            roles={roles}
          />
        </>
      )}

      <Modal
        description="Actualiza tus datos de contacto y tu imagen de perfil."
        maxWidth="max-w-3xl"
        onClose={() => setActiveView('summary')}
        open={activeView === 'profile'}
        title="Datos personales"
      >
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
      </Modal>

      <Modal
        description="Actualiza tu contraseña de acceso."
        maxWidth="max-w-2xl"
        onClose={() => setActiveView('summary')}
        open={activeView === 'password'}
        title="Cambiar contraseña"
      >
          <form className="space-y-4" onSubmit={changePassword}>
            <div className='grid lg:grid-cols-2 grid-cols-1 gap-3'>
        <Field label="Actual">
              <PasswordInput
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
              <PasswordInput
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
              <PasswordInput
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
      </Modal>

      {activeView === 'detail' && (
        <SectionCard title="Detalle de cuenta">
          <DataInspector data={profile} />
        </SectionCard>
      )}
    </>
  );
}

function ProfileMetric({ icon: Icon, index = 0, label, value }) {
  const variant = visualVariants[index % visualVariants.length];

  return (
    <div className={`sgp-visual-card sgp-visual-card-${variant} min-w-[9rem] rounded-lg border px-3 py-3 shadow-card`}>
      <div className="relative flex items-start gap-3">
        {Icon && (
          <span className="sgp-visual-card-icon grid h-8 w-8 flex-none place-items-center rounded-full border-4 border-panel shadow-card">
            <Icon aria-hidden="true" size={15} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[0.72rem] font-medium uppercase leading-tight">{label}</p>
          <p className="mt-1 break-words text-sm font-medium text-heading dark:text-heading">{value || '-'}</p>
        </div>
      </div>
    </div>
  );
}

function MembershipSummary({ courses, currentEnrollment, enrollments, error, profile, roles }) {
  const isStudent = roles.includes('ROLE_ESTUDIANTE');
  const isPracticeTutor = roles.includes('ROLE_TUTOR_PRACTICAS');
  const isInstitutionalTutor = roles.includes('ROLE_TUTOR_INSTITUCIONAL');
  const isInstitutionDirector = roles.includes('ROLE_DIRECTORA_INSTITUCION');
  const isPracticeDirector = roles.includes('ROLE_DIRECTOR_PRACTICAS');
  const isAdmin = roles.includes('ROLE_ADMIN');

  if (error) {
    return (
      <SectionCard title="Pertenencia institucional">
        <Alert tone="error">{error}</Alert>
      </SectionCard>
    );
  }

  if (isStudent) {
    return (
      <SectionCard title="Mi pertenencia academica y de practica">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ProfileInfo icon={GraduationCap} index={0} label="Facultad" value={profile?.faculty} />
          <ProfileInfo icon={GraduationCap} index={1} label="Carrera" value={profile?.career} />
          <ProfileInfo icon={BookOpen} index={2} label="Asignatura" value={currentEnrollment?.subjectName} />
          <ProfileInfo icon={BookOpen} index={3} label="Paralelo" value={currentEnrollment?.courseName} />
          <ProfileInfo icon={Layers} index={4} label="Grupo" value={currentEnrollment?.groupName} />
          <ProfileInfo icon={Building2} index={0} label="Institucion de practica" value={currentEnrollment?.educationalInstitutionName} />
          <ProfileInfo icon={UsersRound} index={1} label="Tutor de practicas" value={currentEnrollment?.practiceTutor} />
          <ProfileInfo icon={UsersRound} index={2} label="Tutor institucional" value={currentEnrollment?.institutionalTutor} />
          <ProfileInfo index={3} label="Estado de inscripcion" value={formatEnrollmentStatus(currentEnrollment?.status)} />
        </div>
      </SectionCard>
    );
  }

  if (isPracticeTutor) {
    return (
      <SectionCard title="Paralelos asignados">
        {courses.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {courses.slice(0, 6).map((course, index) => (
              <ProfileInfo
                icon={BookOpen}
                index={index}
                key={course.id}
                label={course.subject || 'Paralelo'}
                value={course.name}
                meta={course.code}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-body">Aun no tienes paralelos asignados.</p>
        )}
      </SectionCard>
    );
  }

  if (isInstitutionalTutor || isInstitutionDirector || isPracticeDirector || isAdmin) {
    return (
      <SectionCard title="Alcance de practica">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ProfileInfo icon={Building2} index={0} label="Institucion vinculada" value={profile?.institution} />
          <ProfileInfo icon={UsersRound} index={1} label="Estudiantes relacionados" value={enrollments.length || null} />
          <ProfileInfo icon={BookOpen} index={2} label="Paralelos relacionados" value={countUnique(enrollments, 'courseId') || null} />
          <ProfileInfo icon={Layers} index={3} label="Grupos relacionados" value={countUnique(enrollments, 'groupId') || null} />
        </div>
      </SectionCard>
    );
  }

  return null;
}

function ProfileInfo({ icon: Icon, index = 0, label, meta, value }) {
  const variant = visualVariants[index % visualVariants.length];

  return (
    <div className={`sgp-visual-card sgp-visual-card-${variant} min-w-0 rounded-lg border p-3 shadow-card`}>
      <div className="relative flex items-start gap-3">
        {Icon && (
          <span className="sgp-visual-card-icon grid h-9 w-9 flex-none place-items-center rounded-full border-4 border-panel shadow-card">
            <Icon aria-hidden="true" size={16} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase leading-tight">{label}</p>
          <p className="mt-2 break-words text-sm font-medium text-heading dark:text-heading">{value || '-'}</p>
          {meta && <p className="mt-1 text-xs font-medium text-body">{meta}</p>}
        </div>
      </div>
    </div>
  );
}

function resolveCurrentEnrollment(enrollments) {
  const items = enrollments || [];
  const ranked = [...items].sort((left, right) => enrollmentScore(right) - enrollmentScore(left));

  return ranked[0]
    || null;
}

function enrollmentScore(enrollment) {
  if (!enrollment) {
    return 0;
  }

  const statusScore = enrollment.status === 'APPROVED'
    ? 100
    : enrollment.status === 'PENDING'
      ? 40
      : enrollment.status === 'COMPLETED'
        ? 30
      : 10;
  const completenessScore = [
    enrollment.groupName,
    enrollment.educationalInstitutionName,
    enrollment.practiceTutor,
    enrollment.institutionalTutor,
  ].filter(Boolean).length * 10;
  const dateScore = enrollment.enrolledAt ? new Date(enrollment.enrolledAt).getTime() / 1000000000000 : 0;

  return statusScore + completenessScore + dateScore;
}

function formatEnrollmentStatus(status) {
  const labels = {
    APPROVED: 'Aprobada',
    COMPLETED: 'Concluida',
    PENDING: 'Pendiente',
    REJECTED: 'Rechazada',
  };

  return labels[status] || status;
}

function countUnique(rows, key) {
  return new Set((rows || []).map((row) => row[key]).filter(Boolean)).size;
}
