/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          EntityImage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Implementa el componente EntityImage de la interfaz del SGP.
 */

import { useEffect, useId, useState } from 'react';
import { ImagePlus, ImageOff, GraduationCap } from 'lucide-react';
import { apiBlob } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { SecondaryButton } from './ActionBar';

export function entityImagePayload(data, image) {
  if (!image) return data;
  const body = new FormData();
  body.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  body.append('image', image);
  return body;
}
export function imageValidation(file) {
  if (!file) return '';
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Selecciona una imagen JPG o PNG.';
  if (file.size > 4 * 1024 * 1024) return 'La imagen no puede superar 4 MB.';
  if (!file.size) return 'La imagen está vacía.';
  return '';
}
export function EntityImage({ path, alt = '', className = '', logo = false, fallback = true }) {
  const { token } = useAuth();
  const [image, setImage] = useState({ path: '', token: '', url: '' });
  useEffect(() => {
    let active = true, objectUrl;
    if (path && token) apiBlob(path, token).then(blob => {
      objectUrl = URL.createObjectURL(blob);
      if (active) setImage({ path, token, url: objectUrl }); else URL.revokeObjectURL(objectUrl);
    }).catch(() => { if (active) setImage({ path, token, url: '' }); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path, token]);
  const url = image.path === path && image.token === token ? image.url : '';
  if (url) return <img src={url} alt={alt} className={`${className} ${logo ? 'object-contain' : 'object-cover'}`} onError={() => setImage({ path, token, url: '' })} />;
  if (!fallback) return null;
  return <div aria-hidden="true" className={`${className} flex items-center justify-center bg-info-soft text-info-strong`}><GraduationCap size={logo ? 24 : 36} /></div>;
}
export function EntityImagePicker({ label = 'Portada opcional', file, onChange, currentPath, logo = false, helpText, contain = false }) {
  const id = useId();
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <section className="space-y-3 rounded-lg border border-dashed border-line bg-panel-soft p-4">
    <label htmlFor={id} className="block text-sm font-semibold text-heading">{label}</label>
    <p id={`${id}-help`} className="text-xs leading-5 text-body">{helpText || `${logo ? 'Identifica la institución con su logotipo.' : 'La imagen aparecerá en las tarjetas y el encabezado de estas prácticas.'} JPG o PNG, máximo 4 MB y 4096 px por lado. Puedes continuar sin imagen.`}</p>
    {preview ? <img src={preview} alt="Vista previa de la imagen elegida" className={`rounded-lg bg-panel ${contain ? 'h-36 w-full object-contain' : logo ? 'h-24 w-24 object-contain' : 'h-36 w-full object-cover'}`} /> : currentPath ? <EntityImage path={currentPath} logo={logo || contain} alt="Imagen actual" className={logo ? 'h-24 w-24 rounded-lg bg-panel' : 'h-36 w-full rounded-lg'} /> : <div aria-hidden="true" className="flex items-center gap-2 text-muted"><ImagePlus size={20} /><span className="text-xs">Sin imagen seleccionada</span></div>}
    <input id={id} type="file" accept="image/jpeg,image/png" aria-describedby={`${id}-help`} className="block w-full min-w-0 text-sm text-body file:mr-3 file:rounded-md file:border file:border-line file:bg-panel file:px-3 file:py-2 file:text-heading" onChange={event => {
      const next = event.target.files?.[0] || null;const validation = imageValidation(next);setError(validation);
      onChange(validation ? null : next);if (validation) event.target.value = '';
    }} />
    {error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}
    {file && <SecondaryButton icon={ImageOff} onClick={() => { onChange(null);setError('');const input = document.getElementById(id);if (input) input.value = ''; }}>Quitar selección</SecondaryButton>}
  </section>;
}
