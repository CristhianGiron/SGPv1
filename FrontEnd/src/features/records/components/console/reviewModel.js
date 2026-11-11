/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          reviewModel.js
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente reviewModel de la interfaz del SGP.
 */

import { cloneStructuredValue } from "../../../../components/forms/StructuredForm";
import { labelFromKey } from "../../../../utils/format";

export function getReviewSections(moduleId, record, reviewValue) {
  const generalFields = [
    "courseName",
    "studentFullName",
    "studentIdentification",
    "studentEmail",
    "studentPhone",
    "educationalInstitutionName",
    "educationalInstitutionCode",
    "practiceType",
    "academicPeriod",
    "developmentMode",
  ];
  const activityWeekFields = [
    "weekNumber",
    "startDate",
    "endDate",
    "activities",
  ];

  if (moduleId === "activity-plans") {
    return [
      section("Datos generales", "generalInfoFeedback", [
        ...generalFields,
        "curricularOrganizationUnit",
        "subjectDenomination",
        "integrativeKnowledgeProject",
        "teacherCount",
        "studentCount",
        "mission",
        "vision",
        "institutionalValues",
      ]),
      section("Presentación", "presentationFeedback", ["presentation"]),
      section("Objetivos", "objectivesFeedback", [
        "generalObjective",
        "specificObjective1",
        "specificObjective2",
        "specificObjective3",
      ]),
      section(
        "Actividades",
        "activitiesFeedback",
        [],
        [
          {
            key: "activityWeeks",
            label: "Semanas",
            fields: activityWeekFields,
            itemLabel: weekLabel,
          },
        ],
      ),
      section(
        "Cronograma",
        "scheduleFeedback",
        [],
        [
          {
            key: "scheduleWeeks",
            label: "Semanas",
            fields: [
              "weekNumber",
              "startDate",
              "endDate",
              "scheduledActivities",
            ],
            itemLabel: weekLabel,
          },
        ],
      ),
      section("Recursos", "resourcesFeedback", [
        "legalResources",
        "humanResources",
        "technologicalResources",
        "physicalResources",
      ]),
      section("Aprobación", "approvalFeedback", []),
    ];
  }

  if (moduleId === "practice-reports") {
    return [
      section("Datos generales", "generalInfoFeedback", generalFields),
      section("Presentación", "presentationFeedback", ["presentation"]),
      section("Objetivos", "objectivesFeedback", [
        "generalObjective",
        "specificObjective1",
        "specificObjective2",
        "specificObjective3",
      ]),
      section("Metodología", "methodologyFeedback", ["methodology"]),
      section(
        "Actividades",
        "activitiesFeedback",
        [],
        [
          {
            key: "activityWeeks",
            label: "Semanas",
            fields: activityWeekFields,
            itemLabel: weekLabel,
          },
        ],
      ),
      section("Conclusiones", "conclusionsFeedback", [
        "conclusion1",
        "conclusion2",
        "conclusion3",
      ]),
      section("Recomendaciones", "recommendationsFeedback", [
        "recommendation1",
        "recommendation2",
        "recommendation3",
      ]),
      section("Aprobación", "approvalFeedback", []),
    ];
  }

  if (moduleId === "final-reports") {
    return [
      section("Datos generales", "generalInfoFeedback", generalFields),
      section("Antecedentes", "antecedentsFeedback", ["antecedents"]),
      section("Objetivo", "objectiveFeedback", ["objective"]),
      section(
        "Actividades",
        "activitiesFeedback",
        [],
        [
          {
            key: "activityWeeks",
            label: "Semanas",
            fields: activityWeekFields,
            itemLabel: weekLabel,
          },
        ],
      ),
      section("Conclusiones", "conclusionsFeedback", [
        "conclusion1",
        "conclusion2",
        "conclusion3",
      ]),
      section("Recomendaciones", "recommendationsFeedback", [
        "recommendation1",
        "recommendation2",
        "recommendation3",
      ]),
      section("Aprobación", "approvalFeedback", []),
    ];
  }

  if (moduleId === "completed-records") {
    return [
      section("Datos generales", "generalInfoFeedback", [
        ...generalFields,
        "totalTime",
        "deliveryDate",
      ]),
      {
        title: "Actividades",
        feedbackKey: "activitiesFeedback",
        feedbackKeys: ["activitiesFeedback", "entryFeedback"],
        fields: [],
        arrays: [],
        entryFeedback: true,
      },
      section("Acreditacion", "accreditationFeedback", [
        "totalMinutes",
        "totalTime",
        "deliveryDate",
      ]),
    ];
  }

  return Object.keys(reviewValue || {})
    .filter((key) => key !== "approved" && /Feedback$/.test(key))
    .map((feedbackKey) =>
      section(
        labelFromKey(feedbackKey.replace(/Feedback$/, "")),
        feedbackKey,
        [],
      ),
    );
}

