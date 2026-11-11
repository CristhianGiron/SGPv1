/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          pagination.js
 * @fecha         2026-11-09 11:08:16
 * @nota          Proporciona las funciones de pagination utilizadas por la interfaz del SGP.
 */

// Lists with local filtering must include every server page.
export async function fetchAllPages(request, path, options) {
  let payload = await request(path, options);
  if (Array.isArray(payload)) return payload;
  if (!Array.isArray(payload?.content)) return [];
  const rows = [...payload.content];
  const ids = new Set(rows.filter(row => row.id != null).map(row => String(row.id)));
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  let page = Number(payload.number ?? params.get('page') ?? 0);
  while (payload.last === false || page + 1 < Number(payload.totalPages ?? 1)) {
    params.set('page', String(++page));
    const next = await request(`${pathname}?${params}`, options);
    if (!Array.isArray(next?.content) || (next.number != null && Number(next.number) !== page)
        || (next.content.length === 0 && next.last === false)
        || next.content.some(row => row.id != null && ids.has(String(row.id)))) {
      throw new Error('No se pudo completar la lista. Intenta cargarla nuevamente.');
    }
    rows.push(...next.content);
    next.content.forEach(row => { if (row.id != null) ids.add(String(row.id)); });
    payload = next;
  }
  return rows;
}
