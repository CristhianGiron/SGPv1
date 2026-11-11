/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          PracticeOfferingsPanel.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Permite crear prácticas del paralelo e inscribir a los estudiantes de su listado académico.
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiRequest, unwrapPage } from '../api/client';
import { SectionCard } from './ui/SectionCard';
import { Field, Input, Select } from './ui/FormControls';
import { PrimaryButton, SecondaryButton } from './ui/ActionBar';
import { Alert } from './ui/Alert';
import { useConfirm } from './ui/ConfirmDialog';

export function PracticeOfferingsPanel({ courseId, canCreate, onAssigned }) {
  const { token } = useAuth();
  const confirm = useConfirm();
  const [practices, setPractices] = useState([]);
  const [roster, setRoster] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [practiceId, setPracticeId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [form, setForm] = useState({ name: '', capacity: '', startDate: '', endDate: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const base = `/api/courses/${courseId}`;
  const load = useCallback(async () => {
    const [p, r, e, g] = await Promise.all([
      apiRequest(`${base}/practice-offerings`, { token }), apiRequest(`${base}/practice-roster`, { token }),
      apiRequest(`${base}/enrollments`, { token }), apiRequest(`${base}/groups`, { token }),
    ]);
    return { p: unwrapPage(p), r: unwrapPage(r), e: unwrapPage(e), g: unwrapPage(g) };
  }, [base, token]);
  const apply = useCallback(({ p, r, e, g }) => { setPractices(p); setRoster(r); setEnrollments(e); setGroups(g.filter(row => row.active && !row.deleted)); }, []);
  useEffect(() => {
    let active = true;
    setBusy(true);
    load().then(data => { if (active) apply(data); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [load, apply]);
  const selected = practices.find(p => String(p.id) === String(practiceId));
  async function run(action, success) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); apply(await load()); setMessage(success); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function create(e) {
    e.preventDefault();
    await run(async () => {
      const created = await apiRequest(`${base}/practice-offerings`, { token, method: 'POST', body: { name: form.name, capacity: Number(form.capacity), startDate: form.startDate || null, endDate: form.endDate || null } });
      setPracticeId(String(created.id)); setForm({ name: '', capacity: '', startDate: '', endDate: '' });
    }, 'Práctica creada. Selecciona los estudiantes del paralelo para habilitarles el trabajo.');
  }
  async function assign(student) {
    if (!selected || !await confirm({ title: 'Asignar práctica al estudiante', description: 'La práctica quedará aprobada y habilitada para trabajar, con los tutores del paralelo y del grupo seleccionado.', details: `${student.username} · ${selected.name}`, confirmLabel: 'Asignar práctica' })) return;
    await run(async () => {
      await apiRequest(`/api/practice-offerings/${selected.id}/students`, { token, method: 'POST', body: { studentId: student.id, groupId: groupId ? Number(groupId) : null } });
      if (onAssigned) await onAssigned();
    }, 'Estudiante inscrito. Ya puede trabajar en su práctica.');
  }
  return <SectionCard title="Prácticas del paralelo" description="Crea las prácticas e inscribe a los estudiantes de este listado académico. El estudiante recibe su práctica lista para trabajar.">
    {error && <Alert tone="error">{error}</Alert>}{message && <Alert tone="success">{message}</Alert>}
    {canCreate && <form onSubmit={create} className="mb-5 grid items-end gap-3 md:grid-cols-2">
      <Field label="Nombre de la práctica"><Input required maxLength={160} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Cupos de la práctica"><Input required type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></Field>
      <Field label="Inicio de la práctica"><Input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
      <Field label="Fin de la práctica"><Input type="datetime-local" min={form.startDate || undefined} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></Field>
      <PrimaryButton type="submit" disabled={busy}>Crear práctica</PrimaryButton>
    </form>}
    <div className="grid items-end gap-3 md:grid-cols-2">
      <Field label="Práctica para asignar"><Select value={practiceId} disabled={busy} onChange={e => { setPracticeId(e.target.value); setMessage(''); }}><option value="">Selecciona una práctica</option>{practices.map(p => <option key={p.id} value={p.id}>{p.name} ({p.assignedStudents}/{p.capacity})</option>)}</Select></Field>
      <Field label="Grupo para los estudiantes"><Select value={groupId} disabled={busy} onChange={e => setGroupId(e.target.value)}><option value="">Usar tutor institucional del paralelo</option>{groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field>
    </div>
    {selected && <div className="mt-4 space-y-3">
      <p className="text-sm text-body">{selected.enrollmentOpen ? 'Inscripciones abiertas en esta práctica.' : 'Inscripciones cerradas en esta práctica.'} El cierre del paralelo también impide nuevas inscripciones.</p>
      <SecondaryButton type="button" disabled={busy} onClick={() => run(() => apiRequest(`/api/practice-offerings/${selected.id}/enrollment?open=${!selected.enrollmentOpen}`, { token, method: 'PATCH' }), 'Período de inscripciones actualizado.')}>{selected.enrollmentOpen ? 'Cerrar inscripciones de la práctica' : 'Abrir inscripciones de la práctica'}</SecondaryButton>
      {!roster.length && <p className="text-sm text-body">Dirección o administración debe asignar primero los estudiantes al paralelo.</p>}
      <ul className="divide-y divide-line">{roster.map(s => {
        const assigned = enrollments.some(e => String(e.practiceId) === String(selected.id) && e.student === s.username);
        return <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="text-sm text-heading">{[s.names, s.lastNames].filter(Boolean).join(' ') || s.username} ({s.username})</span><SecondaryButton type="button" disabled={busy || assigned || !selected.enrollmentOpen} onClick={() => assign(s)} aria-label={`${assigned ? 'Inscrito' : 'Inscribir'} ${s.username}`}>{assigned ? 'Ya inscrito' : 'Inscribir y habilitar'}</SecondaryButton></li>;
      })}</ul>
    </div>}
  </SectionCard>;
}
