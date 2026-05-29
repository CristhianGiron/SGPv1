import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  SlidersHorizontal,
  List,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Send,
  XCircle,
} from "lucide-react";
import { apiBlob, apiRequest, unwrapPage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "./ui/Alert";
import { ActionBar, PrimaryButton, SecondaryButton } from "./ui/ActionBar";
import { ActionMenu } from "./ui/ActionMenu";
import { useConfirm } from "./ui/ConfirmDialog";
import { DataTable } from "./ui/DataTable";
import { EntitySelect } from "./ui/EntitySelect";
import { Field, Input, Select, Textarea } from "./ui/FormControls";
import { ModuleTab, ModuleTabs } from "./ui/ModuleTabs";
import { SectionCard } from "./ui/SectionCard";
import { StatusBadge } from "./ui/StatusBadge";
import {
  ActivityPlanScheduleMatrix,
  DataInspector,
  DocumentApprovalStatus,
} from "./DataInspector";
import { formatValue, labelFromKey } from "../utils/format";
import {
  cleanStructuredPayload,
  cloneStructuredValue,
  StructuredForm,
} from "./StructuredForm";
import { filterInactiveForNonAdmin } from "../utils/visibility";

export function EndpointConsole({
  modules,
  activeModuleId,
  showModuleSwitcher = true,
  enableListFilters = false,
}) {
  const { token, roles } = useAuth();
  const availableModules = useMemo(
    () =>
      modules.filter(
        (module) =>
          !module.roles || module.roles.some((role) => roles.includes(role)),
      ),
    [modules, roles],
  );
  const moduleIsControlled = activeModuleId !== undefined;
  const requestedModuleId = availableModules.some(
    (module) => module.id === activeModuleId,
  )
    ? activeModuleId
    : "";
  const [moduleId, setModuleId] = useState(availableModules[0]?.id || "");
  const currentModule =
    availableModules.find((module) => module.id === moduleId) ||
    availableModules[0];

  useEffect(() => {
    if (moduleIsControlled) {
      const nextModuleId = requestedModuleId || availableModules[0]?.id || "";

      if (moduleId !== nextModuleId) {
        setModuleId(nextModuleId);
      }

      return;
    }

    if (!availableModules.some((module) => module.id === moduleId)) {
      setModuleId(availableModules[0]?.id || "");
    }
  }, [availableModules, moduleId, moduleIsControlled, requestedModuleId]);

  if (!currentModule) {
    return (
      <Alert tone="warning">No hay secciones disponibles para tu perfil.</Alert>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-5">
      {showModuleSwitcher && availableModules.length > 1 && (
        <SectionCard
          description="Elige la seccion que necesitas revisar o completar."
          title="Seccion activa"
        >
          <ModuleTabs>
            {availableModules.map((module) => (
              <ModuleTab
                active={currentModule.id === module.id}
                key={module.id}
                onClick={() => setModuleId(module.id)}
              >
                {module.title}
              </ModuleTab>
            ))}
          </ModuleTabs>
        </SectionCard>
      )}

      <EndpointModule
        enableListFilters={enableListFilters}
        key={currentModule.id}
        module={currentModule}
        roles={roles}
        token={token}
      />
    </div>
  );
}

function canUse(roles, allowedRoles) {
  if (!allowedRoles?.length) {
    return true;
  }

  return allowedRoles.some((role) => roles.includes(role));
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const reviewChoiceBaseClass =
  "inline-flex min-h-[2.45rem] items-center gap-2 rounded-lg border border-[#cad8cf] bg-white px-3 py-2 text-sm font-[850] text-[#34443b] transition-colors hover:bg-[#f5faf7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-600 dark:bg-surface dark:text-ink dark:hover:bg-[#203026]";
const reviewChoiceActiveClass =
  "border-[#529914] bg-[#e4f0d8] text-primary-strong hover:bg-[#d8ecc8] dark:border-[#75c66a] dark:bg-[#203026] dark:text-[#bbf7d0] dark:hover:bg-[#2b3f31]";
const reviewChoiceWarningClass =
  "border-[#fde68a] bg-[#fffbeb] text-[#92400e] hover:bg-[#fef3c7] dark:border-amber-400/40 dark:bg-amber-950/25 dark:text-amber-200 dark:hover:bg-amber-950/35";
const reviewSectionClass =
  "overflow-hidden rounded-lg border border-border bg-white shadow-card dark:border-slate-700 dark:bg-surface dark:text-ink";
const reviewSectionHeaderClass =
  "border-b border-[#edf2ee] bg-[#f7f3ef] px-4 py-3 dark:border-slate-700 dark:bg-[#172033]";
const reviewFieldGridClass = "space-y-3";
const reviewFieldClass =
  "min-w-0 border-b border-[#edf2ee] pb-3 last:border-b-0 last:pb-0 dark:border-slate-700";
const reviewValueClass =
  "m-0 whitespace-pre-wrap break-words text-sm leading-6 text-[#1f2f27] dark:text-slate-50";
const reviewEmptyClass = "m-0 text-sm text-muted";
const reviewArrayItemClass =
  "space-y-3 rounded-lg border border-[#edf2ee] bg-[#fbfdfb] p-3 dark:border-slate-700 dark:bg-[#111827]";
const reviewArrayIndexClass =
  "text-[0.82rem] font-[850] text-primary-strong dark:text-[#bbf7d0]";
const feedbackIconBaseClass =
  "relative grid h-[2.1rem] w-[2.1rem] flex-none place-items-center rounded-full border border-[#b9ddcf] bg-white text-primary-strong transition-colors hover:border-primary hover:bg-[#e8f6f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-600 dark:bg-surface dark:text-[#bbf7d0] dark:hover:border-[#75c66a] dark:hover:bg-[#203026]";
const feedbackIconActiveClass =
  "border-primary bg-[#e8f6f0] dark:border-[#75c66a] dark:bg-[#203026]";
const feedbackIconNewClass =
  "after:absolute after:left-[1.4rem] after:top-[0.4rem] after:h-2 after:w-2 after:rounded-full after:bg-[#dc2626] after:ring-2 after:ring-white dark:after:ring-[#111827]";

function EndpointModule({ module, roles, token, enableListFilters }) {
  const confirm = useConfirm();
  const [confirmingSubmitId, setConfirmingSubmitId] = useState(null);
  const isStudent = roles.includes("ROLE_ESTUDIANTE");
  const accessibleAltLists = useMemo(
    () => (module.altLists || []).filter((item) => canUse(roles, item.roles)),
    [module.altLists, roles],
  );
  const visibleExtraActions = useMemo(
    () =>
      (module.extraActions || []).filter((action) =>
        canUse(roles, action.roles),
      ),
    [module.extraActions, roles],
  );
  const canCreate = Boolean(
    module.createPath && canUse(roles, module.createRoles),
  );
  const canUpdate = Boolean(
    module.updatePath && canUse(roles, module.updateRoles),
  );
  const canExportPdf = Boolean(module.pdfPath);
  const canSubmit = Boolean(
    module.submitPath && canUse(roles, module.submitRoles),
  );
  const canReview = Boolean(
    module.reviewPath && canUse(roles, module.reviewRoles),
  );
  const canListPrimary = Boolean(
    module.listPath && canUse(roles, module.listRoles),
  );
  const defaultListPath = canListPrimary
    ? module.listPath
    : accessibleAltLists[0]?.path;
  const showFormOperation = canCreate || canUpdate;
  const autoStudentEnrollment = isStudent && module.prefillFromEnrollment;
  const studentDirectDocumentMode =
    autoStudentEnrollment && canListPrimary && (canCreate || canUpdate);
  const initialActionBodies = useMemo(
    () =>
      Object.fromEntries(
        visibleExtraActions
          .filter((action) => action.body)
          .map((action) => [
            action.label,
            cloneStructuredValue(
              action.sample || module.reviewSample || { approved: null },
            ),
          ]),
      ),
    [module.reviewSample, visibleExtraActions],
  );
  const [rows, setRows] = useState([]);
  const [enrollmentRows, setEnrollmentRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [id, setId] = useState("");
  const [secondaryId, setSecondaryId] = useState("");
  const [body, setBody] = useState(cloneStructuredValue(module.sample || {}));
  const [reviewBody, setReviewBody] = useState(
    cloneStructuredValue(module.reviewSample || { approved: null }),
  );
  const [actionBodies, setActionBodies] = useState(initialActionBodies);
  const [loading, setLoading] = useState(false);
  const [listLoaded, setListLoaded] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [studentAutoOpenedKey, setStudentAutoOpenedKey] = useState("");
  const [hashValue, setHashValue] = useState(() => window.location.hash);
  const operationTabs = useMemo(
    () =>
      [
        !studentDirectDocumentMode && { id: "list", label: "Listado" },
        selected && { id: "detail", label: "Detalle" },
        showFormOperation && {
          id: "form",
          label: selected ? "Editar" : "Crear",
        },
        canReview && { id: "review", label: "Revisar" },
        visibleExtraActions.length && { id: "actions", label: "Acciones" },
      ].filter(Boolean),
    [
      canReview,
      selected,
      showFormOperation,
      studentDirectDocumentMode,
      visibleExtraActions.length,
    ],
  );
  const [activeOperation, setActiveOperation] = useState("list");
  const [listFilters, setListFilters] = useState({
    search: "",
    status: "",
    student: "",
    course: "",
    tutor: "",
    cycle: "",
  });
  const secondaryRows = getSecondaryRows(selected);
  const selectedEnrollmentId = body?.enrollmentId;
  const studentCreateNeedsEnrollment =
    autoStudentEnrollment && activeOperation === "form" && !id;
  const studentEnrollmentResolved =
    !studentCreateNeedsEnrollment || enrollmentRows.length === 1;
  const formHiddenFields = useMemo(
    () => [
      ...(module.hiddenFields || []),
      // Cambio solicitado: los datos precargados se conservan en el body,
      // pero no se muestran para que el formulario solo pida campos editables.
      ...(module.prefillFromEnrollment ? module.readOnlyFields || [] : []),
      ...(autoStudentEnrollment ? ["enrollmentId"] : []),
    ],
    [
      autoStudentEnrollment,
      module.hiddenFields,
      module.prefillFromEnrollment,
      module.readOnlyFields,
    ],
  );
  const formRelations = useMemo(() => {
    const relations = {
      schedulePeriodId: {
        label: "Periodo de horario",
        placeholder: selected
          ? "Seleccionar periodo"
          : "Selecciona primero un horario",
        rows: selected?.periods || [],
        disabled: !selected?.periods?.length,
        getOptionLabel: periodLabel,
      },
      entryId: {
        label: "Actividad registrada",
        placeholder: selected
          ? "Seleccionar actividad"
          : "Selecciona primero un registro",
        rows: selected?.entries || [],
        disabled: !selected?.entries?.length,
        getOptionLabel: entryLabel,
      },
    };

    if (module.prefillFromEnrollment && !isStudent) {
      relations.enrollmentId = {
        label: "Inscripcion",
        placeholder:
          enrollmentRows.length === 0
            ? "No hay inscripciones aprobadas"
            : enrollmentRows.length === 1
              ? "Se usará tu inscripción aprobada"
              : "Selecciona tu inscripción aprobada",
        rows: enrollmentRows,
        disabled: isStudent
          ? enrollmentRows.length === 1
          : !enrollmentRows.length,
        getOptionLabel: enrollmentLabel,
      };
    }

    return relations;
  }, [enrollmentRows, module.prefillFromEnrollment, selected, isStudent]);
  const filteredRows = useMemo(
    () => filterListRows(rows, listFilters),
    [rows, listFilters],
  );
  const listFilterOptions = useMemo(
    () => ({
      statuses: buildFilterOptions(rows, getStatusFilterValue, (value) =>
        formatValue(value, "status"),
      ),
      students: buildFilterOptions(rows, getStudentFilterValue),
      courses: buildFilterOptions(rows, getCourseFilterValue),
      tutors: buildMultiFilterOptions(rows, getTutorFilterValues),
      cycles: buildFilterOptions(rows, getAcademicCycleFilterValue),
    }),
    [rows],
  );

  function updateListFilter(key, value) {
    setListFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function clearListFilters() {
    setListFilters({
      search: "",
      status: "",
      student: "",
      course: "",
      tutor: "",
      cycle: "",
    });
  }

  async function load(path = defaultListPath) {
    if (!path) {
      return;
    }

    setLoading(true);
    setListLoaded(false);
    setError("");

    try {
      const payload = await apiRequest(path, { token });
      const loaded = unwrapPage(payload);
      const visibleRows = module.preserveInactiveRows
        ? loaded
        : filterInactiveForNonAdmin(loaded, roles);

      setRows(visibleRows);
      setMessage("Datos cargados");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setListLoaded(true);
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.id, token, defaultListPath]);

  useEffect(() => {
    function handleHashChange() {
      setHashValue(window.location.hash);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    let active = true;

    if (!module.prefillFromEnrollment) {
      setEnrollmentRows([]);
      setEnrollmentLoading(false);
      return undefined;
    }

    async function loadEnrollmentsForPrefill() {
      setEnrollmentLoading(true);

      try {
        const payload = await apiRequest(
          module.prefillEnrollmentPath || "/api/enrollments/me",
          { token },
        );
        const approvedEnrollments = filterInactiveForNonAdmin(
          unwrapPage(payload),
          roles,
        ).filter(isActiveApprovedEnrollment);

        if (active) {
          setEnrollmentRows(approvedEnrollments);
        }
      } catch (requestError) {
        if (active) {
          setEnrollmentRows([]);
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setEnrollmentLoading(false);
        }
      }
    }

    loadEnrollmentsForPrefill();

    return () => {
      active = false;
    };
  }, [module, roles, token]);

  useEffect(() => {
    if (
      !autoStudentEnrollment ||
      activeOperation !== "form" ||
      id ||
      enrollmentRows.length !== 1
    ) {
      return;
    }

    const enrollment = enrollmentRows[0];

    setBody((current) => {
      if (String(current?.enrollmentId) === String(enrollment.id)) {
        return current;
      }

      const nextBody = {
        ...current,
        enrollmentId: enrollment.id,
      };

      fillEnrollmentInstitutionFields(nextBody, enrollment);

      return nextBody;
    });
  }, [activeOperation, autoStudentEnrollment, enrollmentRows, id]);

  useEffect(() => {
    let active = true;

    if (
      !module.prefillFromEnrollment ||
      !module.defaultsPath ||
      activeOperation !== "form" ||
      id
    ) {
      return undefined;
    }

    async function loadDocumentDefaults() {
      try {
        const effectiveEnrollmentId =
          selectedEnrollmentId ||
          (isStudent && enrollmentRows.length === 1
            ? enrollmentRows[0].id
            : undefined);
        if (!effectiveEnrollmentId) {
          return;
        }

        const path =
          typeof module.defaultsPath === "function"
            ? module.defaultsPath(effectiveEnrollmentId)
            : module.defaultsPath;
        const payload = await apiRequest(path, { token });

        if (active) {
          setBody((current) =>
            String(current?.enrollmentId) === String(effectiveEnrollmentId) ||
            (!current?.enrollmentId && isStudent)
              ? mergeEditableValues(current, payload)
              : current,
          );
          setMessage("Datos precargados desde la inscripción");
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      }
    }

    loadDocumentDefaults();

    return () => {
      active = false;
    };
  }, [
    activeOperation,
    id,
    module,
    selectedEnrollmentId,
    token,
    enrollmentRows,
    isStudent,
  ]);

  useEffect(() => {
    if (!operationTabs.some((tab) => tab.id === activeOperation)) {
      setActiveOperation(operationTabs[0]?.id || "list");
    }
  }, [activeOperation, operationTabs]);

  useEffect(() => {
    setActiveOperation(studentDirectDocumentMode ? "form" : "list");
    setStudentAutoOpenedKey("");
    setListLoaded(false);
  }, [module.id, studentDirectDocumentMode]);

  useEffect(() => {
    if (
      !studentDirectDocumentMode ||
      !listLoaded ||
      loading ||
      enrollmentLoading
    ) {
      return;
    }

    const params = getHashParams(hashValue);

    if (params.get("recordId") || params.get("id")) {
      return;
    }

    if (rows.length > 0) {
      const firstRecord = rows[0];
      const nextKey = `${module.id}:${firstRecord.id || "record"}`;

      if (studentAutoOpenedKey === nextKey) {
        return;
      }

      setStudentAutoOpenedKey(nextKey);
      openRecord(firstRecord, "detail");
      return;
    }

    const nextKey = `${module.id}:create`;

    if (studentAutoOpenedKey === nextKey) {
      return;
    }

    setStudentAutoOpenedKey(nextKey);
    startCreate();
    // El auto-flujo debe depender del estado cargado, no de la identidad de handlers recreados en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enrollmentLoading,
    hashValue,
    listLoaded,
    loading,
    module.id,
    rows,
    studentAutoOpenedKey,
    studentDirectDocumentMode,
  ]);

  useEffect(() => {
    const params = getHashParams(hashValue);
    const recordId = params.get("recordId") || params.get("id");
    const requestedOperation = normalizeDeepLinkOperation(
      params.get("operation"),
    );

    if (!recordId || !module.getPath) {
      return undefined;
    }

    let active = true;

    async function loadDeepLinkedRecord() {
      setLoading(true);
      setError("");
      setMessage("");
      setId(recordId);
      setSecondaryId("");

      try {
        const payload = await apiRequest(module.getPath(recordId), { token });

        if (!active) {
          return;
        }

        setSelected(payload);
        setBody(mergeEditableValues(module.sample || {}, payload));

        if (requestedOperation === "review") {
          setReviewBody(buildReviewValue(module, payload, roles));
        }

        setActiveOperation(requestedOperation);
        setMessage("Registro cargado");
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDeepLinkedRecord();

    return () => {
      active = false;
    };
  }, [hashValue, module, roles, token]);

  async function submitStructured(
    path,
    method,
    structuredBody = body,
    successMessage = "Operacion completada",
  ) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const payload = await apiRequest(path, {
        method,
        token,
        body: cleanStructuredPayload(structuredBody),
      });
      setSelected(payload || null);
      if (payload?.id) {
        setId(payload.id);
      }
      if (payload && activeOperation === "review") {
        setReviewBody(buildReviewValue(module, payload, roles));
      }
      await load();
      setMessage(successMessage);
      return payload || true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  function resolveReviewPath(recordId = id) {
    if (!module.reviewPath || !recordId) {
      return "";
    }

    return typeof module.reviewPath === "function"
      ? module.reviewPath(recordId, roles)
      : module.reviewPath;
  }

  async function submitReviewPatch(
    patch,
    successMessage = "Retroalimentacion enviada",
  ) {
    const path = resolveReviewPath();

    if (!path) {
      return false;
    }

    return submitStructured(
      path,
      "PATCH",
      normalizeReviewBody(patch),
      successMessage,
    );
  }

  async function submitRecord(record) {
    if (!record?.id || !module.submitPath) {
      return;
    }

    if (confirmingSubmitId === record.id) {
      return;
    }

    setConfirmingSubmitId(record.id);

    try {
      const accepted = await confirm({
        title: "Enviar documento",
        description:
          "El documento se enviara a revision. Despues de enviarlo, los revisores autorizados podran revisarlo.",
        details: module.title || "Documento de practica",
        confirmLabel: "Enviar a revision",
        tone: "warning",
      });

      if (!accepted) {
        return;
      }

      setId(record.id);
      setSelected(record);
      await submitNoBody(module.submitPath(record.id), "PATCH");
    } finally {
      setConfirmingSubmitId(null);
    }
  }

  async function downloadPdf(record) {
    if (!record?.id || !module.pdfPath) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const blob = await apiBlob(module.pdfPath(record.id), token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${module.id}-${record.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("PDF generado");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitNoBody(path, method = "PATCH") {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const payload = await apiRequest(path, {
        method,
        token,
      });
      setSelected(payload || null);
      await load();
      setMessage("Operacion completada");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function selectRecord(recordId) {
    const row = rows.find((item) => String(item.id) === String(recordId));

    setId(recordId);
    setSecondaryId("");

    if (row) {
      setSelected(row);
      setBody(mergeEditableValues(module.sample || {}, row));
    } else {
      setSelected(null);
      setBody(cloneStructuredValue(module.sample || {}));
    }

    if (!recordId || !module.getPath) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = await apiRequest(module.getPath(recordId), { token });
      setSelected(payload);
      setBody(mergeEditableValues(module.sample || {}, payload));
      if (activeOperation === "review") {
        setReviewBody(buildReviewValue(module, payload, roles));
      } else if (activeOperation === "actions") {
        setActionBodies(
          buildActionBodiesForRecord(
            visibleExtraActions,
            module,
            payload,
            roles,
          ),
        );
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function openRecord(row, operation = "detail") {
    setSelected(row);
    setId(row.id);
    setSecondaryId("");
    setBody(mergeEditableValues(module.sample || {}, row));
    if (operation === "review") {
      setReviewBody(buildReviewValue(module, row, roles));
    } else if (operation === "actions") {
      setActionBodies(
        buildActionBodiesForRecord(visibleExtraActions, module, row, roles),
      );
    }
    setActiveOperation(operation);

    if (!module.getPath || !row?.id) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Cambio solicitado: el detalle de documentos debe mostrar el registro completo, no solo la fila resumida.
      const payload = await apiRequest(module.getPath(row.id), { token });
      setSelected(payload);
      setBody(mergeEditableValues(module.sample || {}, payload));
      if (operation === "review") {
        setReviewBody(buildReviewValue(module, payload, roles));
      } else if (operation === "actions") {
        setActionBodies(
          buildActionBodiesForRecord(
            visibleExtraActions,
            module,
            payload,
            roles,
          ),
        );
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    const nextBody = cloneStructuredValue(module.sample || {});

    if (
      module.prefillFromEnrollment &&
      enrollmentRows.length === 1 &&
      isStudent
    ) {
      nextBody.enrollmentId = enrollmentRows[0].id;
      fillEnrollmentInstitutionFields(nextBody, enrollmentRows[0]);
    } else if (module.prefillFromEnrollment && enrollmentRows.length === 1) {
      // non-student single enrollment fallback
      nextBody.enrollmentId = enrollmentRows[0].id;
    }

    setSelected(null);
    setId("");
    setSecondaryId("");
    setBody(nextBody);
    setActiveOperation("form");
  }

  const columns = [
    { key: "id", header: "ID" },
    {
      key: "courseName",
      header: "Curso",
      render: (row) => row.courseName || row.name || "-",
    },
    {
      key: "student",
      header: "Estudiante",
      render: (row) =>
        row.studentFullName || row.studentUsername || row.student || "-",
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => <StatusBadge status={row.status || row.active} />,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (row) => (
        <ActionMenu
          actions={[
            {
              key: "view",
              label: "Ver",
              icon: Eye,
              onClick: () => openRecord(row),
            },
            ...(canUpdate && canEditRecord(row)
              ? [
                  {
                    key: "edit",
                    label: "Editar",
                    icon: Pencil,
                    onClick: () => openRecord(row, "form"),
                  },
                ]
              : []),
            ...(canSubmit && canSubmitRecord(row)
              ? [
                  {
                    key: "submit",
                    label: "Enviar",
                    icon: Send,
                    onClick: () => {
                      window.setTimeout(() => {
                        submitRecord(row);
                      }, 0);
                    },
                  },
                ]
              : []),
            ...(canReview && canReviewRecord(row)
              ? [
                  {
                    key: "review",
                    label: "Revisar",
                    icon: CheckCircle2,
                    onClick: () => openRecord(row, "review"),
                  },
                ]
              : []),
            ...(canExportPdf && canExportPdfRecord(row)
              ? [
                  {
                    key: "pdf",
                    label: "PDF",
                    icon: Download,
                    onClick: () => downloadPdf(row),
                  },
                ]
              : []),
            ...(visibleExtraActions.length > 0
              ? [
                  {
                    key: "extra-actions",
                    label: "Acciones",
                    icon: CheckCircle2,
                    onClick: () => openRecord(row, "actions"),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <SectionCard>
        <ModuleTabs>
          {operationTabs.map((tab) => (
            <ModuleTab
              active={activeOperation === tab.id}
              key={tab.id}
              onClick={() => setActiveOperation(tab.id)}
            >
              {tab.label}
            </ModuleTab>
          ))}
        </ModuleTabs>
      </SectionCard>

      {activeOperation === "list" && (
        <SectionCard
          title={module.title}
          action={
            <ActionBar>
              {canCreate && (
                <PrimaryButton icon={Plus} onClick={startCreate} type="button">
                  Crear
                </PrimaryButton>
              )}
              {canListPrimary && (
                <SecondaryButton
                  icon={List}
                  loading={loading}
                  onClick={() => load()}
                  type="button"
                >
                  Listar
                </SecondaryButton>
              )}
              {accessibleAltLists.map((item) => (
                <SecondaryButton
                  disabled={loading}
                  icon={RefreshCw}
                  key={item.label}
                  onClick={() => load(item.path)}
                  type="button"
                >
                  {item.label}
                </SecondaryButton>
              ))}
            </ActionBar>
          }
        >
          <div className="min-w-0 max-w-full space-y-3">
            {error && <Alert tone="error">{error}</Alert>}
            {message && <Alert tone="success">{message}</Alert>}
            {enableListFilters && (
              <ListFilters
                filters={listFilters}
                options={listFilterOptions}
                totalCount={rows.length}
                visibleCount={filteredRows.length}
                onChange={updateListFilter}
                onClear={clearListFilters}
              />
            )}
            <DataTable
              columns={columns}
              emptyText={
                hasActiveFilters(listFilters)
                  ? "No se encontraron resultados con los filtros aplicados."
                  : "Aun no hay documentos para mostrar."
              }
              loading={loading}
              rows={enableListFilters ? filteredRows : rows}
            />
          </div>
        </SectionCard>
      )}

      {activeOperation !== "list" && (
        <SectionCard
          title={getOperationTitle(activeOperation, selected)}
          action={
            !studentDirectDocumentMode && (
              <SecondaryButton
                icon={List}
                onClick={() => setActiveOperation("list")}
                type="button"
              >
                Volver al listado
              </SecondaryButton>
            )
          }
        >
          <div className="min-w-0 max-w-full space-y-4">
            {error && <Alert tone="error">{error}</Alert>}
            {message && <Alert tone="success">{message}</Alert>}

            {activeOperation !== "detail" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {!(isStudent && activeOperation === "form") && (
                  <Field label="Registro">
                    <EntitySelect
                      rows={rows}
                      placeholder="Seleccionar registro"
                      value={id}
                      onChange={selectRecord}
                    />
                  </Field>
                )}
                {module.secondaryLabel && (
                  <Field label={module.secondaryLabel}>
                    <EntitySelect
                      disabled={!secondaryRows.length}
                      getOptionLabel={secondaryLabel}
                      rows={secondaryRows}
                      placeholder={
                        secondaryRows.length
                          ? `Seleccionar ${module.secondaryLabel.toLowerCase()}`
                          : "Selecciona primero un registro"
                      }
                      value={secondaryId}
                      onChange={setSecondaryId}
                    />
                  </Field>
                )}
              </div>
            )}

            {activeOperation === "detail" && (
              <div className="min-w-0 max-w-full space-y-4">
                <DataInspector data={selected} moduleId={module.id} />
                {((canUpdate && canEditRecord(selected)) ||
                  (canSubmit && canSubmitRecord(selected)) ||
                  (canExportPdf && canExportPdfRecord(selected))) && (
                  <ActionBar>
                    {canUpdate && canEditRecord(selected) && (
                      <SecondaryButton
                        disabled={
                          loading || confirmingSubmitId === selected?.id || !id
                        }
                        icon={Pencil}
                        onClick={() => setActiveOperation("form")}
                        type="button"
                      >
                        Editar
                      </SecondaryButton>
                    )}
                    {canSubmit && canSubmitRecord(selected) && (
                      <SecondaryButton
                        disabled={loading || !id}
                        icon={Send}
                        loading={loading}
                        onClick={() => submitRecord(selected)}
                        type="button"
                      >
                        Enviar
                      </SecondaryButton>
                    )}
                    {canExportPdf && canExportPdfRecord(selected) && (
                      <SecondaryButton
                        disabled={loading || !id}
                        icon={Download}
                        loading={loading}
                        onClick={() => downloadPdf(selected)}
                        type="button"
                      >
                        PDF
                      </SecondaryButton>
                    )}
                  </ActionBar>
                )}
              </div>
            )}

            {activeOperation === "form" && (
              <div className="space-y-4">
                {selected && <DocumentApprovalStatus data={selected} />}
                {studentCreateNeedsEnrollment && enrollmentLoading && (
                  <Alert tone="info">
                    Preparando los datos del curso activo...
                  </Alert>
                )}
                {studentCreateNeedsEnrollment &&
                  !enrollmentLoading &&
                  enrollmentRows.length === 0 && (
                    <Alert tone="info">
                      No tienes una inscripcion aprobada en un curso activo para
                      completar este documento.
                    </Alert>
                  )}
                {studentCreateNeedsEnrollment &&
                  !enrollmentLoading &&
                  enrollmentRows.length > 1 && (
                    <Alert tone="warning">
                      Hay mas de una inscripcion aprobada en cursos activos.
                      Revisa las inscripciones para completar este documento.
                    </Alert>
                  )}
                {studentEnrollmentResolved && (
                  <StructuredForm
                    hiddenFields={formHiddenFields}
                    readOnlyFields={module.readOnlyFields || []}
                    relations={formRelations}
                    value={body}
                    onChange={setBody}
                  />
                )}

                <ActionBar>
                  {(id ? canUpdate : canCreate) && (
                    <PrimaryButton
                      disabled={
                        loading ||
                        !studentEnrollmentResolved ||
                        (!id && !canCreate) ||
                        (id && !canUpdate)
                      }
                      icon={Save}
                      loading={loading}
                      onClick={async () => {
                        let result = false;

                        if (id && canUpdate) {
                          result = await submitStructured(
                            module.updatePath(id),
                            module.updateMethod || "PUT",
                          );
                        } else if (!id && canCreate) {
                          result = await submitStructured(
                            module.createPath,
                            "POST",
                          );
                        }

                        if (result) {
                          setActiveOperation("detail");
                        }
                      }}
                      type="button"
                    >
                      {id ? "Guardar cambios" : "Guardar"}
                    </PrimaryButton>
                  )}
                </ActionBar>
              </div>
            )}

            {activeOperation === "review" && canReview && (
              <div className="space-y-4">
                <ReviewFeedbackForm
                  module={module}
                  record={selected}
                  value={reviewBody}
                  onChange={setReviewBody}
                  onSendFeedback={submitReviewPatch}
                  onSubmitDecision={async (approved) => {
                    const accepted = await confirm(
                      reviewDecisionConfirmation(approved, module),
                    );

                    if (!accepted) {
                      return false;
                    }

                    return submitReviewPatch(
                      { approved },
                      approved
                        ? "Decision guardada: documento aprobado"
                        : "Decision guardada: se solicitaron correcciones",
                    );
                  }}
                />
              </div>
            )}

            {activeOperation === "actions" && (
              <div className="space-y-4">
                {visibleExtraActions.map((action) => (
                  <div
                    className="border-t border-[#c8d2cd] pt-4 first:border-t-0 first:pt-0 dark:border-slate-700"
                    key={action.label}
                  >
                    {action.body ? (
                      <div className="space-y-3">
                        <h3 className="text-sm font-extrabold text-[#20282d] dark:text-slate-50">
                          {action.label}
                        </h3>
                        {isFeedbackReviewBody(actionBodies[action.label]) ? (
                          <ReviewFeedbackForm
                            module={module}
                            record={selected}
                            value={actionBodies[action.label] || {}}
                            onChange={(nextValue) =>
                              setActionBodies((current) => ({
                                ...current,
                                [action.label]: nextValue,
                              }))
                            }
                            onSendFeedback={(
                              patch,
                              successMessage = "Retroalimentacion enviada",
                            ) =>
                              submitStructured(
                                action.path(id, secondaryId, roles),
                                action.method || "PATCH",
                                normalizeReviewBody(patch),
                                successMessage,
                              )
                            }
                            onSubmitDecision={async (approved) => {
                              const accepted = await confirm(
                                reviewDecisionConfirmation(approved, module),
                              );

                              if (!accepted) {
                                return false;
                              }

                              return submitStructured(
                                action.path(id, secondaryId, roles),
                                action.method || "PATCH",
                                normalizeReviewBody({ approved }),
                                approved
                                  ? "Decision guardada: documento aprobado"
                                  : "Decision guardada: se solicitaron correcciones",
                              );
                            }}
                          />
                        ) : (
                          <StructuredForm
                            relations={formRelations}
                            value={actionBodies[action.label] || {}}
                            onChange={(nextValue) =>
                              setActionBodies((current) => ({
                                ...current,
                                [action.label]: nextValue,
                              }))
                            }
                          />
                        )}
                        {!isFeedbackReviewBody(actionBodies[action.label]) && (
                          <SecondaryButton
                            disabled={
                              loading ||
                              (action.needsId && !id) ||
                              (action.needsSecondaryId && !secondaryId)
                            }
                            icon={CheckCircle2}
                            onClick={async () => {
                              const accepted = await confirm(
                                importantActionConfirmation(
                                  action.label,
                                  module.title,
                                ),
                              );

                              if (!accepted) {
                                return;
                              }

                              return submitStructured(
                                action.path(id, secondaryId, roles),
                                action.method || "PATCH",
                                actionBodies[action.label] || {},
                                "Operacion completada",
                              );
                            }}
                            type="button"
                          >
                            {action.label}
                          </SecondaryButton>
                        )}
                      </div>
                    ) : (
                      <SecondaryButton
                        disabled={
                          loading ||
                          (action.needsId && !id) ||
                          (action.needsSecondaryId && !secondaryId)
                        }
                        icon={CheckCircle2}
                        onClick={async () => {
                          const accepted = await confirm(
                            importantActionConfirmation(
                              action.label,
                              module.title,
                            ),
                          );

                          if (!accepted) {
                            return;
                          }

                          submitNoBody(
                            action.path(id, secondaryId, roles),
                            action.method || "PATCH",
                          );
                        }}
                        type="button"
                      >
                        {action.label}
                      </SecondaryButton>
                    )}
                  </div>
                ))}
                {!visibleExtraActions.length && (
                  <Alert tone="info">
                    No hay acciones adicionales disponibles.
                  </Alert>
                )}
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function reviewDecisionConfirmation(approved, module) {
  const approving = approved === true;

  return {
    title: approving ? "Aprobar documento" : "Solicitar correcciones",
    description: approving
      ? "Esta decision marcara tu aprobacion sobre el documento seleccionado."
      : "Esta decision devolvera el documento para que el estudiante realice correcciones.",
    details: module?.title || "Documento de practica",
    confirmLabel: approving ? "Confirmar aprobacion" : "Confirmar correcciones",
    tone: approving ? "success" : "danger",
  };
}

function importantActionConfirmation(label = "Confirmar accion", detail = "") {
  const destructive = /eliminar|rechazar|correccion|desactivar|bloquear/i.test(
    label,
  );

  return {
    title: label,
    description:
      "Esta accion cambiara informacion importante del registro seleccionado.",
    details: detail,
    confirmLabel: label,
    tone: destructive ? "danger" : "warning",
  };
}

function ReviewFeedbackForm({
  module,
  record,
  value,
  onChange,
  onSendFeedback,
  onSubmitDecision,
}) {
  if (!record) {
    return <Alert tone="info">Selecciona un registro para revisar.</Alert>;
  }

  const reviewValue = value || {};
  const sections = getReviewSections(module.id, record, reviewValue);
  const decisionState = reviewDecisionState(reviewValue.approved);
  const handledFeedbackKeys = new Set(
    sections.flatMap(
      (section) => section.feedbackKeys || [section.feedbackKey],
    ),
  );
  const fallbackFeedbackKeys = Object.keys(reviewValue).filter(
    (key) =>
      key !== "approved" &&
      /Feedback$/.test(key) &&
      !handledFeedbackKeys.has(key),
  );

  function setReviewField(key, nextValue) {
    onChange({
      ...reviewValue,
      [key]: nextValue,
    });
  }

  function submitDecision(approved) {
    setReviewField("approved", approved);
    onSubmitDecision?.(approved);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2" aria-label="Decision de revision">
          <button
            aria-pressed={reviewValue.approved === true}
            className={`${reviewChoiceBaseClass} ${reviewValue.approved === true ? reviewChoiceActiveClass : ""}`}
            onClick={() => submitDecision(true)}
            title="Aprobar documento"
            type="button"
          >
            <CheckCircle2 size={16} />
            Aprobar
          </button>
          <button
            aria-pressed={reviewValue.approved === false}
            className={`${reviewChoiceBaseClass} ${reviewValue.approved === false ? reviewChoiceWarningClass : ""}`}
            onClick={() => submitDecision(false)}
            title="Solicitar correcciones"
            type="button"
          >
            <XCircle size={16} />
            Solicitar correcciones
          </button>
        </div>

        <div
          aria-live="polite"
          className={cx(
            "rounded-lg border px-3 py-2 text-sm leading-5",
            decisionState.tone === "success" &&
              "border-[#b9ddcf] bg-[#eef9f1] text-[#14532d] dark:border-[#75c66a]/40 dark:bg-green-950/30 dark:text-green-200",
            decisionState.tone === "warning" &&
              "border-amber-300 bg-amber-50 text-[#7c2d12] dark:border-amber-400/40 dark:bg-amber-950/30 dark:text-amber-200",
            decisionState.tone === "info" &&
              "border-[#c8d2cd] bg-[#f5f4ed] text-[#34443b] dark:border-slate-700 dark:bg-[#172033] dark:text-slate-200",
          )}
          role="status"
        >
          <p className="font-extrabold">{decisionState.title}</p>
          <p className="mt-0.5">{decisionState.description}</p>
        </div>
      </div>

      {sections.map((section) => (
        <ReviewSection
          key={section.feedbackKey || section.title}
          record={record}
          section={section}
          value={reviewValue}
          onChange={onChange}
          onFieldChange={setReviewField}
          onSendFeedback={onSendFeedback}
        />
      ))}

      {fallbackFeedbackKeys.map((key) => (
        <ReviewSection
          key={key}
          record={record}
          section={{
            title: labelFromKey(key.replace(/Feedback$/, "")),
            feedbackKey: key,
            fields: [],
          }}
          value={reviewValue}
          onChange={onChange}
          onFieldChange={setReviewField}
          onSendFeedback={onSendFeedback}
        />
      ))}
    </div>
  );
}

function reviewDecisionState(approved) {
  if (approved === true) {
    return {
      tone: "success",
      title: "Aprobacion lista para confirmar",
      description: "La accion Aprobar abre la confirmacion y guarda la decision.",
    };
  }

  if (approved === false) {
    return {
      tone: "warning",
      title: "Correcciones listas para confirmar",
      description:
        "La accion Solicitar correcciones abre la confirmacion y devuelve el documento.",
    };
  }

  return {
    tone: "info",
    title: "Sin decision final",
    description:
      "Puedes enviar recomendaciones por apartado sin aprobar ni solicitar correcciones.",
  };
}

function ReviewSection({
  record,
  section,
  value,
  onChange,
  onFieldChange,
  onSendFeedback,
}) {
  return (
    <article className={reviewSectionClass}>
      <div className={reviewSectionHeaderClass}>
        <h3 className="text-sm font-[850] leading-tight text-[#111827] dark:text-slate-50">
          {section.title}
        </h3>
      </div>
      <div className="space-y-4 p-4">
        {section.fields?.length > 0 && (
          <div className={reviewFieldGridClass}>
            {section.fields.map((field) => (
              <ReviewValue
                field={field}
                key={field}
                label={labelFromKey(field)}
                value={record?.[field]}
              />
            ))}
          </div>
        )}

        {section.arrays?.map((arrayConfig) => (
          <ReviewArray
            config={arrayConfig}
            items={record?.[arrayConfig.key] || []}
            key={arrayConfig.key}
          />
        ))}

        {section.entryFeedback && (
          <EntryFeedbackList
            entries={record.entries || []}
            value={value}
            onChange={onChange}
            onSendFeedback={onSendFeedback}
          />
        )}

        {section.feedbackKey && (
          <FeedbackComposer
            label="Retroalimentacion"
            value={value?.[section.feedbackKey] || ""}
            onChange={(nextValue) =>
              onFieldChange(section.feedbackKey, nextValue)
            }
            onSubmit={(nextValue) =>
              onSendFeedback?.(
                { [section.feedbackKey]: nextValue },
                `Retroalimentacion enviada en ${section.title}`,
              )
            }
            sentAt={
              record?.reviewedAt || record?.updatedAt || record?.createdAt
            }
          />
        )}
      </div>
    </article>
  );
}

function isActiveApprovedEnrollment(enrollment) {
  return enrollment.status === "APPROVED" && enrollment.courseActive !== false;
}

function canSubmitRecord(record) {
  return (
    Boolean(record?.id) &&
    ["DRAFT", "NEEDS_CORRECTION", "SUBMITTED"].includes(
      String(record?.status || "").toUpperCase(),
    )
  );
}

function canEditRecord(record) {
  const status = String(record?.status || "").toUpperCase();

  return Boolean(record?.id) && status !== "APPROVED";
}

function canReviewRecord(record) {
  return (
    Boolean(record?.id) &&
    String(record?.status || "").toUpperCase() === "SUBMITTED"
  );
}

function canExportPdfRecord(record) {
  return (
    Boolean(record?.id) &&
    String(record?.status || "").toUpperCase() === "APPROVED"
  );
}

function ListFilters({
  filters,
  options,
  totalCount,
  visibleCount,
  onChange,
  onClear,
}) {
  const active = hasActiveFilters(filters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const selectFilterCount = countActiveSelectFilters(filters);

  return (
    <div className="rounded-lg border border-[#c8d2cd] bg-[#eef3f2] p-3 dark:border-slate-700 dark:bg-surface">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Field label="Buscar">
          <Input
            placeholder="Texto, estudiante, curso o tutor"
            type="search"
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
          />
        </Field>
        <div className="flex items-end gap-2">
          <SecondaryButton
            icon={SlidersHorizontal}
            onClick={() => setFiltersOpen(true)}
            type="button"
          >
            {selectFilterCount ? `Filtros (${selectFilterCount})` : "Filtros"}
          </SecondaryButton>
          <SecondaryButton
            disabled={!active}
            icon={XCircle}
            onClick={onClear}
            type="button"
          >
            Limpiar
          </SecondaryButton>
        </div>
      </div>
      <p className="mt-3 text-xs font-bold text-muted">
        {visibleCount} de {totalCount} registros
      </p>
      {filtersOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"
          role="dialog"
        >
          <div className="w-full max-w-3xl rounded-lg border border-[#c8d2cd] bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-surface">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-extrabold text-[#20282d] dark:text-slate-50">
                Filtros
              </h3>
              <button
                aria-label="Cerrar filtros"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[#c8d2cd] text-[#34443b] hover:bg-[#eef3f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#529914]/35 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setFiltersOpen(false)}
                type="button"
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DocumentSelectFilter
                label="Estado"
                options={options.statuses}
                value={filters.status}
                onChange={(value) => onChange("status", value)}
              />
              <DocumentSelectFilter
                label="Estudiante"
                options={options.students}
                value={filters.student}
                onChange={(value) => onChange("student", value)}
              />
              <DocumentSelectFilter
                label="Curso"
                options={options.courses}
                value={filters.course}
                onChange={(value) => onChange("course", value)}
              />
              <DocumentSelectFilter
                label="Tutor"
                options={options.tutors}
                value={filters.tutor}
                onChange={(value) => onChange("tutor", value)}
              />
              <DocumentSelectFilter
                label="Ciclo"
                options={options.cycles}
                value={filters.cycle}
                onChange={(value) => onChange("cycle", value)}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <SecondaryButton
                disabled={!active}
                icon={XCircle}
                onClick={onClear}
                type="button"
              >
                Limpiar
              </SecondaryButton>
              <PrimaryButton
                icon={CheckCircle2}
                onClick={() => setFiltersOpen(false)}
                type="button"
              >
                Aplicar
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentSelectFilter({ label, options, value, onChange }) {
  return (
    <Field label={label}>
      <Select
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function countActiveSelectFilters(filters) {
  return ["status", "student", "course", "tutor", "cycle"].filter((key) =>
    Boolean(String(filters?.[key] || "").trim()),
  ).length;
}

function hasActiveFilters(filters) {
  return Object.values(filters || {}).some((value) =>
    typeof value === "string" ? value.trim() !== "" : Boolean(value),
  );
}

function filterListRows(rows, filters) {
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

function buildFilterOptions(rows, getValue, getLabel = (value) => value) {
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

function buildMultiFilterOptions(rows, getValues, getLabel = (value) => value) {
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

function getStatusFilterValue(row) {
  return row?.status ?? row?.active ?? "";
}

function getStudentFilterValue(row) {
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

function getCourseFilterValue(row) {
  return firstDefinedValue([
    row?.courseName,
    row?.course?.name,
    row?.enrollment?.courseName,
    row?.name,
  ]);
}

function getTutorFilterValues(row) {
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

function getAcademicCycleFilterValue(row) {
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

function ReviewValue({ field = "", label, value }) {
  const wide = isLongReviewField(field, value);

  return (
    <div className={`${reviewFieldClass} ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-[0.78rem] font-extrabold uppercase text-[#34443b] dark:text-slate-300">
        {label}
      </span>
      <p className={reviewValueClass}>{formatValue(value, field)}</p>
    </div>
  );
}

function isLongReviewField(field, value) {
  return (
    /activities|resources|feedback|antecedents|conclusion|recommendation|methodology|mission|vision|values|objective|presentation|evidence/i.test(
      field,
    ) || String(value || "").length > 90
  );
}

function ReviewArray({ config, items }) {
  if (!items.length) {
    return (
      <p className={reviewEmptyClass}>
        Aun no hay informacion en {config.label.toLowerCase()}.
      </p>
    );
  }

  if (config.key === "scheduleWeeks") {
    return (
      <div className="grid gap-2">
        <span className="text-[0.78rem] font-extrabold uppercase text-[#34443b] dark:text-slate-300">
          {config.label}
        </span>
        <ActivityPlanScheduleMatrix weeks={items} />
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <span className="text-[0.78rem] font-extrabold uppercase text-[#34443b] dark:text-slate-300">
        {config.label}
      </span>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            className={reviewArrayItemClass}
            key={item.id || `${config.key}-${index}`}
          >
            <span className={reviewArrayIndexClass}>
              {config.itemLabel
                ? config.itemLabel(item, index)
                : `${config.label} ${index + 1}`}
            </span>
            <div className={reviewFieldGridClass}>
              {(config.fields || Object.keys(item)).map((field) => (
                <ReviewValue
                  field={field}
                  key={field}
                  label={labelFromKey(field)}
                  value={item?.[field]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackComposer({ label, value, onChange, onSubmit, sentAt }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [sending, setSending] = useState(false);
  const hasValue = String(value || "").trim().length > 0;
  const highlightClass = hasValue ? feedbackIconNewClass : "";

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  function updateDraft(nextValue) {
    setDraft(nextValue);
    onChange(nextValue);
  }

  async function sendFeedback() {
    if (!onSubmit) {
      return;
    }

    setSending(true);

    try {
      const sent = await onSubmit(draft);

      if (sent !== false) {
        setOpen(false);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="relative flex items-start gap-3">
        <button
          aria-expanded={open}
          aria-label={
            open ? "Cerrar retroalimentacion" : "Abrir retroalimentacion"
          }
          className={`${feedbackIconBaseClass} ${open ? feedbackIconActiveClass : ""} ${highlightClass}`}
          onClick={() => setOpen((current) => !current)}
          title={open ? "Cerrar retroalimentacion" : "Abrir retroalimentacion"}
          type="button"
        >
          <MessageCircle size={16} />
        </button>
        <div className="min-w-0 flex-1 rounded-lg border border-[#f4d2cf] bg-[#fff7f5] p-3 dark:border-slate-700 dark:bg-[#111827]">
          <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[0.78rem] font-extrabold uppercase text-[#34443b] dark:text-slate-300">
              {label}
            </span>
            {hasValue && sentAt && (
              <span className="text-xs leading-5 text-[#7f1d1d] dark:text-[#a8b4c7]">
                Enviado: {formatValue(sentAt, "reviewedAt")}
              </span>
            )}
          </div>
          {hasValue ? (
            <p className={reviewValueClass}>{value}</p>
          ) : (
            <p className={reviewEmptyClass}>Sin retroalimentacion</p>
          )}
        </div>
      </div>
      {open && (
        <div className="ml-[2.65rem] grid gap-2 rounded-lg border border-[#b9ddcf] bg-white p-2 dark:border-slate-700 dark:bg-surface">
          <Textarea
            value={draft}
            onChange={(event) => updateDraft(event.target.value)}
          />
          <div className="flex justify-end">
            <SecondaryButton
              disabled={sending || String(draft || "").trim().length === 0}
              icon={Send}
              loading={sending}
              onClick={sendFeedback}
              type="button"
            >
              Enviar retroalimentacion
            </SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

function EntryFeedbackList({ entries, value, onChange, onSendFeedback }) {
  if (!entries.length) {
    return <p className={reviewEmptyClass}>Sin actividades registradas.</p>;
  }

  return (
    <div className="grid gap-2">
      <span className="text-[0.78rem] font-extrabold uppercase text-[#34443b] dark:text-slate-300">
        Actividades registradas
      </span>
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div
            className={reviewArrayItemClass}
            key={entry.id || `entry-${index}`}
          >
            <span className={reviewArrayIndexClass}>{entryLabel(entry)}</span>
            <div className={reviewFieldGridClass}>
              {[
                "activityDate",
                "startTime",
                "endTime",
                "totalTime",
                "developedActivities",
                "evidenceLink",
              ].map((field) => (
                <ReviewValue
                  field={field}
                  key={field}
                  label={labelFromKey(field)}
                  value={entry?.[field]}
                />
              ))}
            </div>
            {entry.id && (
              <div className="space-y-3">
                <FeedbackComposer
                  label="Retroalimentacion"
                  value={entryFeedbackValue(value, entry.id, "feedback")}
                  onChange={(nextValue) =>
                    setEntryFeedbackValue(
                      value,
                      onChange,
                      entry.id,
                      "feedback",
                      nextValue,
                    )
                  }
                  onSubmit={(nextValue) =>
                    onSendFeedback?.(
                      {
                        entryFeedback: [
                          { entryId: entry.id, feedback: nextValue },
                        ],
                      },
                      `Retroalimentacion enviada en ${entryLabel(entry)}`,
                    )
                  }
                  sentAt={entry.updatedAt || entry.createdAt}
                />
                <FeedbackComposer
                  label="Sugerencias"
                  value={entryFeedbackValue(value, entry.id, "suggestions")}
                  onChange={(nextValue) =>
                    setEntryFeedbackValue(
                      value,
                      onChange,
                      entry.id,
                      "suggestions",
                      nextValue,
                    )
                  }
                  onSubmit={(nextValue) =>
                    onSendFeedback?.(
                      {
                        entryFeedback: [
                          { entryId: entry.id, suggestions: nextValue },
                        ],
                      },
                      `Sugerencia enviada en ${entryLabel(entry)}`,
                    )
                  }
                  sentAt={entry.updatedAt || entry.createdAt}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function entryFeedbackValue(value, entryId, key) {
  const feedback = (value?.entryFeedback || []).find(
    (item) => String(item.entryId) === String(entryId),
  );
  return feedback?.[key] || "";
}

function setEntryFeedbackValue(value, onChange, entryId, key, nextValue) {
  const currentFeedback = (value?.entryFeedback || []).filter(
    (item) => item?.entryId,
  );
  const feedbackIndex = currentFeedback.findIndex(
    (item) => String(item.entryId) === String(entryId),
  );
  const nextFeedback =
    feedbackIndex >= 0
      ? [...currentFeedback]
      : [...currentFeedback, { entryId }];
  const targetIndex =
    feedbackIndex >= 0 ? feedbackIndex : nextFeedback.length - 1;

  nextFeedback[targetIndex] = {
    ...nextFeedback[targetIndex],
    entryId,
    [key]: nextValue,
  };

  onChange({
    ...(value || {}),
    entryFeedback: nextFeedback,
  });
}

function getReviewSections(moduleId, record, reviewValue) {
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
      section("Presentacion", "presentationFeedback", ["presentation"]),
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
      section("Aprobacion", "approvalFeedback", []),
    ];
  }

  if (moduleId === "practice-reports") {
    return [
      section("Datos generales", "generalInfoFeedback", generalFields),
      section("Presentacion", "presentationFeedback", ["presentation"]),
      section("Objetivos", "objectivesFeedback", [
        "generalObjective",
        "specificObjective1",
        "specificObjective2",
        "specificObjective3",
      ]),
      section("Metodologia", "methodologyFeedback", ["methodology"]),
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
      section("Aprobacion", "approvalFeedback", []),
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
      section("Aprobacion", "approvalFeedback", []),
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

function isFeedbackReviewBody(value) {
  return Boolean(
    value?.approved !== undefined &&
    Object.keys(value).some((key) => /Feedback$/.test(key)),
  );
}

function normalizeReviewBody(value) {
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

function buildReviewValue(module, record, roles = []) {
  const value = cloneStructuredValue(module.reviewSample || { approved: null });
  const prefix = feedbackPrefixForReview(module.id, roles);

  return fillFeedbackReviewValue(value, record, prefix);
}

function buildActionBodiesForRecord(actions, module, record, roles = []) {
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

function getHashParams(hashValue = window.location.hash) {
  const query = String(hashValue || "").split("?")[1] || "";
  return new URLSearchParams(query);
}

function normalizeDeepLinkOperation(operation) {
  const allowed = ["detail", "review", "form", "actions"];

  return allowed.includes(operation) ? operation : "detail";
}

function getOperationTitle(operation, selected) {
  if (operation === "detail") {
    return selected ? "Detalle del documento" : "Detalle";
  }

  if (operation === "review") {
    return "Revision del documento";
  }

  if (operation === "actions") {
    return "Acciones";
  }

  return selected ? "Editar documento" : "Crear documento";
}

function mergeEditableValues(template, source) {
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

function fillEnrollmentInstitutionFields(body, enrollment) {
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

function getSecondaryRows(record) {
  if (!record) {
    return [];
  }

  return (
    record.attendances || record.attendanceRecords || record.sessions || []
  );
}

function periodLabel(period) {
  return (
    [
      period.dayOfWeek,
      period.place,
      [period.startTime, period.endTime].filter(Boolean).join(" - "),
    ]
      .filter(Boolean)
      .join(" - ") || "Periodo"
  );
}

function entryLabel(entry) {
  return (
    [
      entry.activityDate,
      entry.developedActivities || entry.activities || entry.feedback,
    ]
      .filter(Boolean)
      .join(" - ") || "Actividad"
  );
}

function enrollmentLabel(enrollment) {
  return (
    [
      enrollment.courseName,
      enrollment.studentFullName || enrollment.student,
      enrollment.educationalInstitutionName,
    ]
      .filter(Boolean)
      .join(" - ") || "Inscripcion"
  );
}

function secondaryLabel(item) {
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
