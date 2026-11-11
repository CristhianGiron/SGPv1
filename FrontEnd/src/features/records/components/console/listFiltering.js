/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          listFiltering.js
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente listFiltering de la interfaz del SGP.
 */



export function countActiveSelectFilters(filters) {
  return ["status", "student", "course", "tutor", "cycle"].filter((key) =>
    Boolean(String(filters?.[key] || "").trim()),
  ).length;
}

export function hasActiveFilters(filters) {
  return Object.values(filters || {}).some((value) =>
    typeof value === "string" ? value.trim() !== "" : Boolean(value),
  );
}

export function filterListRows(rows, filters) {
  if (!hasActiveFilters(filters)) {
    return rows;
  }

  return rows.filter((row) => {
    if (filters.search && !rowMatchesSearch(row, filters.search)) {
      return false;
    }

    if (
      filters.status &&
      String(getStatusFilterValue(row)) !== filters.status
    ) {
      return false;
    }

    if (filters.student && getStudentFilterValue(row) !== filters.student) {
      return false;
    }

    if (filters.course && getCourseFilterValue(row) !== filters.course) {
      return false;
    }

    if (filters.tutor && !getTutorFilterValues(row).includes(filters.tutor)) {
      return false;
    }

    if (filters.cycle && getAcademicCycleFilterValue(row) !== filters.cycle) {
      return false;
    }

    return true;
  });
}

function rowMatchesSearch(row, search) {
  const terms = normalizeSearchText(search).split(/\s+/).filter(Boolean);

  if (!terms.length) {
    return true;
  }

  const haystack = normalizeSearchText(flattenSearchValues(row).join(" "));

  return terms.every((term) => haystack.includes(term));
}

function flattenSearchValues(value, depth = 0) {
  if (value === undefined || value === null || depth > 3) {
    return [];
  }

  if (typeof value !== "object") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenSearchValues(item, depth + 1));
  }

  return Object.values(value).flatMap((item) =>
    flattenSearchValues(item, depth + 1),
  );
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .trim();
}

export function buildFilterOptions(rows, getValue, getLabel = (value) => value) {
  const options = new Map();

  rows.forEach((row) => {
    const rawValue = getValue(row);

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      return;
    }

    const value = String(rawValue);

    if (!options.has(value)) {
      options.set(value, {
        value,
        label: getLabel(rawValue) || value,
      });
    }
  });

  return Array.from(options.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "es"),
  );
}

export function buildMultiFilterOptions(rows, getValues, getLabel = (value) => value) {
  const options = new Map();

  rows.forEach((row) => {
    getValues(row).forEach((rawValue) => {
      if (rawValue === undefined || rawValue === null || rawValue === "") {
        return;
      }

      const value = String(rawValue);

      if (!options.has(value)) {
        options.set(value, {
          value,
          label: getLabel(rawValue) || value,
        });
      }
    });
  });

  return Array.from(options.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "es"),
  );
}

export function getStatusFilterValue(row) {
  return row?.status ?? row?.active ?? "";
}

export function getStudentFilterValue(row) {
  return firstDefinedValue([
    row?.studentFullName,
    row?.studentUsername,
    row?.student,
    row?.student?.fullName,
    row?.student?.username,
    row?.enrollment?.studentFullName,
    row?.enrollment?.student?.username,
    row?.account?.username,
    row?.accountUsername,
  ]);
}

export function getCourseFilterValue(row) {
  return firstDefinedValue([
    row?.courseName,
    row?.course?.name,
    row?.enrollment?.courseName,
    row?.name,
  ]);
}

export function getTutorFilterValues(row) {
  return uniqueDefinedValues([
    row?.practiceTutorName,
    row?.practiceTutorUsername,
    row?.institutionalTutorName,
    row?.institutionalTutorUsername,
    row?.reviewedByName,
    row?.reviewedBy,
    row?.practiceReviewedByName,
    row?.practiceReviewedBy,
    row?.institutionalReviewedByName,
    row?.institutionalReviewedBy,
    row?.directorReviewedByName,
    row?.directorReviewedBy,
    row?.course?.practiceTutorName,
    row?.course?.practiceTutor?.username,
    row?.course?.institutionalTutorName,
    row?.course?.institutionalTutor?.username,
  ]);
}

export function getAcademicCycleFilterValue(row) {
  return firstDefinedValue([
    row?.academicCycleName,
    row?.cycleName,
    row?.academicCycle?.name,
    row?.student?.academicCycleName,
    row?.student?.academicCycle?.name,
    row?.enrollment?.academicCycleName,
  ]);
}

function uniqueDefinedValues(values) {
  return Array.from(
    new Set(
      values
        .map((value) => firstDefinedValue([value]))
        .filter(
          (value) => value !== undefined && value !== null && value !== "",
        )
        .map(String),
    ),
  );
}

function firstDefinedValue(values) {
  const value = values.find(
    (item) => item !== undefined && item !== null && item !== "",
  );

  if (value && typeof value === "object") {
    return firstDefinedValue([
      value.fullName,
      value.name,
      value.username,
      value.id,
    ]);
  }

  return value || "";
}

