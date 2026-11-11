/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          workspaceHelpers.js
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente workspaceHelpers de la interfaz del SGP.
 */

import { cloneStructuredValue } from "../../../../components/forms/StructuredForm";

export function reviewDecisionConfirmation(approved, module) {
  const approving = approved === true;

  return {
    title: approving ? "Aprobar documento" : "Solicitar correcciones",
    description: approving
      ? "Esta decision marcara tu aprobación sobre el documento seleccionado."
      : "Esta decision devolvera el documento para que el estudiante realice correcciones.",
    details: module?.title || "Documento de práctica",
    confirmLabel: approving ? "Confirmar aprobación" : "Confirmar correcciones",
    tone: approving ? "success" : "danger",
  };
}

export function importantActionConfirmation(label = "Confirmar acción", detail = "") {
  const destructive = /eliminar|rechazar|correccion|desactivar|bloquear/i.test(
    label,
  );

  return {
    title: label,
    description:
      "Esta acción cambiara información importante del registro seleccionado.",
    details: detail,
    confirmLabel: label,
    tone: destructive ? "danger" : "warning",
  };
}

export function getHashParams(hashValue = window.location.hash) {
  const query = String(hashValue || "").split("?")[1] || "";
  return new URLSearchParams(query);
}

export function normalizeDeepLinkOperation(operation) {
  const allowed = ["detail", "review", "form", "actions"];

  return allowed.includes(operation) ? operation : "detail";
}

export function getOperationTitle(operation, selected) {
  if (operation === "detail") {
    return selected ? "Detalle del documento" : "Detalle";
  }

  if (operation === "review") {
    return "Revisión del documento";
  }

  if (operation === "actions") {
    return "Acciones";
  }

  return selected ? "Editar documento" : "Crear documento";
}

export function mergeEditableValues(template, source) {
  if (Array.isArray(template)) {
    if (Array.isArray(source) && source.length > 0) {
      return source.map((item) => mergeEditableValues(template[0] || {}, item));
    }

    return cloneStructuredValue(template);
  }

  if (template !== null && typeof template === "object") {
    return Object.fromEntries(
      Object.entries(template).map(([key, value]) => [
        key,
        source?.[key] === undefined || source?.[key] === null
          ? cloneStructuredValue(value)
          : mergeEditableValues(value, source[key]),
      ]),
    );
  }

  return source === undefined || source === null ? template : source;
}

export function fillEnrollmentInstitutionFields(body, enrollment) {
  if (!enrollment) {
    return;
  }

  const snapshotFields = [
    "courseId",
    "courseName",
    "educationalInstitutionId",
    "educationalInstitutionName",
    "educationalInstitutionCode",
    "educationalInstitutionAddress",
    "educationalInstitutionPhone",
    "educationalInstitutionEmail",
  ];

  snapshotFields.forEach((field) => {
    if (enrollment[field] !== undefined) {
      body[field] = enrollment[field];
    }
  });
}

export function getSecondaryRows(record) {
  if (!record) {
    return [];
  }

  return (
    record.attendances || record.attendanceRecords || record.sessions || []
  );
}

export function periodLabel(period) {
  return (
    [
      period.dayOfWeek,
      period.place,
      [period.startTime, period.endTime].filter(Boolean).join(" - "),
    ]
      .filter(Boolean)
      .join(" - ") || "Período"
  );
}

export function entryLabel(entry) {
  return (
    [
      entry.activityDate,
      entry.developedActivities || entry.activities || entry.feedback,
    ]
      .filter(Boolean)
      .join(" - ") || "Actividad"
  );
}

export function enrollmentLabel(enrollment) {
  return (
    [
      enrollment.practiceName,
    enrollment.courseName,
      enrollment.studentFullName || enrollment.student,
      enrollment.educationalInstitutionName,
    ]
      .filter(Boolean)
      .join(" - ") || "Inscripción"
  );
}

export function secondaryLabel(item) {
  return (
    [
      item.attendanceDate || item.supervisionDate || item.createdAt,
      item.status,
      [item.startTime, item.endTime].filter(Boolean).join(" - "),
    ]
      .filter(Boolean)
      .join(" - ") || "Registro asociado"
  );
}

