/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          useEndpointWorkspace.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente useEndpointWorkspace de la interfaz del SGP.
 */

import { getDocumentReadiness } from "./DocumentReadiness";
import { EntityImagePicker, entityImagePayload } from "../../../../components/ui/EntityImage";
import { EvidenceLinkPicker } from "./EvidencePicker";
import { cleanStructuredPayload, cloneStructuredValue } from "../../../../components/forms/StructuredForm";
import { apiBlob, unwrapPage } from "../../../../api/client";
import { buildActionBodiesForRecord, buildReviewValue, normalizeReviewBody } from "./reviewModel";
import { buildFilterOptions, buildMultiFilterOptions, filterListRows, getAcademicCycleFilterValue, getCourseFilterValue, getStatusFilterValue, getStudentFilterValue, getTutorFilterValues } from "./listFiltering";
import { canRunExtraAction, canUse, isActiveApprovedEnrollment } from "./documentPolicies";
import { enrollmentLabel, entryLabel, fillEnrollmentInstitutionFields, getHashParams, getSecondaryRows, mergeEditableValues, normalizeDeepLinkOperation, periodLabel } from "./workspaceHelpers";
import { filterInactiveForNonAdmin } from "../../../../utils/visibility";
import { formatValue } from "../../../../utils/format";
import { useConfirm } from "../../../../components/ui/ConfirmDialog";
import { useEffect, useMemo, useState } from "react";
import { usePracticeRequest, usePracticeWorkspace } from "../../../practices/context/PracticeWorkspaceContext";
import { useRecoverableDraft } from "../../../../hooks/useRecoverableDraft";

