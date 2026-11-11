/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          DocumentReadiness.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente DocumentReadiness de la interfaz del SGP.
 */



export function DocumentDraftStatus({ editable = false, readiness }) {
  if (!readiness) return null;
  if (editable) return <details className="rounded-lg border border-line bg-panel-soft px-3 py-2 text-sm text-body"><summary className="min-h-8 cursor-pointer font-medium text-heading">{readiness.complete ? 'Apartados completos' : `Borrador: ${readiness.completed} de ${readiness.total} apartados completos`}</summary><p className="mt-2">Puedes guardar el avance y completar lo pendiente después.</p>{readiness.missing.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{readiness.missing.map(item => <li key={item}>{item}</li>)}</ul>}<p className="mt-2">Los datos precargados provienen de la inscripción y la institución. Si falta alguno, solicita su actualización a tutoría o administración.</p></details>;

  if (readiness.complete) return <div className="rounded-xl border border-success/30 bg-success-soft p-4 text-sm text-success-strong">Documento completo según las reglas actuales. Puedes enviarlo a revisión o guardar cambios.</div>;
  return <div className={`rounded-xl border p-4 text-sm ${editable ? 'border-info/30 bg-info-soft text-info-strong' : 'border-warning/30 bg-warning-soft text-warning-strong'}`}>
    <p className="font-semibold">Borrador parcial: {readiness.completed} de {readiness.total} apartados completos.</p>
    <p className="mt-1">Puedes guardar el avance y completar lo pendiente después.</p>
    <details className="mt-2"><summary className="cursor-pointer font-medium">Consultar apartados pendientes ({readiness.missing.length})</summary>
      <ul className="mt-3 list-disc space-y-1 pl-5">{readiness.missing.map(item => <li key={item}>{item}</li>)}</ul>
      <p className="mt-3 text-xs">Los datos precargados provienen de la inscripción y de la institución. Si falta alguno, solicita su actualización a tutoría o administración.</p>
    </details>
  </div>;
}

const DOCUMENT_READINESS_RULES = {
  "activity-plans": {
    fields: [
      ["studentFullName", "datos del estudiante"],
      ["curricularOrganizationUnit", "unidad de organización curricular"],
      ["subjectDenomination", "denominacion de la asignatura"],
      ["integrativeKnowledgeProject", "proyecto integrador de saberes"],
      ["practiceType", "tipo de práctica"],
      ["educationalInstitutionName", "institución educativa"],
      ["teacherCount", "número de docentes"],
      ["studentCount", "número de estudiantes"],
      ["mission", "mision institucional"],
      ["vision", "vision institucional"],
      ["institutionalValues", "valores institucionales"],
      ["presentation", "presentacion"],
      ["generalObjective", "objetivo general"],
      ["specificObjective1", "objetivo específico 1"],
      ["specificObjective2", "objetivo específico 2"],
      ["specificObjective3", "objetivo específico 3"],
      ["legalResources", "recursos legales"],
      ["humanResources", "recursos humanos"],
      ["technologicalResources", "recursos tecnológicos"],
      ["physicalResources", "recursos físicos"],
    ],
    arrays: [
      {
        key: "activityWeeks",
        label: "actividades por semana",
        fields: ["weekNumber", "startDate", "endDate", "activities"],
      },
      {
        key: "scheduleWeeks",
        label: "cronograma",
        fields: ["weekNumber", "startDate", "endDate", "scheduledActivities"],
      },
    ],
  },
  "practice-reports": {
    fields: [
      ["studentFullName", "datos del estudiante"],
      ["educationalInstitutionName", "institución educativa"],
      ["presentation", "presentacion"],
      ["generalObjective", "objetivo general"],
      ["specificObjective1", "objetivo específico 1"],
      ["specificObjective2", "objetivo específico 2"],
      ["specificObjective3", "objetivo específico 3"],
      ["methodology", "metodologia"],
      ["conclusion1", "conclusión 1"],
      ["conclusion2", "conclusión 2"],
      ["conclusion3", "conclusión 3"],
      ["recommendation1", "recomendacion 1"],
      ["recommendation2", "recomendacion 2"],
      ["recommendation3", "recomendacion 3"],
    ],
    arrays: [
      {
        key: "activityWeeks",
        label: "actividades por semana",
        fields: ["weekNumber", "startDate", "endDate", "activities"],
      },
    ],
  },
  "final-reports": {
    fields: [
      ["educationalInstitutionName", "institución educativa"],
      ["studentFullName", "datos del estudiante"],
      ["antecedents", "antecedentes"],
      ["objective", "objetivo"],
    ],
    arrays: [
      {
        key: "activityWeeks",
        label: "actividades por semana",
        fields: ["weekNumber", "startDate", "endDate", "activities"],
      },
    ],
  },
  "completed-records": {
    fields: [
      ["educationalInstitutionName", "institución educativa receptora"],
      ["studentFullName", "nombre del estudiante"],
      ["studentIdentification", "cédula del estudiante"],
      ["academicPeriod", "período académico"],
      ["practiceType", "tipo de práctica"],
      ["developmentMode", "desarrollo de actividades"],
      ["deliveryDate", "fecha de entrega"],
    ],
    arrays: [
      {
        key: "entries",
        label: "actividades cumplidas",
        fields: ["activityDate", "startTime", "endTime", "developedActivities", "evidenceLink"],
      },
    ],
  },
};

export function getDocumentReadiness(moduleId, record = {}) {
  const rules = DOCUMENT_READINESS_RULES[moduleId];

  if (!rules) {
    return { complete: true, completed: 0, missing: [], total: 0 };
  }

  const missing = [];
  let total = 0;
  let completed = 0;

  (rules.fields || []).forEach(([key, label]) => {
    total += 1;

    if (hasDraftValue(record?.[key])) {
      completed += 1;
    } else {
      missing.push(label);
    }
  });

  (rules.arrays || []).forEach((rule) => {
    total += 1;

    if (hasCompleteRows(record?.[rule.key], rule.fields)) {
      completed += 1;
    } else {
      missing.push(rule.label);
    }
  });

  return {
    complete: missing.length === 0,
    completed,
    missing,
    total,
  };
}

function hasCompleteRows(rows, fields) {
  return Array.isArray(rows)
    && rows.length > 0
    && rows.every((row) => fields.every((field) => hasDraftValue(row?.[field])));
}

function hasDraftValue(value) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

