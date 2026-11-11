/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          CoursesPage.jsx
 * @fecha         2026-11-09 11:08:16
 * @nota          Permite gestionar los paralelos, sus prácticas, estudiantes, grupos y asignaciones autorizadas.
 */

import { PracticeOfferingsPanel } from '../components/PracticeOfferingsPanel';
import { CourseRoster } from '../components/CourseRoster';
import { practiceCompletionConfirmation } from '../../../utils/practiceCompletion';
import { fetchAllPages } from '../../../utils/pagination';
import { EntityImage, EntityImagePicker, entityImagePayload } from '../../../components/ui/EntityImage';
import { workspaceRoute } from '../../../config/practiceWorkflow';
import { setHashRoute } from '../../../utils/routes';
import { useInstitutionalContext } from '../../../contexts/InstitutionalContext';
import { workflowCopy } from '../../../config/roleExperience';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Eye,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Unlock,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { apiRequest, toQuery, unwrapPage } from '../../../api/client';
import { useAuth } from '../../auth/context/AuthContext';
import { ENTITY_RELATIONS } from '../../../config/resources';
import { Alert } from '../../../components/ui/Alert';
import { ActionBar, PrimaryButton, SecondaryButton } from '../../../components/ui/ActionBar';
import { ActionMenu } from '../../../components/ui/ActionMenu';
import { useConfirm } from '../../../components/ui/ConfirmDialog';
import { DataTable } from '../../../components/ui/DataTable';
import { EntitySelect } from '../../../components/ui/EntitySelect';
import { FilterPanel } from '../../../components/ui/FilterPanel';
import { Field, Input, Select, Textarea } from '../../../components/ui/FormControls';
import { Modal } from '../../../components/ui/Modal';
import { ModuleTab, ModuleTabs } from '../../../components/ui/ModuleTabs';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SectionCard } from '../../../components/ui/SectionCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { booleanSelectValue, buildSelectOptions, matchesOpenSearch } from '../../../utils/filtering';
import { filterInactiveForNonAdmin } from '../../../utils/visibility';

