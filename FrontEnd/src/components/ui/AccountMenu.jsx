/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          AccountMenu.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente AccountMenu de la interfaz del SGP.
 */

import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, LogOut, UserRound, X } from 'lucide-react';
import { Avatar } from '../Avatar';
import { AppearancePreferences } from './AppearancePreferences';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { formatRole, joinText } from '../../utils/format';
import { getPortalRoot } from '../../utils/portal';
import './AccountMenu.css';

export function AccountMenu({profile,roles=[],token,open,onOpen,onClose,onProfile,onLogout}){
  const dialog=useRef(null),id=useId();const name=joinText(profile?.names,profile?.lastNames)||profile?.username||'Usuario';
  useDialogFocus(open,dialog,onClose);
  return <>
    <button type="button" className="sgp-account-trigger" aria-label="Menú de cuenta" aria-expanded={open} aria-haspopup="dialog" aria-controls={`${id}-account`} onClick={open?onClose:onOpen}>
      <Avatar profile={profile} token={token} size="sm" className="!h-8 !w-8 !text-xs" />
      <span className="sgp-account-trigger-copy"><span>{name}</span><span>{profile?.institution||profile?.academicCycle||'Mi cuenta'}</span></span><ChevronDown size={15} aria-hidden="true" className="sgp-account-chevron" />
    </button>
    {open&&createPortal(<>
      <div className="sgp-account-backdrop" aria-hidden="true" />
      <div id={`${id}-account`} ref={dialog} role="dialog" aria-modal="true" aria-label="Cuenta y preferencias" tabIndex={-1} className="sgp-account-dialog" style={{zIndex:100005}} onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
        <section className="sgp-account-panel">
          <header className="sgp-account-header"><Avatar profile={profile} token={token} size="md" /><div className="sgp-account-identity"><p className="sgp-account-name">{name}</p><p className="sgp-account-email">{profile?.institutionalEmail||profile?.username||'Cuenta del sistema'}</p></div><button type="button" className="sgp-account-close" aria-label="Cerrar menú de cuenta" onClick={onClose}><X size={18} aria-hidden="true" /></button></header>
          {roles.length>0&&<div className="sgp-account-roles" aria-label="Roles de la cuenta">{roles.map(role=><span key={role}>{formatRole(role)}</span>)}</div>}
          <div className="sgp-account-body"><button type="button" className="sgp-account-profile" onClick={()=>{onClose();onProfile();}}><UserRound size={19} aria-hidden="true" /><span><span>Mi perfil</span><span>Consulta y actualiza tus datos</span></span><ChevronRight size={17} aria-hidden="true" /></button><AppearancePreferences /></div>
          <footer className="sgp-account-footer"><button type="button" onClick={()=>{onClose();onLogout();}}><LogOut size={18} aria-hidden="true" />Cerrar sesión</button></footer>
        </section>
      </div>
    </>,getPortalRoot())}
  </>;
}
