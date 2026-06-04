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
import { apiRequest, toQuery, unwrapPage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ENTITY_RELATIONS } from '../config/resources';
import { Alert } from '../components/ui/Alert';
import { ActionBar, PrimaryButton, SecondaryButton } from '../components/ui/ActionBar';
import { ActionMenu } from '../components/ui/ActionMenu';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { DataTable } from '../components/ui/DataTable';
import { EntitySelect } from '../components/ui/EntitySelect';
import { FilterPanel } from '../components/ui/FilterPanel';
import { Field, Input, Select, Textarea } from '../components/ui/FormControls';
import { Modal } from '../components/ui/Modal';
import { ModuleTab, ModuleTabs } from '../components/ui/ModuleTabs';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { booleanSelectValue, buildSelectOptions, matchesOpenSearch } from '../utils/filtering';
import { filterInactiveForNonAdmin } from '../utils/visibility';

export function CoursesPage() {
  const { token, roles, profile } = useAuth();
  const confirm = useConfirm();
  const isAdmin = roles.includes('ROLE_ADMIN');
  const canManage = isAdmin || roles.includes('ROLE_DIRECTOR_PRACTICAS');
  const canPracticeTutor = roles.includes('ROLE_TUTOR_PRACTICAS');
  const canManageGroups = isAdmin || canPracticeTutor;
  const canUseCourse = canManage || canPracticeTutor;
  const isStudent = roles.includes('ROLE_ESTUDIANTE');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courseId, setCourseId] = useState('');
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
  const [form, setForm] = useState(() => emptyCourseForm());
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
  const enrollmentByCourseId = useMemo(
    () =>
      new Map(
        enrollments
          .filter(isEnrollmentOperationallyActive)
          .filter((enrollment) => enrollment.courseId !== undefined && enrollment.courseId !== null)
          .map((enrollment) => [String(enrollment.courseId), enrollment])
      ),
    [enrollments]
  );
  const enrollmentByCourseName = useMemo(
    () =>
      new Map(
        enrollments
          .filter(isEnrollmentOperationallyActive)
          .filter((enrollment) => enrollment.courseName)
          .map((enrollment) => [normalizeCourseName(enrollment.courseName), enrollment])
      ),
    [enrollments]
  );

  // Calcular inscritos pendientes por paralelo
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

      const coursePayload = await apiRequest(
        courseListPath,
        { token }
      );

      const loadedCourses = canManage
        ? unwrapPage(coursePayload)
        : filterInactiveForNonAdmin(unwrapPage(coursePayload), roles);
      setCourses(canPracticeTutor && !canManage ? filterPracticeTutorCourses(loadedCourses, profile?.username) : loadedCourses);

      if (isStudent) {
        setEnrollments(filterInactiveForNonAdmin(await apiRequest('/api/enrollments/me', { token }), roles));
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token, roles, isAdmin, canManage, canPracticeTutor, isStudent, profile?.username]);

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
      setError('Selecciona la carrera y el ciclo academico del paralelo');
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
        body: cleanCoursePayload(form),
      });
      setForm(emptyCourseForm());
      await loadData();
      setActiveView('courses');
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
      setMessage('Accion ejecutada');
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
      description: 'Esta accion actualizara la organizacion del estudiante dentro del paralelo.',
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

  const showActionsColumn = courses.some((row) => {
    const studentAction = isStudent && !hasEnrollmentForCourse(row, enrollmentByCourseId, enrollmentByCourseName);
    return studentAction || canUseCourse;
  });

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Paralelo' },
    { key: 'code', header: 'Codigo' },
    { key: 'capacity', header: 'Cupos' },
    {
      key: 'state',
      header: 'Estado',
      render: (row) => (
        <ActionBar>
          <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} />
          {row.locked && <StatusBadge status="LOCKED" />}
        </ActionBar>
      ),
    },
    { key: 'practiceTutor', header: 'Tutor de prácticas', render: (row) => row.practiceTutor || '-' },
    {
      key: 'pendingEnrollments',
      header: 'Pendientes',
      render: (row) => {
        const pending = pendingEnrollmentsByCourse.get(String(row.id)) || 0;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${pending > 0 ? 'text-warning-strong dark:text-warning-strong' : 'text-muted'}`}>
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
  ];

  if (showActionsColumn) {
    columns.push({
      key: 'actions',
      header: 'Acciones',
      render: (row) => {
        const actions = [];

        if (canUseCourse) {
          actions.push({
            key: 'use',
            label: 'Abrir gestion',
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

          actions.push({
            key: row.locked ? 'unlock' : 'lock',
            label: row.locked ? 'Desbloquear' : 'Bloquear',
            icon: row.locked ? Unlock : Lock,
            onClick: () =>
              runCourseAction(
                `/api/courses/${row.id}/${row.locked ? 'unlock' : 'lock'}`,
                'PATCH',
                courseActionConfirmation({
                  title: row.locked ? 'Desbloquear paralelo' : 'Bloquear paralelo',
                  description: row.locked
                    ? 'El paralelo podra recibir cambios nuevamente.'
                    : 'El paralelo quedara protegido contra cambios operativos.',
                  details: row.name,
                  confirmLabel: row.locked ? 'Desbloquear' : 'Bloquear',
                  tone: row.locked ? 'warning' : 'danger',
                })
              ),
          });
        }

        if (isStudent && !hasEnrollmentForCourse(row, enrollmentByCourseId, enrollmentByCourseName)) {
          actions.push({
            key: 'enroll',
            label: 'Inscribirme',
            icon: UserPlus,
            onClick: () =>
              runCourseAction(
                `/api/courses/${row.id}/enroll`,
                'POST',
                courseActionConfirmation({
                  title: 'Confirmar inscripcion',
                  description: 'Se enviara tu solicitud de inscripcion a este paralelo.',
                  details: row.name,
                  confirmLabel: 'Inscribirme',
                  tone: 'warning',
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
      (row.status === 'PENDING' && (canManage || isStudent))
      || (canManageGroups && row.status === 'APPROVED')
      || ((canManage || canPracticeTutor) && ['APPROVED', 'COMPLETED'].includes(row.status))
  );

  const enrollmentColumns = [
    { key: 'id', header: 'ID' },
    { key: 'student', header: 'Estudiante' },
    { key: 'courseName', header: 'Paralelo' },
    { key: 'groupName', header: 'Grupo', render: (row) => row.groupName || '-' },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const groupColumns = [
    { key: 'name', header: 'Grupo' },
    { key: 'capacity', header: 'Cupos', render: (row) => row.capacity || '-' },
    { key: 'institutionalTutor', header: 'Tutor institucional', render: (row) => row.institutionalTutor || '-' },
    { key: 'educationalInstitutionName', header: 'Institucion', render: (row) => row.educationalInstitutionName || '-' },
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
        const actions = [];

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
                    title: 'Aprobar inscripcion',
                    description: 'El estudiante quedara aprobado en el paralelo seleccionado.',
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
                    title: 'Rechazar inscripcion',
                    description: 'La solicitud del estudiante sera rechazada.',
                    details: row.student || row.studentFullName || row.courseName,
                    confirmLabel: 'Rechazar',
                    tone: 'danger',
                  })
                ),
            }
          );
        }

        if (isStudent && row.status === 'PENDING') {
          actions.push({
            key: 'cancel',
            label: 'Cancelar',
            icon: XCircle,
            onClick: () =>
              runCourseAction(
                `/api/enrollments/${row.id}`,
                'DELETE',
                courseActionConfirmation({
                  title: 'Cancelar inscripcion',
                  description: 'Tu solicitud pendiente sera cancelada.',
                  details: row.courseName,
                  confirmLabel: 'Cancelar inscripcion',
                  tone: 'danger',
                })
              ),
          });
        }

        if ((canManage || canPracticeTutor) && row.status === 'APPROVED') {
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

        if ((canManage || canPracticeTutor) && row.status === 'COMPLETED') {
          actions.push({
            key: 'reopen',
            label: 'Reabrir práctica',
            icon: RotateCcw,
            onClick: () =>
              runCourseAction(
                `/api/enrollments/${row.id}/reopen`,
                'PATCH',
                courseActionConfirmation({
                  title: 'Reabrir práctica',
                  description: 'La práctica volverá a quedar como aprobada si el estudiante no tiene otra práctica activa.',
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
    message: 'Selecciona un paralelo antes de ejecutar esta accion',
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

  return (
    <>
      <PageHeader
        eyebrow="Practicas"
        title="Paralelos y prácticas"
        description="Busca paralelos, organiza grupos, asigna tutores y revisa el historial de prácticas."
        action={
          <SecondaryButton icon={RefreshCw} loading={loading} onClick={loadData} type="button">
            Actualizar
          </SecondaryButton>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <SectionCard>
        <ModuleTabs>
          {[
            ['courses', 'Paralelos'],
            canManage && ['create', 'Crear paralelo'],
            // Mostrar 'Gestion' e 'Inscripciones' solo si se seleccionó un paralelo.
            courseId && canUseCourse && ['manage', 'Gestion del paralelo'],
            (isStudent || courseId) && ['enrollments', isStudent ? 'Mis prácticas' : 'Inscripciones'],
          ]
            .filter(Boolean)
            .map(([id, label]) => (
              <ModuleTab
                active={activeView === id}
                key={id}
                onClick={() => {
                  setActiveView(id);
                  // Si volvemos a 'Paralelos' o 'Crear paralelo', limpiar la selección.
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
      </SectionCard>

      {/* Mostrar aviso para gestores cuando no hay paralelo seleccionado */}
      {!courseId && canUseCourse && (activeView === 'courses' || activeView === 'create') && (
        <SectionCard>
          <Alert tone="info">Abre la gestion de un paralelo para ver sus grupos e inscripciones.</Alert>
        </SectionCard>
      )}

      {(activeView === 'courses' || activeView === 'create') && (
        <>
          <FilterPanel
            activeCount={countActiveFilters(courseFilters, ['query'])}
            hasActiveFilters={countActiveFilters(courseFilters) > 0}
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
                  placeholder="Paralelo, codigo, tutor o asignatura"
                  type="search"
                  value={courseFilters.query}
                  onChange={(event) => setCourseFilters((current) => ({ ...current, query: event.target.value }))}
                />
              </Field>
            )}
            summary={`${filteredCourses.length} de ${courses.length} paralelos`}
            title="Filtrar paralelos"
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
                <Field label="Tutor de practicas">
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
              <Field label="Estado">
                <Select
                  disabled={!isAdmin}
                  value={!isAdmin ? 'true' : courseFilters.active}
                  onChange={(event) => setCourseFilters((current) => ({ ...current, active: event.target.value }))}
                >
                  {isAdmin && <option value="">Todos</option>}
                  <option value="true">Activos</option>
                  {isAdmin && <option value="false">Inactivos</option>}
                </Select>
              </Field>
              {canManage && (
                <Field label="Bloqueo">
                  <Select
                    value={courseFilters.locked}
                    onChange={(event) => setCourseFilters((current) => ({ ...current, locked: event.target.value }))}
                  >
                    <option value="">Todos</option>
                    <option value="true">Bloqueados</option>
                    <option value="false">Desbloqueados</option>
                  </Select>
                </Field>
              )}
          </FilterPanel>

          <SectionCard title="Paralelos">
            <DataTable columns={columns} loading={loading} rows={filteredCourses} />
          </SectionCard>
        </>
      )}

      <Modal
        description="Completa la informacion basica del paralelo sin salir del listado."
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
            <Field label="Ciclo academico">
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
            <Field className="md:col-span-3" label="Descripcion">
              <Textarea
                value={form.description}
                onChange={(event) => setCourseFormField('description', event.target.value)}
                required
              />
            </Field>
            <div className="md:col-span-3">
            <PrimaryButton icon={Plus} loading={loading} type="submit">Crear paralelo</PrimaryButton>
            </div>
          </form>
      </Modal>

      {activeView === 'manage' && canUseCourse && (
        <SectionCard title="Gestion del paralelo">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Paralelo">
              <EntitySelect
                rows={courses}
                placeholder="Seleccionar paralelo"
                value={courseId}
                onChange={(value) => {
                  const course = courses.find((item) => String(item.id) === String(value));
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
              <Field label="Tutor de practicas">
                <EntitySelect
                  path="/api/account/search?role=ROLE_TUTOR_PRACTICAS&page=0&size=100"
                  placeholder="Seleccionar tutor de practicas"
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
	                    disabled={loading || !courseId}
	                    icon={selectedCourseIsLocked ? Unlock : Lock}
	                    onClick={() =>
	                      runQuickCourseAction(`/api/courses/${courseId}/${selectedCourseIsLocked ? 'unlock' : 'lock'}`, [
	                        needsCourse,
	                      ], courseActionConfirmation({
                          title: selectedCourseIsLocked ? 'Desbloquear paralelo' : 'Bloquear paralelo',
                          description: selectedCourseIsLocked
                            ? 'El paralelo podra recibir cambios nuevamente.'
                            : 'El paralelo quedara protegido contra cambios operativos.',
                          details: selectedCourse?.name,
                          confirmLabel: selectedCourseIsLocked ? 'Desbloquear' : 'Bloquear',
                          tone: selectedCourseIsLocked ? 'warning' : 'danger',
                        }))
	                    }
	                    type="button"
	                  >
	                    {selectedCourseIsLocked ? 'Desbloquear' : 'Bloquear'}
	                  </SecondaryButton>
                  <SecondaryButton
                    disabled={loading || !courseId || !accountId}
                    icon={UserPlus}
                    onClick={() =>
                      runQuickCourseAction(`/api/courses/${courseId}/practice-tutor/${accountId}`, [
                        needsCourse,
                        needsTutorAccount,
                      ], courseActionConfirmation({
                        title: 'Asignar tutor de practicas',
                        description: 'El paralelo quedara asociado al tutor de practicas seleccionado.',
                        details: selectedCourse?.name,
                        confirmLabel: 'Asignar tutor',
                        tone: 'warning',
                      }))
                    }
                    type="button"
                  >
                    Tutor practicas
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
                        description: 'El grupo quedara asociado al tutor institucional seleccionado.',
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
              <h3 className="text-sm font-extrabold text-heading dark:text-heading">Grupos del paralelo</h3>
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
          <Field label="Unidad de organizacion curricular">
            <Input
              value={courseProfileForm.curricularOrganizationUnit}
              onChange={(event) =>
                setCourseProfileForm((current) => ({ ...current, curricularOrganizationUnit: event.target.value }))
              }
            />
          </Field>
          <Field label="Tipo de practica">
            <Select
              value={courseProfileForm.practiceType}
              onChange={(event) => setCourseProfileForm((current) => ({ ...current, practiceType: event.target.value }))}
            >
              <option value="">Seleccionar tipo</option>
              <option value="OBSERVACION">Observacion</option>
              <option value="ELABORACION">Elaboracion</option>
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
          <Field label="Objetivo especifico 1">
            <Textarea
              value={courseProfileForm.specificObjective1}
              onChange={(event) => setCourseProfileForm((current) => ({ ...current, specificObjective1: event.target.value }))}
            />
          </Field>
          <Field label="Objetivo especifico 2">
            <Textarea
              value={courseProfileForm.specificObjective2}
              onChange={(event) => setCourseProfileForm((current) => ({ ...current, specificObjective2: event.target.value }))}
            />
          </Field>
          <Field className="md:col-span-2" label="Objetivo especifico 3">
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
          <Field className="md:col-span-2" label="Descripcion">
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

      {activeView === 'enrollments' && (
      <SectionCard title={isStudent ? 'Mis inscripciones' : 'Inscripciones'}>
        <DataTable columns={enrollmentColumns} enableFilters={!isStudent} loading={loading} rows={enrollments} />
      </SectionCard>
      )}
    </>
  );
}

function courseActionConfirmation(options = {}) {
  return {
    title: 'Confirmar accion',
    description: 'Esta accion modificara informacion importante del paralelo o de una inscripcion.',
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

function hasEnrollmentForCourse(course, enrollmentByCourseId, enrollmentByCourseName) {
  if (enrollmentByCourseId.has(String(course.id))) {
    return true;
  }

  return enrollmentByCourseName.has(normalizeCourseName(course.name));
}

function isEnrollmentOperationallyActive(enrollment) {
  return ['PENDING', 'APPROVED'].includes(String(enrollment?.status || '').toUpperCase());
}

function normalizeCourseName(name) {
  return String(name || '').trim().toLowerCase();
}