export function CoursesPage() {
  const defaults = useInstitutionalContext();
  const { token, roles, profile } = useAuth();
  const confirm = useConfirm();
  const isAdmin = roles.includes('ROLE_ADMIN');
  const canConclude = roles.includes('ROLE_DIRECTOR_PRACTICAS');
  const canManage = isAdmin || roles.includes('ROLE_DIRECTOR_PRACTICAS');
  const canPracticeTutor = roles.includes('ROLE_TUTOR_PRACTICAS');
  const canManageGroups = isAdmin || canPracticeTutor;
  const canUseCourse = canManage || canPracticeTutor;
  const isStudent = roles.includes('ROLE_ESTUDIANTE') && !canUseCourse;
  function defaultCourseForm() {
    return { ...emptyCourseForm(), facultyId: isAdmin ? defaults.facultyId || '' : profile?.facultyId || '', careerId: isAdmin ? defaults.careerId || '' : profile?.careerId || '' };
  }
  const [coverFile, setCoverFile] = useState(null);
  const [editCoverFile, setEditCoverFile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courseId, setCourseId] = useState('');
  useEffect(() => { setEditCoverFile(null); }, [courseId]);
  const [accountId, setAccountId] = useState('');
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [assignmentGroupByEnrollmentId, setAssignmentGroupByEnrollmentId] = useState({});
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    capacity: '',
    institutionalTutorId: '',
  });
  const [courseProfileForm, setCourseProfileForm] = useState(emptyCoursePracticeProfile());
  const [form, setForm] = useState(() => defaultCourseForm());
  const [courseFilters, setCourseFilters] = useState({
    query: '',
    course: '',
    subject: '',
    active: '',
    locked: '',
    institutionalTutor: '',
    practiceTutor: '',
  });
  const [activeView, setActiveView] = useState('courses');
  const [managementModal, setManagementModal] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hashValue, setHashValue] = useState(() => window.location.hash);
  const pendingEnrollmentsByCourse = useMemo(() => {
    const map = new Map();
    enrollments.forEach((enrollment) => {
      if (enrollment.status === 'PENDING') {
        const courseId = String(enrollment.courseId || enrollment.id);
        map.set(courseId, (map.get(courseId) || 0) + 1);
      }
    });
    return map;
  }, [enrollments]);
  const assignableGroups = useMemo(
    () => groups.filter((group) => isGroupAssignable(group)),
    [groups]
  );

  const loadData = useCallback(async () => {
    if (!canUseCourse) return;
    setLoading(true);
    setError('');

    try {
      const courseListPath = isAdmin
        ? '/api/courses'
        : `/api/courses/search${toQuery({
            active: true,
            practiceTutor: canPracticeTutor && !canManage ? profile?.username : undefined,
            size: 200,
          })}`;

      const coursePayload = await fetchAllPages(apiRequest,
        courseListPath,
        { token }
      );

      const loadedCourses = canManage
        ? unwrapPage(coursePayload)
        : filterInactiveForNonAdmin(unwrapPage(coursePayload), roles);
      setCourses(canPracticeTutor && !canManage ? filterPracticeTutorCourses(loadedCourses, profile?.username) : loadedCourses);

    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token, roles, isAdmin, canManage, canPracticeTutor, canUseCourse, profile?.username]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    function handleHashChange() {
      setHashValue(window.location.hash);
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const params = getHashParams(hashValue);
    const targetCourseId = params.get('courseId');
    const targetView = params.get('view') === 'enrollments' ? 'enrollments' : 'manage';

    if (!targetCourseId) {
      return;
    }

    const course = courses.find((item) => String(item.id) === String(targetCourseId));
    setCourseId(targetCourseId);
    setCourseProfileForm(profileFromCourse(course));

    if (isStudent) {
      setActiveView(targetView === 'enrollments' ? 'enrollments' : 'courses');
      return;
    }

    if (!canUseCourse) {
      return;
    }

    let active = true;

    async function openCourseFromLink() {
      const refreshed = await refreshCourseManagement(targetCourseId);

      if (active && refreshed) {
        setActiveView(targetView);
      }
    }

    openCourseFromLink();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashValue, courses, isStudent, canUseCourse, token]);

  async function createCourse(event) {
    event.preventDefault();

    if (!form.academicCycleId) {
      setError('Selecciona la carrera y el ciclo académico del paralelo');
      setMessage('');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest('/api/courses', {
        method: 'POST',
        token,
        body: entityImagePayload(cleanCoursePayload(form), coverFile),
      });
      setForm(defaultCourseForm());
      await loadData();
      setActiveView('courses');
      setCoverFile(null);
      setMessage('Paralelo creado');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function setCourseFormField(name, value) {
    setForm((current) => applyCourseFormChange(current, name, value));
  }

  async function runCourseAction(path, method = 'PATCH', confirmation = courseActionConfirmation()) {
    try {
      confirmation = await practiceCompletionConfirmation(path, confirmation, token);
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
    if (confirmation) {
      const accepted = await confirm(confirmation);

      if (!accepted) {
        return false;
      }
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest(path, { method, token });
      await loadData();
      if (canUseCourse && courseId) {
        const refreshed = await refreshCourseManagement(courseId);
        if (!refreshed) {
          return;
        }
      }
      setMessage('Acción ejecutada');
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  function runQuickCourseAction(path, requirements = [], confirmation = courseActionConfirmation()) {
    const missing = requirements.find((requirement) => !requirement.value);

    if (missing) {
      setError(missing.message);
      setMessage('');
      return;
    }

    runCourseAction(path, 'PATCH', confirmation);
  }

  async function assignEnrollmentToGroup(enrollment) {
    const selectedGroupId = assignmentGroupByEnrollmentId[enrollment.id] || enrollment.groupId;

    if (!selectedGroupId) {
      setError('Selecciona el grupo para este estudiante');
      setMessage('');
      return;
    }

    const accepted = await confirm(courseActionConfirmation({
      title: enrollment.groupId ? 'Cambiar grupo del estudiante' : 'Asignar estudiante a grupo',
      description: 'Esta acción actualizara la organización del estudiante dentro del paralelo.',
      details: enrollment.student || enrollment.studentFullName || enrollment.courseName || '',
      confirmLabel: enrollment.groupId ? 'Cambiar grupo' : 'Asignar grupo',
      tone: 'warning',
    }));

    if (!accepted) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest(`/api/enrollments/${enrollment.id}/group/${selectedGroupId}`, {
        method: 'PATCH',
        token,
      });

      const refreshed = await refreshCourseManagement(courseId || enrollment.courseId);
      if (refreshed) {
        setMessage('Estudiante asignado al grupo');
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateCover(remove = false) {
    if (!courseId || (!remove && !editCoverFile)) return;
    if (remove && !await confirm({ title: 'Quitar portada', description: 'Las prácticas usarán la imagen predeterminada.', confirmLabel: 'Quitar portada', tone: 'danger' })) return;
    setLoading(true);setError('');
    try {
      const body = new FormData();if (editCoverFile) body.append('image', editCoverFile);
      await apiRequest(`/api/courses/${courseId}/cover`, { method: remove ? 'DELETE' : 'PUT', token, ...(remove ? {} : { body }) });
      setEditCoverFile(null);await loadData();setMessage(remove ? 'Portada retirada.' : 'Portada actualizada.');
    } catch (error) { setError(error.message); } finally { setLoading(false); }
  }

  async function createCourseGroup(event) {
    event.preventDefault();

    if (!courseId) {
      setError('Selecciona un paralelo antes de crear el grupo');
      setMessage('');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest(`/api/courses/${courseId}/groups`, {
        method: 'POST',
        token,
        body: cleanGroupPayload(groupForm),
      });
      setGroupForm({ name: '', description: '', capacity: '', institutionalTutorId: '' });
      const refreshed = await refreshCourseManagement(courseId);
      if (!refreshed) {
        return;
      }
      setManagementModal('');
      setMessage('Grupo creado');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function updatePracticeProfile(event) {
    event.preventDefault();

    if (!courseId) {
      setError('Selecciona un paralelo antes de guardar los datos comunes');
      setMessage('');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const updatedCourse = await apiRequest(`/api/courses/${courseId}/practice-profile`, {
        method: 'PATCH',
        token,
        body: cleanCoursePracticeProfile(courseProfileForm),
      });
      setCourseProfileForm(profileFromCourse(updatedCourse));
      await loadData();
      setManagementModal('');
      setMessage('Datos comunes del paralelo guardados');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const showActionsColumn = courses.length > 0 && canUseCourse;

  const columns = [
    !isStudent && { key: 'id', header: 'ID' },
    { key: 'name', header: 'Paralelo', render: row => <div className="flex items-center gap-3"><EntityImage path={row.coverImageUrl} className="h-12 w-20 shrink-0 rounded-lg" /><span>{row.name}</span></div> },
    { key: 'code', header: 'Código' },
    { key: 'capacity', header: 'Cupos' },
    {
      key: 'state',
      header: 'Estado',
      render: (row) => (
        <ActionBar>
          <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} />
          {row.locked && <span className="text-xs font-medium text-warning-strong">Inscripciones cerradas</span>}
        </ActionBar>
      ),
    },
    !isStudent && !(canPracticeTutor && !canManage) && { key: 'practiceTutor', header: 'Tutor de prácticas', render: (row) => row.practiceTutor || '-' },
    !isStudent && {
      key: 'pendingEnrollments',
      header: 'Pendientes',
      render: (row) => {
        const pending = pendingEnrollmentsByCourse.get(String(row.id)) || 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${pending > 0 ? 'text-warning-strong dark:text-warning-strong' : 'text-body'}`}>
              {pending}
            </span>
            {canUseCourse && pending > 0 && (
              <PrimaryButton
                size="sm"
                icon={CheckCircle2}
                onClick={() => viewCourseAndEnrollments(row.id)}
                type="button"
              >
                Ver
              </PrimaryButton>
            )}
          </div>
        );
      },
    },
  ].filter(Boolean);

  if (showActionsColumn) {
    columns.push({
      key: 'actions',
      header: 'Acciones',
      render: (row) => {
        const actions = [];

        if (canUseCourse) {
          actions.push({
            key: 'use',
            label: 'Abrir gestión',
            icon: Eye,
            onClick: () => viewCourseAndEnrollments(row.id),
          });
        }

        if (canManage) {
          actions.push({
            key: row.active ? 'disable' : 'enable',
            label: row.active ? 'Desactivar' : 'Activar',
            icon: row.active ? Ban : CheckCircle2,
            onClick: () =>
              runCourseAction(
                `/api/courses/${row.id}/${row.active ? 'disable' : 'enable'}`,
                'PATCH',
                courseActionConfirmation({
                  title: row.active ? 'Desactivar paralelo' : 'Activar paralelo',
                  description: row.active
                    ? 'El paralelo dejara de estar disponible para nuevos procesos.'
                    : 'El paralelo volvera a estar disponible.',
                  details: row.name,
                  confirmLabel: row.active ? 'Desactivar' : 'Activar',
                  tone: row.active ? 'danger' : 'warning',
                })
              ),
          });

        }

        if (canManage || canPracticeTutor) {
          actions.push({
            key: row.locked ? 'unlock' : 'lock',
            label: row.locked ? 'Abrir inscripciones' : 'Cerrar inscripciones',
            icon: row.locked ? Unlock : Lock,
            onClick: () =>
              runCourseAction(
                `/api/courses/${row.id}/${row.locked ? 'unlock' : 'lock'}`,
                'PATCH',
                courseActionConfirmation({
                  title: row.locked ? 'Abrir inscripciones' : 'Cerrar inscripciones',
                  description: row.locked
                    ? 'El personal autorizado podrá asignar estudiantes a las prácticas de este paralelo.'
                    : 'No se admitirán nuevas inscripciones. Las prácticas ya asignadas continuarán su desarrollo.',
                  details: row.name,
                  confirmLabel: row.locked ? 'Abrir inscripciones' : 'Cerrar inscripciones',
                  tone: row.locked ? 'warning' : 'danger',
                })
              ),
          });
        }


        return actions.length ? <ActionMenu actions={actions} /> : null;
      },
    });
  }
  const courseFilterOptions = useMemo(
    () => ({
      courses: buildSelectOptions(courses, (row) => row.name),
      subjects: buildSelectOptions(courses, (row) => row.subject),
      practiceTutors: buildSelectOptions(courses, (row) => row.practiceTutor),
      institutionalTutors: buildSelectOptions(courses, (row) => row.institutionalTutor),
    }),
    [courses]
  );
  const filteredCourses = useMemo(
    () => courses.filter((course) => filterCourseRow(course, courseFilters)),
    [courseFilters, courses]
  );

  const showEnrollmentActionsColumn = enrollments.some(
    (row) =>
      ['PENDING', 'APPROVED', 'COMPLETED'].includes(row.status)
      || (row.status === 'PENDING' && (canManage || isStudent))
      || (canManageGroups && row.status === 'APPROVED')
      || (canConclude && ['APPROVED', 'COMPLETED'].includes(row.status))
  );

  const enrollmentColumns = [
    { key: 'id', header: 'ID' },
    !isStudent && { key: 'student', header: 'Estudiante' },
    { key: 'practiceName', header: 'Práctica', render: row => row.practiceName || row.courseName || '-' },
    { key: 'courseName', header: 'Paralelo' },
    { key: 'groupName', header: 'Grupo', render: (row) => row.groupName || '-' },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
  ].filter(Boolean);

  const groupColumns = [
    { key: 'name', header: 'Grupo' },
    { key: 'capacity', header: 'Cupos', render: (row) => row.capacity || '-' },
    { key: 'institutionalTutor', header: 'Tutor institucional', render: (row) => row.institutionalTutor || '-' },
    { key: 'educationalInstitutionName', header: 'Institución', render: (row) => row.educationalInstitutionName || '-' },
    { key: 'active', header: 'Estado', render: (row) => <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} /> },
  ];

  function renderEnrollmentGroupAssignment(row) {
    const selectedGroupId = assignmentGroupByEnrollmentId[row.id] ?? row.groupId ?? '';
    const sameGroup = selectedGroupId && row.groupId && String(selectedGroupId) === String(row.groupId);
    const groupOptions = getGroupOptionsForEnrollment(row, groups, assignableGroups);

    // El tutor de practicas asigna manualmente el grupo por estudiante.
    return (
      <div className="flex min-w-64 flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          className="min-w-48"
          disabled={loading || groupOptions.length === 0}
          onChange={(event) =>
            setAssignmentGroupByEnrollmentId((current) => ({
              ...current,
              [row.id]: event.target.value ? Number(event.target.value) : '',
            }))
          }
          value={selectedGroupId}
        >
          <option value="">
            {groupOptions.length ? 'Seleccionar grupo' : 'Sin grupos asignables'}
          </option>
          {groupOptions.map((group) => (
            <option disabled={!isGroupAssignable(group)} key={group.id} value={group.id}>
              {groupAssignmentLabel(group)}
            </option>
          ))}
        </Select>
        <SecondaryButton
          disabled={loading || !selectedGroupId || Boolean(sameGroup)}
          icon={Layers}
          onClick={() => assignEnrollmentToGroup(row)}
          type="button"
        >
          {sameGroup ? 'Asignado' : row.groupId ? 'Cambiar' : 'Asignar'}
        </SecondaryButton>
      </div>
    );
  }

  if (showEnrollmentActionsColumn) {
    enrollmentColumns.push({
      key: 'actions',
      header: 'Acciones',
      render: (row) => {
        const actions = ['PENDING', 'APPROVED', 'COMPLETED'].includes(row.status) ? [{ key: 'workspace', label: 'Abrir práctica', onClick: () => setHashRoute(workspaceRoute(row.id)) }] : [];

        if (canManage && row.status === 'PENDING') {
          actions.push(
            {
              key: 'approve',
              label: 'Aprobar',
              icon: CheckCircle2,
              onClick: () =>
                runCourseAction(
                  `/api/enrollments/${row.id}/approve`,
                  'PATCH',
                  courseActionConfirmation({
                    title: 'Aprobar inscripción',
                    description: 'El estudiante quedará aprobado en el paralelo seleccionado.',
                    details: row.student || row.studentFullName || row.courseName,
                    confirmLabel: 'Aprobar',
                    tone: 'success',
                  })
                ),
            },
            {
              key: 'reject',
              label: 'Rechazar',
              icon: XCircle,
              onClick: () =>
                runCourseAction(
                  `/api/enrollments/${row.id}/reject`,
                  'PATCH',
                  courseActionConfirmation({
                    title: 'Rechazar inscripción',
                    description: 'La solicitud del estudiante será rechazada.',
                    details: row.student || row.studentFullName || row.courseName,
                    confirmLabel: 'Rechazar',
                    tone: 'danger',
                  })
                ),
            }
          );
        }

        if (canConclude && row.status === 'APPROVED') {
          actions.push({
            key: 'complete',
            label: 'Concluir práctica',
            icon: CheckCircle2,
            onClick: () =>
              runCourseAction(
                `/api/enrollments/${row.id}/complete`,
                'PATCH',
                courseActionConfirmation({
                  title: 'Concluir práctica',
                  description: 'La práctica pasará al historial como concluida y el estudiante podrá iniciar otra práctica posteriormente.',
                  details: row.studentFullName || row.student || row.courseName,
                  confirmLabel: 'Concluir',
                  tone: 'warning',
                })
              ),
          });
        }

        if (canConclude && row.status === 'COMPLETED') {
          actions.push({
            key: 'reopen',
            label: 'Reabrir práctica',
            icon: RotateCcw,
            disabled: row.archived || row.courseActive === false,
            disabledReason: row.archived ? 'Administración debe desarchivar la práctica antes de reabrirla.' : row.courseActive === false ? 'Activa el paralelo antes de reabrir la práctica.' : '',
            onClick: () =>
              runCourseAction(
                `/api/enrollments/${row.id}/reopen`,
                'PATCH',
                courseActionConfirmation({
                  title: 'Reabrir práctica',
                  description: 'La práctica volverá a estar aprobada si el paralelo y el grupo están disponibles y hay cupo. Puedes mantener prácticas en otros paralelos asignados.',
                  details: row.studentFullName || row.student || row.courseName,
                  confirmLabel: 'Reabrir',
                  tone: 'warning',
                })
              ),
          });
        }

        if (canManageGroups && row.status === 'APPROVED') {
          const assignment = renderEnrollmentGroupAssignment(row);

          return actions.length ? (
            <div className="flex flex-col gap-2">
              {assignment}
              <ActionMenu actions={actions} />
            </div>
          ) : assignment;
        }

        return actions.length ? <ActionMenu actions={actions} /> : null;
      },
    });
  }

  async function refreshCourseManagement(id = null) {
    const targetId = id || courseId;
    if (!targetId) {
      setError('Selecciona un paralelo antes de consultar inscritos');
      return false;
    }

    try {
      const [enrollmentPayload, groupPayload] = await Promise.all([
        apiRequest(`/api/courses/${targetId}/enrollments`, { token }),
        apiRequest(`/api/courses/${targetId}/groups`, { token }),
      ]);

      const loadedGroups = filterInactiveForNonAdmin(unwrapPage(groupPayload), roles);
      const loadedEnrollments = filterInactiveForNonAdmin(unwrapPage(enrollmentPayload), roles);
      setEnrollments(loadedEnrollments);
      setGroups(loadedGroups);
      setGroupId((current) =>
        loadedGroups.some((group) => String(group.id) === String(current))
          ? current
          : loadedGroups[0]?.id || ''
      );
      setAssignmentGroupByEnrollmentId(
        loadedEnrollments.reduce((assignmentMap, enrollment) => {
          if (enrollment.groupId) {
            assignmentMap[enrollment.id] = enrollment.groupId;
          }

          return assignmentMap;
        }, {})
      );
      return true;
    } catch (requestError) {
      setError(requestError.message);
      setEnrollments([]);
      setGroups([]);
      setGroupId('');
      setAssignmentGroupByEnrollmentId({});
      return false;
    }
  }

  async function loadCourseEnrollments(id = null) {
    const refreshed = await refreshCourseManagement(id);
    if (refreshed) {
      setActiveView('enrollments');
    }
  }

  async function viewCourseAndEnrollments(id) {
    const course = courses.find((item) => String(item.id) === String(id));
    setCourseId(id);
    setCourseProfileForm(profileFromCourse(course));
    const refreshed = await refreshCourseManagement(id);
    if (refreshed) {
      setActiveView('manage');
    }
  }

  const needsCourse = {
    value: courseId,
    message: 'Selecciona un paralelo antes de ejecutar esta acción',
  };
  const needsTutorAccount = {
    value: accountId,
    message: 'Indica la cuenta del tutor antes de asignarlo',
  };
  const selectedCourse = courses.find((item) => String(item.id) === String(courseId));
  const selectedGroup = groups.find((group) => String(group.id) === String(groupId));
  const selectedCourseIsActive = selectedCourse?.active !== false;
  const selectedCourseIsLocked = selectedCourse?.locked === true;
  const selectedGroupIsActive = selectedGroup?.active !== false;
  const showCourseFilters = activeView === 'courses' || activeView === 'create';
  const courseTabs = (
    <ModuleTabs>
      {[
        ['courses', isStudent ? 'Paralelos disponibles' : 'Paralelos'],
        canManage && ['create', 'Crear paralelo'],
        courseId && canUseCourse && ['manage', 'Gestión del paralelo'],
        (isStudent || courseId) && ['enrollments', isStudent ? 'Mis prácticas' : 'Inscripciones'],
      ]
        .filter(Boolean)
        .map(([id, label]) => (
          <ModuleTab
            active={activeView === id}
            key={id}
            onClick={() => {
              if (id === 'create') setCoverFile(null);
              if (id === 'create') setForm((current) => !current.facultyId && !current.careerId ? { ...current, facultyId: defaultCourseForm().facultyId, careerId: defaultCourseForm().careerId } : current);
              setActiveView(id);
              if (id === 'courses' || id === 'create') {
                setCourseId('');
                if (!isStudent) {
                  setEnrollments([]);
                }
                setGroups([]);
                setGroupId('');
                setAssignmentGroupByEnrollmentId({});
                setCourseProfileForm(emptyCoursePracticeProfile());
              }
            }}
          >
            {label}
          </ModuleTab>
        ))}
    </ModuleTabs>
  );

  return (
    <>
      <PageHeader
        eyebrow="Prácticas"
        title={isStudent ? 'Paralelos disponibles y mis prácticas' : 'Paralelos y prácticas'}
        description={workflowCopy('courses', roles)}
        helpText={workflowCopy('courses', roles)}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      {isStudent && !loading && !error && !courses.length && <Alert tone="info">No hay prácticas abiertas para tus paralelos asignados. Si falta un paralelo que cursas, solicita a dirección que revise tu pertenencia académica.</Alert>}

      {!showCourseFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-panel-soft p-2.5 dark:bg-surface-soft">
          {courseTabs}
          <SecondaryButton className="!w-auto" icon={RefreshCw} loading={loading} onClick={loadData} type="button">
            Actualizar
          </SecondaryButton>
        </div>
      )}

      {/* Mostrar aviso para gestores cuando no hay paralelo seleccionado */}
      {!courseId && canUseCourse && (activeView === 'courses' || activeView === 'create') && (
        <SectionCard>
          <Alert tone="info">Abre la gestión de un paralelo para ver sus grupos e inscripciones.</Alert>
        </SectionCard>
      )}

      {showCourseFilters && (
        <>
          <FilterPanel
            activeCount={countActiveFilters(courseFilters, ['query'])}
            action={
              <SecondaryButton className="!w-auto" icon={RefreshCw} loading={loading} onClick={loadData} type="button">
                Actualizar
              </SecondaryButton>
            }
            hasActiveFilters={countActiveFilters(courseFilters) > 0}
            leading={courseTabs}
            onClear={() => setCourseFilters({
              query: '',
              course: '',
              subject: '',
              active: '',
              locked: '',
              institutionalTutor: '',
              practiceTutor: '',
            })}
            search={(
              <Field label="Buscar">
                <Input
                  placeholder={isStudent ? 'Paralelo, código o asignatura' : 'Paralelo, código, tutor o asignatura'}
                  type="search"
                  value={courseFilters.query}
                  onChange={(event) => setCourseFilters((current) => ({ ...current, query: event.target.value }))}
                />
              </Field>
            )}
            summary={
              isStudent
                ? `${filteredCourses.length} paralelos disponibles`
                : `${filteredCourses.length} de ${courses.length} paralelos`
            }
            title={isStudent ? 'Buscar paralelos disponibles' : 'Filtrar paralelos'}
          >
              <Field label="Paralelo">
                <Select
                  value={courseFilters.course}
                  onChange={(event) => setCourseFilters((current) => ({ ...current, course: event.target.value }))}
                >
                  <option value="">Todos</option>
                  {courseFilterOptions.courses.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Asignatura">
                <Select
                  value={courseFilters.subject}
                  onChange={(event) => setCourseFilters((current) => ({ ...current, subject: event.target.value }))}
                >
                  <option value="">Todas</option>
                  {courseFilterOptions.subjects.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {canManage && (
                <Field label="Tutor de prácticas">
                  <Select
                    value={courseFilters.practiceTutor}
                    onChange={(event) => setCourseFilters((current) => ({ ...current, practiceTutor: event.target.value }))}
                  >
                    <option value="">Todos</option>
                    {courseFilterOptions.practiceTutors.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {canManage && (
                <Field label="Tutor institucional">
                  <Select
                    value={courseFilters.institutionalTutor}
                    onChange={(event) => setCourseFilters((current) => ({ ...current, institutionalTutor: event.target.value }))}
                  >
                    <option value="">Todos</option>
                    {courseFilterOptions.institutionalTutors.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {!isStudent && <Field label="Estado">
                <Select
                  disabled={!isAdmin}
                  value={!isAdmin ? 'true' : courseFilters.active}
                  onChange={(event) => setCourseFilters((current) => ({ ...current, active: event.target.value }))}
                >
                  {isAdmin && <option value="">Todos</option>}
                  <option value="true">Activos</option>
                  {isAdmin && <option value="false">Inactivos</option>}
                </Select>
              </Field>}
              {canManage && (
                <Field label="Inscripciones">
                  <Select
                    value={courseFilters.locked}
                    onChange={(event) => setCourseFilters((current) => ({ ...current, locked: event.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="true">Cerradas</option>
                    <option value="false">Abiertas</option>
                  </Select>
                </Field>
              )}
          </FilterPanel>

          <SectionCard title={isStudent ? 'Paralelos disponibles' : 'Paralelos'}>
            <DataTable columns={columns} loading={loading} rows={filteredCourses} />
          </SectionCard>
        </>
      )}

      <Modal
        description="Completa la información básica del paralelo sin salir del listado."
        maxWidth="max-w-5xl"
        onClose={() => setActiveView('courses')}
        open={activeView === 'create' && canManage}
        title="Crear paralelo"
      >
          <form className="grid gap-4 md:grid-cols-3" onSubmit={createCourse}>
            <Field label="Nombre">
              <Input
                value={form.name}
                onChange={(event) => setCourseFormField('name', event.target.value)}
                required
              />
            </Field>
            <Field label="Cupos">
              <Input
                type="number"
                value={form.capacity}
                onChange={(event) => setCourseFormField('capacity', event.target.value)}
                required
              />
            </Field>
            <Field label="Facultad">
              <EntitySelect
                path={ENTITY_RELATIONS.facultyId.path}
                placeholder={ENTITY_RELATIONS.facultyId.placeholder}
                value={form.facultyId}
                onChange={(value) => setCourseFormField('facultyId', value)}
              />
            </Field>
            <Field label="Carrera">
              <EntitySelect
                disabled={!form.facultyId}
                path={ENTITY_RELATIONS.careerId.path}
                placeholder={form.facultyId ? ENTITY_RELATIONS.careerId.placeholder : 'Selecciona primero una facultad'}
                value={form.careerId}
                rowFilter={(row) => hasMatchingId(row.facultyId, form.facultyId)}
                onChange={(value) => setCourseFormField('careerId', value)}
              />
            </Field>
            <Field label="Ciclo académico">
              <EntitySelect
                disabled={!form.careerId}
                path={ENTITY_RELATIONS.academicCycleId.path}
                placeholder={form.careerId ? ENTITY_RELATIONS.academicCycleId.placeholder : 'Selecciona primero una carrera'}
                value={form.academicCycleId}
                rowFilter={(row) => hasMatchingId(row.careerId, form.careerId)}
                onChange={(value) => setCourseFormField('academicCycleId', value)}
              />
            </Field>
            <Field label="Inicio">
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(event) => setCourseFormField('startDate', event.target.value)}
              />
            </Field>
            <Field label="Fin">
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(event) => setCourseFormField('endDate', event.target.value)}
              />
            </Field>
            <Field className="md:col-span-3" label="Descripción">
              <Textarea
                value={form.description}
                onChange={(event) => setCourseFormField('description', event.target.value)}
                required
              />
            </Field>
            <div className="md:col-span-3"><EntityImagePicker file={coverFile} onChange={setCoverFile} /></div>
            <div className="md:col-span-3">
            <PrimaryButton icon={Plus} loading={loading} type="submit">Crear paralelo</PrimaryButton>
            </div>
          </form>
      </Modal>

      {activeView === 'manage' && canUseCourse && (
        <SectionCard title="Gestión del paralelo">
          {canManage && <div className="mb-5 space-y-3"><EntityImagePicker key={courseId} file={editCoverFile} onChange={setEditCoverFile} currentPath={selectedCourse?.coverImageUrl} /><div className="flex flex-wrap gap-2"><SecondaryButton disabled={!editCoverFile || loading} onClick={() => updateCover()}>Guardar portada</SecondaryButton>{selectedCourse?.coverImageUrl && <SecondaryButton intent="danger" disabled={loading} onClick={() => updateCover(true)}>Quitar portada</SecondaryButton>}</div></div>}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Paralelo">
              <EntitySelect
                rows={courses}
                placeholder="Seleccionar paralelo"
                value={courseId}
                onChange={(value) => {
                  const course = courses.find((item) => String(item.id) === String(value));
                  setCoverFile(null);
                  setCourseId(value);
                  setCourseProfileForm(profileFromCourse(course));
                  setGroupId('');
                  setAssignmentGroupByEnrollmentId({});
                  setGroups([]);
                  setEnrollments([]);
                  if (value) {
                    refreshCourseManagement(value);
                  }
                }}
              />
            </Field>
            {canManage && (
              <Field label="Tutor de prácticas">
                <EntitySelect
                  path="/api/account/search?role=ROLE_TUTOR_PRACTICAS&page=0&size=100"
                  placeholder="Seleccionar tutor de prácticas"
                  value={accountId}
                  onChange={setAccountId}
                />
              </Field>
            )}
            {canManageGroups && (
              <>
                <Field label="Grupo">
                  <EntitySelect
                    rows={groups}
                    placeholder={groups.length ? 'Seleccionar grupo' : 'Crea un grupo para este paralelo'}
                    getOptionLabel={groupLabel}
                    value={groupId}
                    onChange={setGroupId}
                    disabled={!groups.length}
                  />
                </Field>
                <Field label="Tutor institucional del grupo">
                  <EntitySelect
                    path="/api/account/search?role=ROLE_TUTOR_INSTITUCIONAL&page=0&size=100"
                    placeholder="Seleccionar tutor institucional"
                    value={groupForm.institutionalTutorId}
                    onChange={(value) => setGroupForm((current) => ({ ...current, institutionalTutorId: value }))}
                  />
                </Field>
              </>
            )}
          </div>
          <div className="mt-4">
            <ActionBar>
              {(canManage || canPracticeTutor) && (
	                  <SecondaryButton
	                    disabled={loading || !courseId}
	                    icon={selectedCourseIsLocked ? Unlock : Lock}
	                    onClick={() =>
	                      runQuickCourseAction(`/api/courses/${courseId}/${selectedCourseIsLocked ? 'unlock' : 'lock'}`, [
	                        needsCourse,
	                      ], courseActionConfirmation({
                          title: selectedCourseIsLocked ? 'Abrir inscripciones' : 'Cerrar inscripciones',
                          description: selectedCourseIsLocked
                            ? 'El personal autorizado podrá asignar estudiantes a las prácticas de este paralelo.'
                            : 'No se admitirán nuevas inscripciones. Las prácticas ya asignadas continuarán su desarrollo.',
                          details: selectedCourse?.name,
                          confirmLabel: selectedCourseIsLocked ? 'Abrir inscripciones' : 'Cerrar inscripciones',
                          tone: selectedCourseIsLocked ? 'warning' : 'danger',
                        }))
	                    }
	                    type="button"
	                  >
	                    {selectedCourseIsLocked ? 'Abrir inscripciones' : 'Cerrar inscripciones'}
	                  </SecondaryButton>
              )}
              {canManage && (
	                <>
	                  <SecondaryButton
	                    disabled={loading || !courseId}
	                    icon={selectedCourseIsActive ? Ban : CheckCircle2}
	                    onClick={() =>
	                      runQuickCourseAction(`/api/courses/${courseId}/${selectedCourseIsActive ? 'disable' : 'enable'}`, [
	                        needsCourse,
	                      ], courseActionConfirmation({
                          title: selectedCourseIsActive ? 'Desactivar paralelo' : 'Activar paralelo',
                          description: selectedCourseIsActive
                            ? 'El paralelo dejara de estar disponible para nuevos procesos.'
                            : 'El paralelo volvera a estar disponible.',
                          details: selectedCourse?.name,
                          confirmLabel: selectedCourseIsActive ? 'Desactivar' : 'Activar',
                          tone: selectedCourseIsActive ? 'danger' : 'warning',
                        }))
	                    }
	                    type="button"
	                  >
	                    {selectedCourseIsActive ? 'Desactivar' : 'Activar'}
	                  </SecondaryButton>
                  <SecondaryButton
                    disabled={loading || !courseId || !accountId}
                    icon={UserPlus}
                    onClick={() =>
                      runQuickCourseAction(`/api/courses/${courseId}/practice-tutor/${accountId}`, [
                        needsCourse,
                        needsTutorAccount,
                      ], courseActionConfirmation({
                        title: 'Asignar tutor de prácticas',
                        description: 'El paralelo quedará asociado al tutor de prácticas seleccionado.',
                        details: selectedCourse?.name,
                        confirmLabel: 'Asignar tutor',
                        tone: 'warning',
                      }))
                    }
                    type="button"
                  >
                    Tutor prácticas
                  </SecondaryButton>
                </>
              )}
              {canManageGroups && (
                <>
                  <SecondaryButton
                    disabled={loading || !groupId || !groupForm.institutionalTutorId}
                    icon={Layers}
                    onClick={() =>
                      runQuickCourseAction(`/api/courses/groups/${groupId}/institutional-tutor/${groupForm.institutionalTutorId}`, [
                        { value: groupId, message: 'Selecciona un grupo antes de asignar tutor institucional' },
                        { value: groupForm.institutionalTutorId, message: 'Selecciona el tutor institucional del grupo' },
                      ], courseActionConfirmation({
                        title: 'Asignar tutor institucional',
                        description: 'El grupo quedará asociado al tutor institucional seleccionado.',
                        details: selectedGroup?.name,
                        confirmLabel: 'Asignar tutor',
                        tone: 'warning',
                      }))
                    }
                    type="button"
                  >
                    Tutor institucional del grupo
                  </SecondaryButton>
	                  <SecondaryButton
	                    disabled={loading || !groupId}
	                    icon={selectedGroupIsActive ? Ban : CheckCircle2}
	                    onClick={() =>
	                      runQuickCourseAction(`/api/courses/groups/${groupId}/${selectedGroupIsActive ? 'disable' : 'enable'}`, [
	                        { value: groupId, message: 'Selecciona un grupo antes de cambiar su estado' },
	                      ], courseActionConfirmation({
                          title: selectedGroupIsActive ? 'Desactivar grupo' : 'Activar grupo',
                          description: selectedGroupIsActive
                            ? 'El grupo dejara de estar disponible para nuevas asignaciones.'
                            : 'El grupo volvera a estar disponible.',
                          details: selectedGroup?.name,
                          confirmLabel: selectedGroupIsActive ? 'Desactivar grupo' : 'Activar grupo',
                          tone: selectedGroupIsActive ? 'danger' : 'warning',
                        }))
	                    }
	                    type="button"
	                  >
	                    {selectedGroupIsActive ? 'Desactivar grupo' : 'Activar grupo'}
	                  </SecondaryButton>
                </>
              )}
              {canPracticeTutor && (
                <SecondaryButton
                  disabled={loading || !courseId}
                  icon={CheckCircle2}
                  onClick={() => setManagementModal('practiceProfile')}
                  type="button"
                >
                  Datos comunes
                </SecondaryButton>
              )}
              <SecondaryButton disabled={loading || !courseId} icon={Eye} onClick={() => loadCourseEnrollments()} type="button">
                Ver inscritos
              </SecondaryButton>
            </ActionBar>
          </div>
          <div className="mt-5 border-t border-line pt-4 dark:border-line">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-heading dark:text-heading">Grupos del paralelo</h3>
              {canManageGroups && (
                <SecondaryButton disabled={loading || !courseId} icon={Plus} onClick={() => setManagementModal('group')} type="button">
                  Crear grupo
                </SecondaryButton>
              )}
            </div>
            <div className="mt-4">
              <DataTable columns={groupColumns} enableFilters={canUseCourse} loading={loading} rows={groups} />
            </div>
          </div>
        </SectionCard>
      )}

      <Modal
        description="Estos datos alimentan los documentos del estudiante para el paralelo seleccionado."
        maxWidth="max-w-5xl"
        onClose={() => setManagementModal('')}
        open={managementModal === 'practiceProfile'}
        title="Datos comunes del paralelo"
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={updatePracticeProfile}>
          <Field label="Unidad de organización curricular">
            <Input
              value={courseProfileForm.curricularOrganizationUnit}
              onChange={(event) =>
                setCourseProfileForm((current) => ({ ...current, curricularOrganizationUnit: event.target.value }))
              }
            />
          </Field>
          <Field label="Tipo de práctica">
            <Select
              value={courseProfileForm.practiceType}
              onChange={(event) => setCourseProfileForm((current) => ({ ...current, practiceType: event.target.value }))}
            >
              <option value="">Seleccionar tipo</option>
              <option value="OBSERVACION">Observación</option>
              <option value="ELABORACION">Elaboración</option>
              <option value="DOCENTE">Docente</option>
            </Select>
          </Field>
          <Field className="md:col-span-2" label="Proyecto integrador de saberes">
            <Textarea
              value={courseProfileForm.integrativeKnowledgeProject}
              onChange={(event) =>
                setCourseProfileForm((current) => ({ ...current, integrativeKnowledgeProject: event.target.value }))
              }
            />
          </Field>
          <Field className="md:col-span-2" label="Objetivo general">
            <Textarea
              value={courseProfileForm.generalObjective}
              onChange={(event) => setCourseProfileForm((current) => ({ ...current, generalObjective: event.target.value }))}
            />
          </Field>
          <Field label="Objetivo específico 1">
            <Textarea
              value={courseProfileForm.specificObjective1}
              onChange={(event) => setCourseProfileForm((current) => ({ ...current, specificObjective1: event.target.value }))}
            />
          </Field>
          <Field label="Objetivo específico 2">
            <Textarea
              value={courseProfileForm.specificObjective2}
              onChange={(event) => setCourseProfileForm((current) => ({ ...current, specificObjective2: event.target.value }))}
            />
          </Field>
          <Field className="md:col-span-2" label="Objetivo específico 3">
            <Textarea
              value={courseProfileForm.specificObjective3}
              onChange={(event) => setCourseProfileForm((current) => ({ ...current, specificObjective3: event.target.value }))}
            />
          </Field>
          <div className="md:col-span-2">
            <PrimaryButton disabled={loading || !courseId} icon={CheckCircle2} loading={loading} type="submit">
              Guardar datos comunes
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal
        description="Crea un grupo dentro del paralelo seleccionado y luego asígnale estudiantes desde inscripciones."
        maxWidth="max-w-4xl"
        onClose={() => setManagementModal('')}
        open={managementModal === 'group'}
        title="Crear grupo"
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={createCourseGroup}>
          <Field label="Letra del grupo">
            <Select
              value={groupForm.name}
              onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))}
              required
            >
              <option value="">Seleccionar letra</option>
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => (
                <option key={letter} value={letter}>
                  {letter}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cupos del grupo">
            <Input
              type="number"
              value={groupForm.capacity}
              onChange={(event) => setGroupForm((current) => ({ ...current, capacity: event.target.value }))}
            />
          </Field>
          <Field className="md:col-span-2" label="Descripción">
            <Input
              value={groupForm.description}
              onChange={(event) => setGroupForm((current) => ({ ...current, description: event.target.value }))}
            />
          </Field>
          <div className="md:col-span-2">
            <PrimaryButton disabled={loading || !courseId} icon={Plus} loading={loading} type="submit">
              Crear grupo
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      {activeView === 'manage' && canUseCourse && courseId && <PracticeOfferingsPanel key={`practices-${courseId}`} courseId={courseId} canCreate={canManage} onAssigned={() => refreshCourseManagement(courseId)} />}

      {activeView === 'manage' && canManage && courseId && <CourseRoster key={courseId} courseId={courseId} courseName={selectedCourse?.name} />}

      {activeView === 'enrollments' && (
      <SectionCard title={isStudent ? 'Mis inscripciones' : selectedCourse ? `Inscripciones de ${selectedCourse.name}` : 'Inscripciones'}>
        <DataTable columns={enrollmentColumns} contextColumns={!isStudent && courseId && selectedCourse ? ['courseName'] : []} ownRecords={isStudent} enableFilters={!isStudent} loading={loading} rows={enrollments} />
      </SectionCard>
      )}
    </>
  );
}

function courseActionConfirmation(options = {}) {
  return {
    title: 'Confirmar acción',
    description: 'Esta acción modificara información importante del paralelo o de una inscripción.',
    confirmLabel: 'Confirmar',
    tone: 'warning',
    ...options,
  };
}

function emptyCourseForm() {
  return {
    name: '',
    description: '',
    capacity: '',
    startDate: '',
    endDate: '',
    facultyId: '',
    careerId: '',
    academicCycleId: '',
  };
}

function applyCourseFormChange(form, name, value) {
  const next = { ...form, [name]: value };

  if (name === 'facultyId') {
    next.careerId = '';
    next.academicCycleId = '';
  }

  if (name === 'careerId') {
    next.academicCycleId = '';
  }

  return next;
}

function hasMatchingId(left, right) {
  return Boolean(right) && String(left ?? '') === String(right ?? '');
}

function cleanCoursePayload(form) {
  return {
    name: form.name,
    description: form.description,
    capacity: Number(form.capacity),
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    academicCycleId: Number(form.academicCycleId),
  };
}

function cleanGroupPayload(form) {
  return {
    name: form.name,
    description: form.description || null,
    capacity: form.capacity ? Number(form.capacity) : null,
    institutionalTutorId: form.institutionalTutorId ? Number(form.institutionalTutorId) : null,
  };
}

function emptyCoursePracticeProfile() {
  return {
    curricularOrganizationUnit: '',
    integrativeKnowledgeProject: '',
    practiceType: '',
    generalObjective: '',
    specificObjective1: '',
    specificObjective2: '',
    specificObjective3: '',
  };
}

function profileFromCourse(course) {
  return {
    curricularOrganizationUnit: course?.curricularOrganizationUnit || '',
    integrativeKnowledgeProject: course?.integrativeKnowledgeProject || '',
    practiceType: course?.practiceType || '',
    generalObjective: course?.generalObjective || '',
    specificObjective1: course?.specificObjective1 || '',
    specificObjective2: course?.specificObjective2 || '',
    specificObjective3: course?.specificObjective3 || '',
  };
}

function cleanCoursePracticeProfile(form) {
  return {
    curricularOrganizationUnit: form.curricularOrganizationUnit || null,
    integrativeKnowledgeProject: form.integrativeKnowledgeProject || null,
    practiceType: form.practiceType || null,
    generalObjective: form.generalObjective || null,
    specificObjective1: form.specificObjective1 || null,
    specificObjective2: form.specificObjective2 || null,
    specificObjective3: form.specificObjective3 || null,
  };
}

function filterCourseRow(row, filters) {
  if (!matchesOpenSearch([
    row.name,
    row.code,
    row.description,
    row.subject,
    row.practiceTutor,
    row.institutionalTutor,
    row.createdBy,
    row.practiceType,
    row.curricularOrganizationUnit,
    row.integrativeKnowledgeProject,
  ], filters.query)) {
    return false;
  }

  if (filters.course && row.name !== filters.course) {
    return false;
  }

  if (filters.subject && row.subject !== filters.subject) {
    return false;
  }

  if (filters.practiceTutor && row.practiceTutor !== filters.practiceTutor) {
    return false;
  }

  if (filters.institutionalTutor && row.institutionalTutor !== filters.institutionalTutor) {
    return false;
  }

  if (filters.active && booleanSelectValue(row.active) !== filters.active) {
    return false;
  }

  if (filters.locked && booleanSelectValue(row.locked) !== filters.locked) {
    return false;
  }

  return true;
}

function filterPracticeTutorCourses(courses, username) {
  if (!username) {
    return [];
  }

  return courses.filter((course) => String(course.practiceTutor || '') === String(username));
}

function countActiveFilters(filters, excludeKeys = []) {
  return Object.entries(filters || {})
    .filter(([key]) => !excludeKeys.includes(key))
    .filter(([, value]) => String(value || '').trim())
    .length;
}

function groupLabel(group) {
  if (!group) {
    return 'Grupo';
  }

  return group.institutionalTutor
    ? `${group.name} - ${group.institutionalTutor}`
    : group.name;
}

function isGroupAssignable(group) {
  return Boolean(group?.active && group?.institutionalTutor);
}

function groupAssignmentLabel(group) {
  const base = groupLabel(group);

  if (isGroupAssignable(group)) {
    return base;
  }

  return `${base} (no asignable)`;
}

function getGroupOptionsForEnrollment(enrollment, groups, assignableGroups) {
  const currentGroup = groups.find((group) => String(group.id) === String(enrollment.groupId));
  const options = [...assignableGroups];

  if (currentGroup && !options.some((group) => String(group.id) === String(currentGroup.id))) {
    options.unshift(currentGroup);
  }

  return options;
}

function getHashParams(hashValue = window.location.hash) {
  const query = String(hashValue || '').split('?')[1] || '';
  return new URLSearchParams(query);
}