function section(title, feedbackKey, fields = [], arrays = []) {
  return {
    title,
    feedbackKey,
    fields,
    arrays,
  };
}

function weekLabel(item, index) {
  return item.weekNumber ? `Semana ${item.weekNumber}` : `Semana ${index + 1}`;
}

export function isFeedbackReviewBody(value) {
  return Boolean(
    value?.approved !== undefined &&
    Object.keys(value).some((key) => /Feedback$/.test(key)),
  );
}

export function normalizeReviewBody(value) {
  const normalized = cloneStructuredValue(value || {});

  if (Array.isArray(normalized.entryFeedback)) {
    normalized.entryFeedback = normalized.entryFeedback.filter(
      (item) => item?.entryId,
    );

    if (normalized.entryFeedback.length === 0) {
      delete normalized.entryFeedback;
    }
  }

  return normalized;
}

export function buildReviewValue(module, record, roles = []) {
  const value = cloneStructuredValue(module.reviewSample || { approved: null });
  const prefix = feedbackPrefixForReview(module.id, roles);

  return fillFeedbackReviewValue(value, record, prefix);
}

export function buildActionBodiesForRecord(actions, module, record, roles = []) {
  return Object.fromEntries(
    actions
      .filter((action) => action.body)
      .map((action) => {
        const value = cloneStructuredValue(
          action.sample || module.reviewSample || { approved: null },
        );

        if (isFeedbackReviewBody(value)) {
          return [
            action.label,
            fillFeedbackReviewValue(
              value,
              record,
              feedbackPrefixForAction(module.id, action, roles),
            ),
          ];
        }

        if (module.id === 'final-reports' && action.letterhead) {
          Object.keys(value).forEach(key => { value[key] = record?.[key] ?? ''; });
        }
        return [action.label, value];
      }),
  );
}

function fillFeedbackReviewValue(value, record, prefix = "") {
  Object.keys(value).forEach((key) => {
    if (!/Feedback$/.test(key) || key === "entryFeedback") {
      return;
    }

    const sourceKey = prefix ? `${prefix}${capitalizeFirst(key)}` : key;
    value[key] = record?.[sourceKey] ?? record?.[key] ?? value[key] ?? "";
  });

  if (Array.isArray(value.entryFeedback)) {
    value.entryFeedback = (record?.entries || [])
      .filter((entry) => entry?.id && (entry.feedback || entry.suggestions))
      .map((entry) => ({
        entryId: entry.id,
        feedback: entry.feedback || null,
        suggestions: entry.suggestions || null,
      }));
  }

  return value;
}

function feedbackPrefixForAction(moduleId, action, roles = []) {
  if (
    moduleId === "final-reports" &&
    /institucional/i.test(action.label || "")
  ) {
    return "institutional";
  }

  return feedbackPrefixForReview(moduleId, roles);
}

function feedbackPrefixForReview(moduleId, roles = []) {
  if (moduleId !== "final-reports") {
    return "";
  }

  if (roles.includes("ROLE_DIRECTOR_PRACTICAS")) {
    return "director";
  }

  if (roles.includes("ROLE_TUTOR_INSTITUCIONAL")) {
    return "institutional";
  }

  return "practice";
}

function capitalizeFirst(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

