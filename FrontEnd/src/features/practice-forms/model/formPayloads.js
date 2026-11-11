/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          formPayloads.js
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente formPayloads de la interfaz del SGP.
 */

import { CHOICE_TYPES, FORM_MODES, QUESTION_TYPES, TARGET_ROLES } from "./formConfig";
import { formatEnum } from "../../../utils/format";

export function newQuestion(type = 'OPEN_TEXT') {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    prompt: '',
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    options: ['Opción 1', 'Opción 2'],
  };
}

export function emptyDraft(mode = 'interviews') {
  return {
    enrollmentId: '',
    targetRole: mode === 'observations' ? 'STUDENT_SELF' : 'INSTITUTIONAL_TUTOR',
    title: '',
    description: '',
    questions: [newQuestion()],
  };
}

export function formToDraft(form, mode = 'interviews') {
  return {
    enrollmentId: form?.enrollmentId ? String(form.enrollmentId) : '',
    targetRole: form?.targetRole || (mode === 'observations' ? 'STUDENT_SELF' : 'INSTITUTIONAL_TUTOR'),
    title: form?.title || '',
    description: form?.description || '',
    questions: (form?.questions || []).map((question) =>
      normalizeQuestion({
        key: question.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: question.type || 'OPEN_TEXT',
        prompt: question.prompt || '',
        required: question.required !== false,
        scaleMin: question.scaleMin || 1,
        scaleMax: question.scaleMax || 5,
        options: (question.options || []).map((option) => option.label).filter(Boolean),
      })
    ),
  };
}

export function normalizeQuestion(question) {
  if (CHOICE_TYPES.has(question.type) && (!question.options || question.options.length < 2)) {
    return {
      ...question,
      options: ['Opción 1', 'Opción 2'],
    };
  }

  if (question.type === 'SCALE') {
    return {
      ...question,
      scaleMin: question.scaleMin || 1,
      scaleMax: question.scaleMax || 5,
    };
  }

  return question;
}

export function buildCreatePayload(draft, config = FORM_MODES.interviews) {
  if (!draft.enrollmentId) {
    throw new Error(`No se encontro una inscripción aprobada para crear la ${config.singular}.`);
  }

  if (!draft.title.trim()) {
    throw new Error(`El título de la ${config.singular} es obligatorio.`);
  }

  const questions = draft.questions.map((question, index) => {
    const prompt = question.prompt.trim();

    if (!prompt) {
      throw new Error(`La pregunta ${index + 1} no puede estar vacía.`);
    }

    if (CHOICE_TYPES.has(question.type)) {
      const options = question.options.map((option) => option.trim()).filter(Boolean);

      if (new Set(options).size !== options.length) {
        throw new Error(`La pregunta ${index + 1} tiene opciones repetidas.`);
      }

      if (options.length < 2) {
        throw new Error(`La pregunta ${index + 1} debe tener al menos dos opciones.`);
      }

      return {
        type: question.type,
        prompt,
        required: question.required,
        options: options.map((label) => ({ label })),
      };
    }

    if (question.type === 'SCALE') {
      const scaleMin = Number(question.scaleMin);
      const scaleMax = Number(question.scaleMax);

      if (!Number.isFinite(scaleMin) || !Number.isFinite(scaleMax) || scaleMin >= scaleMax) {
        throw new Error(`La escala de la pregunta ${index + 1} no es valida.`);
      }

      return {
        type: question.type,
        prompt,
        required: question.required,
        scaleMin,
        scaleMax,
      };
    }

    return {
      type: question.type,
      prompt,
      required: question.required,
    };
  });

  return {
    enrollmentId: Number(draft.enrollmentId),
    targetRole: draft.targetRole,
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    questions,
  };
}

export function resolveDefaultEnrollment(enrollments) {
  return enrollments?.length === 1 ? enrollments[0] : null;
}

export function isApprovedEnrollment(enrollment) {
  const status = String(enrollment?.status || '').toUpperCase();

  return status === 'APPROVED' || status === 'APROBADA' || status === 'APROBADO';
}

