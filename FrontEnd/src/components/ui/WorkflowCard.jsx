/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          WorkflowCard.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente WorkflowCard de la interfaz del SGP.
 */

import { ArrowRight, FolderOpen } from 'lucide-react';

export function WorkflowCard({ title, description, onClick, Icon = FolderOpen, area = 'practice' }) {
  return (
    <button type="button" onClick={onClick} data-area={area} className="sgp-workflow-card text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">
      <span className="sgp-workflow-icon"><Icon size={23} aria-hidden="true" /></span>
      <span className="sgp-workflow-copy">
        <span className="block font-semibold leading-snug text-heading">{title}</span>
        <span className="mt-2 block text-sm leading-6 text-body">{description}</span>
      </span>
      <span className="sgp-workflow-arrow" aria-hidden="true"><ArrowRight size={17} /></span>
    </button>
  );
}