export function useEndpointWorkspace({ module, roles, token }) {
  const apiRequest = usePracticeRequest();
  const workspace = usePracticeWorkspace();
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
  const operational = !workspace || (workspace.status === 'APPROVED' && !workspace.archived && workspace.courseActive !== false);
  const canCreate = Boolean(
    operational && module.createPath && canUse(roles, module.createRoles),
  );
  const canUpdate = Boolean(
    operational && module.updatePath && canUse(roles, module.updateRoles),
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
  const [loadedListPath, setLoadedListPath] = useState(defaultListPath);
  const [enrollmentRows, setEnrollmentRows] = useState([]);
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const [evidencePhotosLoading, setEvidencePhotosLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [id, setId] = useState("");
  const [secondaryId, setSecondaryId] = useState("");
  const [letterheadFile, setLetterheadFile] = useState(null);
  const [previewPath, setPreviewPath] = useState('');
  useEffect(() => { setLetterheadFile(null); }, [id, module.id]);
  const letterheadPicker = (
    <EntityImagePicker
      contain
      label="Membrete institucional del L.3"
      helpText="Adjunta el encabezado completo de la institución como imagen JPG o PNG, máximo 4 MB y 4096 px por lado. Aparecerá en el PDF del L.3. Puedes guardar el borrador y adjuntarlo antes de la aprobación."
      file={letterheadFile}
      onChange={setLetterheadFile}
      currentPath={selected?.letterheadImageUrl}
    />
  );
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationAttempt, setValidationAttempt] = useState(0);

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
        canReview && selected && { id: "review", label: "Revisar" },
        visibleExtraActions.length && selected && { id: "actions", label: "Acciones" },
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
  useEffect(() => { setFieldErrors({}); }, [id, module.id, activeOperation]);
  const draft = useRecoverableDraft(`${module.id}:${workspace?.id || "global"}:${id || "new"}`, setBody, activeOperation === "form");
  const [listFilters, setListFilters] = useState({
    search: "",
    status: "",
    student: "",
    course: "",
    tutor: "",
    cycle: "",
  });
  const secondaryRows = getSecondaryRows(selected);
  useEffect(() => {
    if (workspace && activeOperation === 'form' && body && 'enrollmentId' in body && String(body.enrollmentId) !== String(workspace.id)) {
      setBody(current => ({ ...current, enrollmentId: workspace.id }));
    }
  }, [workspace, activeOperation, body]);
  const selectedEnrollmentId = body?.enrollmentId;
  const studentCreateNeedsEnrollment =
    autoStudentEnrollment && activeOperation === "form" && !id;
  const studentEnrollmentResolved =
    !studentCreateNeedsEnrollment || enrollmentRows.some(row => String(row.id) === String(body?.enrollmentId));
  const formHiddenFields = useMemo(
    () => [
      ...(module.hiddenFields || []),
      // Cambio solicitado: los datos precargados se conservan en el body,
      // pero no se muestran para que el formulario solo pida campos editables.
      ...(module.prefillFromEnrollment ? module.readOnlyFields || [] : []),
      ...((autoStudentEnrollment || workspace || (enrollmentRows.length === 1 && String(body?.enrollmentId) === String(enrollmentRows[0].id))) ? ["enrollmentId"] : []),
    ],
    [
      autoStudentEnrollment, workspace, enrollmentRows, body?.enrollmentId,
      module.hiddenFields,
      module.prefillFromEnrollment,
      module.readOnlyFields,
    ],
  );
  const formRelations = useMemo(() => {
    const relations = {
      schedulePeriodId: {
        label: "Período de horario",
        placeholder: selected
          ? "Seleccionar período"
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

    if (module.prefillFromEnrollment) {
      relations.enrollmentId = {
        label: "Inscripción",
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
  const availableEvidencePhotos = useMemo(() => {
    if (module.id !== "completed-records") {
      return [];
    }

    if (!body?.enrollmentId) {
      return evidencePhotos;
    }

    return evidencePhotos.filter(
      (photo) => String(photo.enrollmentId || "") === String(body.enrollmentId),
    );
  }, [body?.enrollmentId, evidencePhotos, module.id]);
  const customFormFields = useMemo(() => {
    if (module.id !== "completed-records") {
      return {};
    }

    return {
      evidenceLink: ({ value, onChange, readOnly }) => (
        <EvidenceLinkPicker
          loading={evidencePhotosLoading}
          photos={availableEvidencePhotos}
          readOnly={readOnly}
          token={token}
          value={value}
          onChange={onChange}
        />
      ),
    };
  }, [availableEvidencePhotos, evidencePhotosLoading, module.id, token]);
  const filteredRows = useMemo(
    () => filterListRows(rows, listFilters),
    [rows, listFilters],
  );
  const selectedExtraActions = visibleExtraActions.filter((action) =>
    canRunExtraAction(selected, action),
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
  const isOwnList = isStudent && loadedListPath === module.listPath;

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
      setLoadedListPath(path);
      if (isStudent && path === module.listPath) {
        setListFilters((current) => ({ ...current, student: "" }));
      }
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
  }, [module.id, token, apiRequest, defaultListPath]);

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
  }, [module, roles, token, apiRequest]);

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
    apiRequest,
    enrollmentRows,
    isStudent,
  ]);

  useEffect(() => {
    let active = true;

    if (module.id !== "completed-records" || activeOperation !== "form") {
      setEvidencePhotos([]);
      setEvidencePhotosLoading(false);
      return undefined;
    }

    async function loadEvidencePhotos() {
      setEvidencePhotosLoading(true);

      try {
        const payload = await apiRequest("/api/practice-photos/me", { token });

        if (active) {
          setEvidencePhotos(Array.isArray(payload) ? payload : unwrapPage(payload));
        }
      } catch (requestError) {
        if (active) {
          setEvidencePhotos([]);
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setEvidencePhotosLoading(false);
        }
      }
    }

    loadEvidencePhotos();

    return () => {
      active = false;
    };
  }, [activeOperation, module.id, token, apiRequest]);

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
        setActionBodies(buildActionBodiesForRecord(visibleExtraActions, module, payload, roles));

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
  }, [hashValue, module, roles, token, apiRequest, visibleExtraActions]);

  async function submitStructured(
    path,
    method,
    structuredBody = body,
    successMessage = "Operacion completada",
  ) {
    setLoading(true);
    setError("");
    setFieldErrors({});
    setMessage("");

    try {
      const payload = await apiRequest(path, {
        method,
        token,
        body: module.id === 'final-reports' && (activeOperation === 'form' || path.endsWith('/institutional-section') || path.endsWith('/letterhead'))
          ? entityImagePayload(cleanStructuredPayload(structuredBody), letterheadFile)
          : cleanStructuredPayload(structuredBody),
      });
      if (module.id === 'final-reports') setLetterheadFile(null);
      if (activeOperation === "form") draft.markClean();
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
      setFieldErrors(requestError.payload?.fieldErrors || {});
      setValidationAttempt(value => value + 1);
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
    successMessage = "Retroalimentación enviada",
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

    const readiness = getDocumentReadiness(module.id, record);

    if (confirmingSubmitId === record.id) {
      return;
    }

    setConfirmingSubmitId(record.id);

    try {
      const accepted = await confirm({
        title: "Enviar documento",
        description: readiness.complete
          ? "El documento se enviará a revisión. Después de enviarlo, los revisores autorizados podrán revisarlo."
          : "El documento se enviará a revisión con información pendiente. Podrás completarlo después si el revisor solicita ajustes o si el flujo lo devuelve a borrador.",
        details: readiness.complete
          ? module.title || "Documento de práctica"
          : `${module.title || "Documento de práctica"} | Pendiente: ${readiness.missing
            .slice(0, 4)
            .join(", ")}${readiness.missing.length > 4 ? "..." : ""}`,
        confirmLabel: "Enviar a revisión",
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
      link.download = module.pdfFilename || `${module.id}-${record.id}.pdf`;
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

  
  return {
    workspace,
    confirm,
    confirmingSubmitId,
    isStudent,
    accessibleAltLists,
    visibleExtraActions,
    canCreate,
    canUpdate,
    canExportPdf,
    canSubmit,
    canReview,
    canListPrimary,
    studentDirectDocumentMode,
    rows,
    enrollmentRows,
    selected,
    id,
    secondaryId,
    setSecondaryId,
    letterheadFile,
    previewPath,
    setPreviewPath,
    letterheadPicker,
    body,
    setBody,
    reviewBody,
    setReviewBody,
    actionBodies,
    setActionBodies,
    loading,
    enrollmentLoading,
    message,
    error,
    fieldErrors,
    setFieldErrors,
    validationAttempt,
    operationTabs,
    activeOperation,
    setActiveOperation,
    draft,
    listFilters,
    setListFilters,
    secondaryRows,
    studentCreateNeedsEnrollment,
    studentEnrollmentResolved,
    formHiddenFields,
    formRelations,
    customFormFields,
    filteredRows,
    selectedExtraActions,
    listFilterOptions,
    isOwnList,
    updateListFilter,
    clearListFilters,
    load,
    submitStructured,
    submitReviewPatch,
    submitRecord,
    downloadPdf,
    submitNoBody,
    selectRecord,
    openRecord,
    startCreate
  };
}