export function targetOptionsForEnrollment(enrollment) {
  return [
    {
      value: 'INSTITUTIONAL_TUTOR',
      label: enrollment?.institutionalTutor
        ? `Tutor institucional: ${enrollment.institutionalTutor}`
        : 'Tutor institucional no asignado',
      disabled: !enrollment?.institutionalTutor,
    },
    {
      value: 'INSTITUTION_DIRECTOR',
      label: enrollment?.institutionDirector
        ? `Directora de la institución: ${enrollment.institutionDirector}`
        : 'Directora de la institución no asignada',
      disabled: !enrollment?.institutionDirector,
    },
  ];
}

export function responseDraftFromQuestions(questions) {
  return Object.fromEntries(
    (questions || [])
      .filter((question) => question.answer)
      .map((question) => {
        const answer = question.answer || {};

        if (question.type === 'OPEN_TEXT') {
          return [question.id, { textAnswer: answer.textAnswer || '' }];
        }

        if (question.type === 'YES_NO') {
          return [
            question.id,
            {
              booleanAnswer:
                answer.booleanAnswer === true ? 'true' : answer.booleanAnswer === false ? 'false' : '',
            },
          ];
        }

        if (question.type === 'SCALE' || question.type === 'NUMBER') {
          return [question.id, { numberAnswer: answer.numberAnswer ?? '' }];
        }

        return [question.id, { selectedOptions: answer.selectedOptions || [] }];
      })
  );
}

export function buildResponsePayload(questions, responseDraft, draft = false) {
  const answers = [];

  questions.forEach((question) => {
    const value = responseDraft[question.id] || {};

    if (question.type === 'OPEN_TEXT') {
      const textAnswer = (value.textAnswer || '').trim();
      if (textAnswer) {
        answers.push({ questionId: question.id, textAnswer });
      } else if (!draft && question.required) {
        throw new Error(`Responde la pregunta ${question.order}.`);
      }
      return;
    }

    if (question.type === 'YES_NO') {
      if (value.booleanAnswer === 'true' || value.booleanAnswer === 'false') {
        answers.push({ questionId: question.id, booleanAnswer: value.booleanAnswer === 'true' });
      } else if (!draft && question.required) {
        throw new Error(`Responde la pregunta ${question.order}.`);
      }
      return;
    }

    if (question.type === 'SCALE' || question.type === 'NUMBER') {
      if (value.numberAnswer !== undefined && value.numberAnswer !== null && value.numberAnswer !== '') {
        answers.push({ questionId: question.id, numberAnswer: Number(value.numberAnswer) });
      } else if (!draft && question.required) {
        throw new Error(`Responde la pregunta ${question.order}.`);
      }
      return;
    }

    const selectedOptions = value.selectedOptions || [];
    if (selectedOptions.length) {
      answers.push({ questionId: question.id, selectedOptions });
    } else if (!draft && question.required) {
      throw new Error(`Responde la pregunta ${question.order}.`);
    }
  });

  if (!draft && !answers.length) {
    throw new Error('Debes responder al menos una pregunta.');
  }

  return { answers };
}

export function formatAnswer(question) {
  const answer = question.answer || {};

  if (question.type === 'OPEN_TEXT') {
    return answer.textAnswer || '-';
  }

  if (question.type === 'YES_NO') {
    return answer.booleanAnswer ? 'Sí' : 'No';
  }

  if (question.type === 'SCALE' || question.type === 'NUMBER') {
    return answer.numberAnswer ?? '-';
  }

  return (answer.selectedOptions || []).join(', ') || '-';
}

export function scaleValues(question) {
  const min = Number(question.scaleMin);
  const max = Number(question.scaleMax);

  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    return [];
  }

  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

export function questionTypeLabel(type) {
  return QUESTION_TYPES.find(([value]) => value === type)?.[1] || formatEnum(type);
}

export function targetRoleLabel(role) {
  return TARGET_ROLES.find(([value]) => value === role)?.[1] || formatEnum(role);
}

