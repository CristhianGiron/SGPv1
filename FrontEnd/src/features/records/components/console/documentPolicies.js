/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          documentPolicies.js
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente documentPolicies de la interfaz del SGP.
 */



export function canUse(roles, allowedRoles) {
  if (!allowedRoles?.length) {
    return true;
  }

  return allowedRoles.some((role) => roles.includes(role));
}

export function isActiveApprovedEnrollment(enrollment) {
  return enrollment.status === "APPROVED" && enrollment.courseActive !== false;
}

export function canSubmitRecord(record) {
  return (
    Boolean(record?.id) &&
    ["DRAFT", "NEEDS_CORRECTION", "SUBMITTED"].includes(
      String(record?.status || "").toUpperCase(),
    )
  );
}

export function canEditRecord(record) {
  const status = String(record?.status || "").toUpperCase();

  return Boolean(record?.id) && status !== "APPROVED";
}

export function canReviewRecord(record) {
  return (
    Boolean(record?.id) &&
    String(record?.status || "").toUpperCase() === "SUBMITTED"
  );
}

export function canRunExtraAction(record, action) {
  if (!record?.id) {
    return false;
  }

  if (typeof action?.visibleWhen === "function") {
    return action.visibleWhen(record);
  }

  return canReviewRecord(record);
}

export function canExportPdfRecord(record) {
  return (
    Boolean(record?.id) &&
    String(record?.status || "").toUpperCase() === "APPROVED"
  );
}

