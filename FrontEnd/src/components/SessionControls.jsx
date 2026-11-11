/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          SessionControls.jsx
 * @fecha         2026-11-10 21:24:04
 * @nota          Implementa el componente SessionControls de la interfaz del SGP.
 */

import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useConfirm } from './ui/ConfirmDialog';
import { SectionCard } from './ui/SectionCard';
import { SecondaryButton } from './ui/ActionBar';
import { Alert } from './ui/Alert';
export function SessionControls() {
 const { logoutAll }=useAuth();const confirm=useConfirm();const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function closeAll(){
  if(!await confirm({title:'Cerrar todas mis sesiones',description:'Se cerrará el acceso en este y otros dispositivos. Tendrás que iniciar sesión nuevamente.',confirmLabel:'Cerrar todas las sesiones',tone:'warning'}))return;
  setBusy(true);setError('');try{await logoutAll();}catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <SectionCard title="Seguridad de la sesión" description="Puedes retirar el acceso de tus sesiones en todos los dispositivos.">
  {error&&<Alert tone="error">{error}</Alert>}<SecondaryButton type="button" disabled={busy} onClick={closeAll}>Cerrar todas mis sesiones</SecondaryButton>
 </SectionCard>;
}
