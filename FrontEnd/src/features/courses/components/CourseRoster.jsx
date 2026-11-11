/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CourseRoster.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Permite al personal autorizado gestionar la pertenencia académica de estudiantes al paralelo.
 */

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../../api/client';
import { useAuth } from '../../auth/context/AuthContext';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { EntitySelect } from '../../../components/ui/EntitySelect';
import { Field } from '../../../components/ui/FormControls';
import { SectionCard } from '../../../components/ui/SectionCard';
import { Alert } from '../../../components/ui/Alert';
import { PrimaryButton, SecondaryButton } from '../../../components/ui/ActionBar';
import { DataTable } from '../../../components/ui/DataTable';

export function CourseRoster({ courseId, courseName }) {
  const { token } = useAuth();
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const base = `/api/courses/${courseId}`;
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setRows([]);setStudentId('');setMessage('');
    apiRequest(`${base}/students`, { token }).then(payload => {
      if (active) setRows(Array.isArray(payload) ? payload : []);
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [base, token, revision]);
  const label = useCallback(row => [row.names, row.lastNames].filter(Boolean).join(' ') + ` (${row.username})`, []);
  async function change(id, remove = false) {
    if (remove && !await confirm({ title: 'Retirar pertenencia al paralelo', description: 'El personal académico dejará de poder asignarle nuevas prácticas de este paralelo. Sus prácticas existentes y su historial se conservarán.', details: courseName, confirmLabel: 'Retirar pertenencia', tone: 'warning' })) return;
    setLoading(true);setError('');setMessage('');
    try {
      await apiRequest(`${base}/students/${id}`, { token, method: remove ? 'DELETE' : 'PUT' });
      const payload = await apiRequest(`${base}/students`, { token });setRows(Array.isArray(payload) ? payload : []);setStudentId('');
      setMessage(remove ? 'Pertenencia retirada' : 'Estudiante asignado al paralelo');
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  }
  return <SectionCard title="Estudiantes que pertenecen al paralelo" description="Define el listado académico antes de asignar prácticas. Cada estudiante puede pertenecer a un solo paralelo por ciclo y a varios ciclos de su carrera.">
    {error && <Alert tone="error">{error}</Alert>}{message && <Alert tone="success">{message}</Alert>}
    <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
      <Field label="Estudiante de la carrera"><EntitySelect path={`${base}/student-candidates`} value={studentId} onChange={setStudentId} getOptionLabel={label} placeholder="Seleccionar estudiante" /></Field>
      <PrimaryButton type="button" disabled={loading || !studentId} onClick={() => change(studentId)}>Asignar al paralelo</PrimaryButton>
      <SecondaryButton type="button" disabled={loading} onClick={() => setRevision(value => value + 1)}>Actualizar pertenencias</SecondaryButton>
    </div>
    <DataTable loading={loading} rows={rows} emptyText="Todavía no se han asignado estudiantes a este paralelo." columns={[
      { key: 'username', header: 'Usuario' },
      { key: 'name', header: 'Estudiante', render: label },
      { key: 'active', header: 'Pertenencia', render: row => row.active ? 'Asignado' : 'Retirada' },
      { key: 'actions', header: 'Acciones', render: row => <SecondaryButton type="button" disabled={loading} onClick={() => change(row.id, row.active)}>{row.active ? 'Retirar pertenencia' : 'Restaurar pertenencia'}</SecondaryButton> },
    ]} />
  </SectionCard>;
}
