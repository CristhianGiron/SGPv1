import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, ImagePlus, Maximize2, RefreshCw, Trash2, X } from 'lucide-react';
import { apiBlob, apiRequest, unwrapPage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/ui/Alert';
import { ActionBar, PrimaryButton, SecondaryButton } from '../components/ui/ActionBar';
import { ActionMenu } from '../components/ui/ActionMenu';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterPanel } from '../components/ui/FilterPanel';
import { Field, FileInput, Input, Select, Textarea } from '../components/ui/FormControls';
import { ModuleTab, ModuleTabs } from '../components/ui/ModuleTabs';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatBytes } from '../utils/format';

const REVIEW_ROLES = [
  'ROLE_TUTOR_PRACTICAS',
  'ROLE_TUTOR_INSTITUCIONAL',
  'ROLE_DIRECTOR_PRACTICAS',
  'ROLE_ADMIN',
];

const GROUPED_REVIEW_ROLES = [
  'ROLE_TUTOR_PRACTICAS',
  'ROLE_TUTOR_INSTITUCIONAL',
  'ROLE_DIRECTOR_PRACTICAS',
  'ROLE_ADMIN',
];

export function PhotosPage() {
  const { token, roles } = useAuth();
  const confirm = useConfirm();
  const isStudent = roles.includes('ROLE_ESTUDIANTE');
  const canReview = REVIEW_ROLES.some((role) => roles.includes(role));
  const canGroupReviewPhotos = GROUPED_REVIEW_ROLES.some((role) => roles.includes(role));
  const [enrollments, setEnrollments] = useState([]);
  const [myPhotos, setMyPhotos] = useState([]);
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [practiceDate, setPracticeDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState(isStudent ? 'mine' : 'review');
  const [reviewFilters, setReviewFilters] = useState({
    search: '',
    course: '',
    student: '',
    enrollment: '',
  });
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (isStudent) {
        const [studentEnrollments, studentPhotos] = await Promise.all([
          apiRequest('/api/enrollments/me', { token }),
          apiRequest('/api/practice-photos/me', { token }),
        ]);
        const loadedEnrollments = unwrapPage(studentEnrollments);
        const approvedActiveEnrollments = loadedEnrollments.filter(isActiveApprovedEnrollment);

        setEnrollments(loadedEnrollments);
        setMyPhotos(unwrapPage(studentPhotos));
        setSelectedEnrollmentId((current) =>
          approvedActiveEnrollments.some((enrollment) => String(enrollment.id) === String(current))
            ? current
            : approvedActiveEnrollments[0]?.id || ''
        );
      }

      if (canReview) {
        setReviewPhotos(await apiRequest('/api/practice-photos/review', { token }));
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token, isStudent, canReview]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    const availableViews = [
      isStudent && 'mine',
      isStudent && 'upload',
      canReview && 'review',
    ].filter(Boolean);

    if (availableViews.length && !availableViews.includes(activeView)) {
      setActiveView(availableViews[0]);
    }
  }, [activeView, canReview, isStudent]);

  async function handleUpload(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const enrollmentId = selectedEnrollmentId;

    if (!enrollmentId) {
      setError('Selecciona la inscripcion a la que pertenece la fotografia');
      return;
    }

    if (!selectedFile) {
      setError('Selecciona una fotografia');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('enrollmentId', enrollmentId);
      formData.append('file', selectedFile);

      if (description.trim()) {
        formData.append('description', description.trim());
      }

      if (practiceDate) {
        formData.append('practiceDate', practiceDate);
      }

      const uploadedPhoto = await apiRequest('/api/practice-photos', {
        method: 'POST',
        token,
        body: formData,
      });

      setSelectedFile(null);
      setDescription('');
      setPracticeDate('');
      form?.reset();
      setMyPhotos((current) => [uploadedPhoto, ...current.filter((photo) => photo.id !== uploadedPhoto.id)]);
      setActiveView('mine');
      setMessage('Evidencia subida correctamente.');
      await loadPhotos();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo) {
    const accepted = await confirm({
      title: 'Eliminar evidencia',
      description: 'La evidencia fotografica se quitara del registro. Revisa antes de continuar.',
      details: photo?.originalFilename || photo?.description || `Evidencia ${photo?.id || ''}`,
      confirmLabel: 'Eliminar evidencia',
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiRequest(`/api/practice-photos/${photo.id}`, {
        method: 'DELETE',
        token,
      });
      await loadPhotos();
      setMessage('Evidencia quitada.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(photo) {
    setError('');

    try {
      const blob = await apiBlob(photo.contentUrl, token);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = objectUrl;
      link.download = photo.originalFilename || `fotografia-${photo.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const approvedEnrollments = enrollments.filter(isActiveApprovedEnrollment);
  const filteredReviewPhotos = useMemo(
    () => filterPhotos(reviewPhotos, reviewFilters),
    [reviewFilters, reviewPhotos]
  );
  const reviewFilterOptions = useMemo(
    () => ({
      courses: buildOptions(reviewPhotos, (photo) => photo.courseName),
      students: buildOptions(reviewPhotos, (photo) => photo.studentFullName || photo.studentUsername),
      enrollments: buildOptions(reviewPhotos, (photo) => enrollmentLabelFromPhoto(photo)),
    }),
    [reviewPhotos]
  );

  return (
    <>
      <PageHeader
        eyebrow="Evidencias"
        title="Evidencias fotograficas"
        description="Sube, consulta y revisa fotografias relacionadas con la practica."
        action={
          <SecondaryButton icon={RefreshCw} loading={loading} onClick={loadPhotos} type="button">
            Actualizar
          </SecondaryButton>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <SectionCard>
        <ModuleTabs>
          {[
            isStudent && ['mine', 'Mis evidencias'],
            isStudent && ['upload', 'Subir evidencia'],
            canReview && ['review', 'Por revisar'],
          ]
            .filter(Boolean)
            .map(([id, label]) => (
              <ModuleTab
                active={activeView === id}
                key={id}
                onClick={() => setActiveView(id)}
              >
                {label}
              </ModuleTab>
            ))}
        </ModuleTabs>
      </SectionCard>

      {isStudent && activeView === 'upload' && (
        <SectionCard
          title="Agregar evidencia"
          action={<span className="text-sm text-muted">{approvedEnrollments.length} paralelos activos</span>}
        >
          {approvedEnrollments.length === 0 && (
            <Alert tone="info">Necesitas una inscripcion aprobada en un paralelo activo para subir evidencias.</Alert>
          )}
          {approvedEnrollments.length > 0 && (
            <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleUpload}>
              <Field label="Paralelo de practica">
                <Select
                  value={selectedEnrollmentId}
                  onChange={(event) => setSelectedEnrollmentId(event.target.value)}
                >
                  {approvedEnrollments.map((enrollment) => (
                    <option key={enrollment.id} value={enrollment.id}>
                      {enrollmentLabel(enrollment)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Fecha">
                <Input
                  type="date"
                  value={practiceDate}
                  onChange={(event) => setPracticeDate(event.target.value)}
                />
              </Field>
              <Field label="Fotografia">
                <FileInput
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
              </Field>
              <Field className="lg:col-span-2" label="Descripcion de la evidencia">
                <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
              </Field>
              <div className="lg:col-span-2">
                <PrimaryButton icon={ImagePlus} loading={uploading} type="submit">
                  {uploading ? 'Subiendo...' : 'Subir evidencia'}
                </PrimaryButton>
              </div>
            </form>
          )}
        </SectionCard>
      )}

      {isStudent && activeView === 'mine' && (
        <PhotoSection
          canDelete
          emptyText="Aun no has subido evidencias fotograficas."
          photos={myPhotos}
          title="Mis evidencias"
          token={token}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onOpen={setFullscreenPhoto}
        />
      )}
      {canReview && activeView === 'review' && !isStudent && (
        <PhotoReviewFilters
          filters={reviewFilters}
          options={reviewFilterOptions}
          totalCount={reviewPhotos.length}
          visibleCount={filteredReviewPhotos.length}
          onChange={setReviewFilters}
        />
      )}
      {canReview && activeView === 'review' && canGroupReviewPhotos && (
        <GroupedPhotoSection
          emptyText="No hay evidencias pendientes de revision."
          photos={filteredReviewPhotos}
          token={token}
          onDownload={handleDownload}
          onOpen={setFullscreenPhoto}
        />
      )}
      {canReview && activeView === 'review' && !canGroupReviewPhotos && (
        <PhotoSection
          emptyText="No hay evidencias pendientes de revision."
          photos={filteredReviewPhotos}
          title="Evidencias por revisar"
          token={token}
          onDownload={handleDownload}
          onOpen={setFullscreenPhoto}
        />
      )}
      {fullscreenPhoto && (
        <PhotoFullscreen photo={fullscreenPhoto} token={token} onClose={() => setFullscreenPhoto(null)} />
      )}
    </>
  );
}

function isActiveApprovedEnrollment(enrollment) {
  return enrollment.status === 'APPROVED' && enrollment.courseActive !== false;
}

function PhotoSection({ title, photos, token, emptyText, canDelete = false, onDelete, onDownload, onOpen }) {
  return (
    <SectionCard title={title} action={<span className="text-sm text-muted">{photos.length}</span>}>
      {photos.length === 0 ? (
        <EmptyState text={emptyText} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard
              canDelete={canDelete}
              key={photo.id}
              photo={photo}
              token={token}
              onDelete={onDelete}
              onDownload={onDownload}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function PhotoReviewFilters({ filters, options, totalCount, visibleCount, onChange }) {
  function setFilter(key, value) {
    onChange((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <FilterPanel
      activeCount={countActiveFilters(filters, ['search'])}
      hasActiveFilters={countActiveFilters(filters) > 0}
      onClear={() => onChange({ search: '', course: '', student: '', enrollment: '' })}
      search={(
        <Field label="Buscar">
          <Input
            placeholder="Descripcion, archivo, paralelo o estudiante"
            type="search"
            value={filters.search}
            onChange={(event) => setFilter('search', event.target.value)}
          />
        </Field>
      )}
      summary={`${visibleCount} de ${totalCount} fotografias`}
      title="Filtrar fotografias"
    >
        <Field label="Paralelo">
          <Select value={filters.course} onChange={(event) => setFilter('course', event.target.value)}>
            <option value="">Todos</option>
            {options.courses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estudiante">
          <Select value={filters.student} onChange={(event) => setFilter('student', event.target.value)}>
            <option value="">Todos</option>
            {options.students.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Inscripcion">
          <Select value={filters.enrollment} onChange={(event) => setFilter('enrollment', event.target.value)}>
            <option value="">Todas</option>
            {options.enrollments.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
    </FilterPanel>
  );
}

function filterPhotos(photos, filters) {
  const terms = normalizeText(filters.search).split(/\s+/).filter(Boolean);

  return photos.filter((photo) => {
    if (filters.course && photo.courseName !== filters.course) {
      return false;
    }

    const student = photo.studentFullName || photo.studentUsername || 'Estudiante';
    if (filters.student && student !== filters.student) {
      return false;
    }

    if (filters.enrollment && enrollmentLabelFromPhoto(photo) !== filters.enrollment) {
      return false;
    }

    if (!terms.length) {
      return true;
    }

    const haystack = normalizeText([
      photo.enrollmentId,
      photo.courseName,
      photo.studentFullName,
      photo.studentUsername,
      photo.studentIdentification,
      photo.description,
      photo.originalFilename,
      photo.practiceDate,
    ].filter(Boolean).join(' '));

    return terms.every((term) => haystack.includes(term));
  });
}

function countActiveFilters(filters, excludeKeys = []) {
  return Object.entries(filters || {})
    .filter(([key]) => !excludeKeys.includes(key))
    .filter(([, value]) => String(value || '').trim())
    .length;
}

function buildOptions(items, getValue) {
  const options = new Map();

  items.forEach((item) => {
    const value = getValue(item);

    if (value && !options.has(value)) {
      options.set(value, {
        value,
        label: value,
      });
    }
  });

  return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .trim();
}

function enrollmentLabel(enrollment) {
  const parts = [
    enrollment.courseName,
    enrollment.groupName && `Grupo ${enrollment.groupName}`,
  ].filter(Boolean);

  return parts.join(' - ') || 'Paralelo de practica';
}

function enrollmentLabelFromPhoto(photo) {
  return [
    photo.courseName,
  ].filter(Boolean).join(' - ');
}

function GroupedPhotoSection({ photos, token, emptyText, onDownload, onOpen }) {
  const groups = groupPhotosByEnrollment(photos);

  if (photos.length === 0) {
    return (
      <SectionCard title="Evidencias por estudiante" action={<span className="text-sm text-muted">0</span>}>
        <EmptyState text={emptyText} />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <SectionCard
          action={<span className="text-sm text-muted">{group.photos.length}</span>}
          description={group.description}
          key={group.key}
          title={group.label}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {group.photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                token={token}
                onDownload={onDownload}
                onOpen={onOpen}
              />
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function groupPhotosByEnrollment(photos) {
  const groups = new Map();

  photos.forEach((photo) => {
    const key = String(photo.enrollmentId || photo.id);

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: photo.studentFullName || photo.studentUsername || 'Estudiante',
        enrollmentLabel: enrollmentLabelFromPhoto(photo),
        photos: [],
      });
    }

    groups.get(key).photos.push(photo);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      description: group.enrollmentLabel,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

function PhotoCard({ photo, token, canDelete = false, onDelete, onDownload, onOpen }) {
  const actions = [
    {
      key: 'view',
      label: 'Ver',
      icon: Maximize2,
      onClick: () => onOpen?.(photo),
    },
    {
      key: 'download',
      label: 'Descargar',
      icon: Download,
      onClick: () => onDownload?.(photo),
    },
  ];

  if (canDelete) {
    actions.push({
      key: 'delete',
      label: 'Quitar',
      icon: Trash2,
      onClick: () => onDelete?.(photo),
    });
  }

  return (
    <article className="overflow-hidden rounded-lg border border-[#c8d2cd] bg-white dark:border-slate-700 dark:bg-surface">
      <PhotoPreview photo={photo} token={token} onOpen={onOpen} />
      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#20282d] dark:text-slate-50">{photo.courseName || photo.originalFilename}</p>
            <p className="text-xs text-muted">{photo.studentFullName || photo.studentUsername || 'Estudiante'}</p>
            <p className="text-xs text-muted">Evidencia de practica</p>
          </div>
          <StatusBadge status={photo.practiceDate ? 'COMPLETED' : 'DRAFT'} />
        </div>
        {photo.description && <p className="line-clamp-3 text-sm text-[#34443b] dark:text-slate-200">{photo.description}</p>}
        <div className="flex items-center justify-between gap-3">
          <ActionBar>
            <span className="text-xs text-muted">{photo.practiceDate || 'Sin fecha'}</span>
            <span className="text-xs text-muted">{formatBytes(photo.fileSize)}</span>
          </ActionBar>
          <ActionMenu actions={actions} label="Acciones de evidencia" />
        </div>
      </div>
    </article>
  );
}

function PhotoPreview({ photo, token, onOpen }) {
  const [source, setSource] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    setSource('');
    setFailed(false);

    if (!photo.contentUrl) {
      setFailed(true);
      return undefined;
    }

    apiBlob(photo.contentUrl, token)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);

        if (active) {
          setSource(objectUrl);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [photo.contentUrl, token]);

  if (!source || failed) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-[#eef3f2] text-sm font-medium text-muted dark:bg-surface-soft">
        {failed ? 'Vista no disponible' : 'Cargando'}
      </div>
    );
  }

  return (
    <button
      aria-label="Ver fotografia en pantalla completa"
      className="block w-full bg-[#eef3f2] dark:bg-surface-soft"
      onClick={() => onOpen?.(photo)}
      type="button"
    >
      <img
        alt={photo.description || photo.originalFilename || 'Fotografia de practica'}
        className="aspect-[4/3] w-full object-cover"
        onError={() => setFailed(true)}
        src={source}
      />
    </button>
  );
}

function PhotoFullscreen({ photo, token, onClose }) {
  const [source, setSource] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    setSource('');
    setFailed(false);

    apiBlob(photo.contentUrl, token)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);

        if (active) {
          setSource(objectUrl);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [photo.contentUrl, token]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100001] flex items-center justify-center bg-zinc-950/95 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute right-4 top-4">
        <SecondaryButton icon={X} onClick={onClose} type="button">
          Cerrar
        </SecondaryButton>
      </div>
      <div className="max-h-full max-w-full" onMouseDown={(event) => event.stopPropagation()}>
        {!source || failed ? (
          <div className="flex h-80 w-[min(90vw,42rem)] items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-zinc-200">
            {failed ? 'Vista no disponible' : 'Cargando'}
          </div>
        ) : (
          <img
            alt={photo.description || photo.originalFilename || 'Fotografia de practica'}
            className="max-h-[88vh] max-w-[96vw] object-contain"
            onError={() => setFailed(true)}
            src={source}
          />
        )}
      </div>
    </div>
  );
}
